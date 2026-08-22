<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'post_id' => $this->post_id,
            'last_message_at' => $this->last_message_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'normal_user' => new UserResource($this->whenLoaded('normalUser')),
            'skilled_user' => new UserResource($this->whenLoaded('skilledUser')),
            'post_title' => $this->whenLoaded('post', fn () => $this->post?->title),
            'unread_count' => $this->whenCounted('unreadMessages'),
        ];
    }
}
