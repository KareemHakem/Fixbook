<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Http\Resources\ChatResource;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\User;
use App\Notifications\MessageReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ChatController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $chats = Chat::with(['normalUser', 'skilledUser', 'post'])
            ->where(fn ($q) => $q->where('normal_user_id', $user->id)->orWhere('skilled_user_id', $user->id))
            ->withCount(['messages as unread_messages_count' => fn ($q) => $q->where('is_read', false)->where('sender_id', '!=', $user->id),
            ])
            ->orderByDesc('last_message_at')
            ->paginate(min((int) $request->query('per_page', 20), 50));

        return ChatResource::collection($chats);
    }

    public function store(Request $request): JsonResponse
    {
        $request->user()->can('create', Chat::class) || abort(403);

        $validated = $request->validate([
            'skilled_user_id' => ['required', 'integer', 'exists:users,id'],
            'post_id' => ['nullable', 'integer', 'exists:posts,id'],
        ]);

        $skilled = User::findOrFail($validated['skilled_user_id']);
        abort_if(! $skilled->isSkilled(), 422, 'Chats can only be started with skilled users.');

        // firstOrCreate on the unique pair is race-safe thanks to the unique index.
        $chat = Chat::firstOrCreate(
            [
                'normal_user_id' => $request->user()->id,
                'skilled_user_id' => $skilled->id,
            ],
            ['post_id' => $validated['post_id'] ?? null]
        );

        return response()->json(
            new ChatResource($chat->load(['normalUser', 'skilledUser', 'post'])),
            $chat->wasRecentlyCreated ? 201 : 200
        );
    }

    public function messages(Request $request, Chat $chat): AnonymousResourceCollection
    {
        $request->user()->can('view', $chat) || abort(403);

        $messages = $chat->messages()
            ->with('sender')
            ->oldest()
            ->paginate(min((int) $request->query('per_page', 50), 100));

        return MessageResource::collection($messages);
    }

    public function sendMessage(SendMessageRequest $request, Chat $chat): JsonResponse
    {
        $message = $chat->messages()->create([
            'sender_id' => $request->user()->id,
            'content' => $request->content,
        ]);

        $recipient = $chat->normal_user_id === $request->user()->id
            ? $chat->skilledUser
            : $chat->normalUser;

        $recipient->notify(new MessageReceived($message));

        return response()->json(new MessageResource($message->load('sender')), 201);
    }

    public function markRead(Request $request, Chat $chat): JsonResponse
    {
        $request->user()->can('view', $chat) || abort(403);

        $updated = $chat->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['marked_read' => $updated]);
    }
}
