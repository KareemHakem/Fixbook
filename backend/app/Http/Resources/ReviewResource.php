<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'rating' => $this->rating,
            'review_text' => $this->review_text,
            'created_at' => $this->created_at?->toISOString(),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'skilled_user' => new UserResource($this->whenLoaded('skilledUser')),
        ];
    }
}
