<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MessageReceived extends Notification
{
    use Queueable;

    public function __construct(public readonly Message $message) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'message_received',
            'chat_id' => $this->message->chat_id,
            'message_id' => $this->message->id,
            'sender_name' => $this->message->sender->full_name,
            'preview' => mb_strimwidth($this->message->content, 0, 80, '...'),
        ];
    }
}
