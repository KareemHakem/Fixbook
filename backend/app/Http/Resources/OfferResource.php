<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'post_id' => $this->post_id,
            'description' => $this->description,
            'price' => (float) $this->price,
            'status' => $this->status->value,
            'created_at' => $this->created_at?->toISOString(),
            'skilled_user' => new UserResource($this->whenLoaded('skilledUser')),
            'post' => new PostResource($this->whenLoaded('post')),
        ];
    }
}
