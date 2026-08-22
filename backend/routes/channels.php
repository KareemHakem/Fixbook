<?php

use App\Models\Chat;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{chatId}', function ($user, int $chatId) {
    $chat = Chat::find($chatId);

    return $chat && ($chat->normal_user_id === $user->id || $chat->skilled_user_id === $user->id);
});
