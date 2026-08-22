<?php

namespace App\Http\Controllers\Api;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(array_column(PostStatus::cases(), 'value'))],
            'mine' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $posts = Post::with('user')
            ->withCount('offers')
            ->when($validated['mine'] ?? false, fn ($q) => $q->where('user_id', $request->user()->id))
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status), fn ($q) => $q->board())
            ->when($validated['search'] ?? null, function ($q, $search) {
                $q->where(fn ($inner) => $inner
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return PostResource::collection($posts);
    }

    public function show(Post $post): PostResource
    {
        return new PostResource($post->load(['user', 'activeOrder'])->loadCount('offers'));
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->safe()->only(['title', 'description']);

        if ($request->hasFile('image')) {
            $data['image_url'] = $request->file('image')->store("post-images/{$request->user()->id}", 'public');
        }

        $post = $request->user()->posts()->create($data);

        return response()->json(new PostResource($post->load('user')), 201);
    }

    public function update(UpdatePostRequest $request, Post $post): PostResource
    {
        $data = $request->safe()->only(['title', 'description', 'status']);

        if ($request->hasFile('image')) {
            if ($post->image_url) {
                Storage::disk('public')->delete($post->image_url);
            }
            $data['image_url'] = $request->file('image')->store("post-images/{$request->user()->id}", 'public');
        }

        $post->update($data);

        return new PostResource($post->fresh()->load('user'));
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $request->user()->can('delete', $post) || abort(403);

        if ($post->image_url) {
            Storage::disk('public')->delete($post->image_url);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }
}
