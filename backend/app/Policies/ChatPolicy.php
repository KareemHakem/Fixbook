<?php

namespace App\Policies;

use App\Models\Chat;
use App\Models\User;

class ChatPolicy
{
    public function view(User $user, Chat $chat): bool
    {
        return $this->isParticipant($user, $chat);
    }

    public function create(User $user): bool
    {
        return $user->isNormal() || $user->isAdmin();
    }

    public function sendMessage(User $user, Chat $chat): bool
    {
        return $this->isParticipant($user, $chat);
    }

    private function isParticipant(User $user, Chat $chat): bool
    {
        return $chat->normal_user_id === $user->id
            || $chat->skilled_user_id === $user->id
            || $user->isAdmin();
    }
}
