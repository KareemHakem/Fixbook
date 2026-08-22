<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(User $user): UserResource
    {
        return new UserResource($user->load('skilledProfile'));
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $data = $request->safe()->only(['full_name', 'phone', 'address']);

        if ($request->hasFile('avatar')) {
            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }
            $data['avatar_url'] = $request->file('avatar')->store("avatars/{$user->id}", 'public');
        }

        $user->update($data);

        if ($user->isSkilled() && $request->hasAny(['bio', 'skills'])) {
            $user->skilledProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $request->safe()->only(['bio', 'skills'])
            );
        }

        return new UserResource($user->fresh()->load('skilledProfile'));
    }

    public function skilled(Request $request): AnonymousResourceCollection
    {
        $users = User::where('role', 'skilled')
            ->with('skilledProfile')
            ->when($request->query('skill'), function ($query, $skill) {
                $query->whereHas('skilledProfile', fn ($q) => $q->whereJsonContains('skills', $skill));
            })
            ->when($request->query('search'), function ($query, $search) {
                $query->where('full_name', 'like', "%{$search}%");
            })
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->query('per_page', 15), 50));

        return UserResource::collection($users);
    }

    public function updatePushToken(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => ['nullable', 'string', 'max:255'],
        ]);

        $request->user()->update($validated);

        return response()->json(['message' => 'Push token updated']);
    }
}
