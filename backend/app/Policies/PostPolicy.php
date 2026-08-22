<?php

namespace App\Policies;

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Post $post): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isNormal() || $user->isAdmin();
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isNormal()
            && $post->user_id === $user->id
            && in_array($post->status, [PostStatus::Open, PostStatus::InProgress]);
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->isAdmin() || ($user->isNormal() && $post->user_id === $user->id);
    }
}
