<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'post_id' => $this->post_id,
            'offer_id' => $this->offer_id,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'scheduled_time' => $this->scheduled_time,
            'contact_phone' => $this->contact_phone,
            'location' => $this->location,
            'status' => $this->status->value,
            'review_left' => $this->review_left,
            'created_at' => $this->created_at?->toISOString(),
            'post' => new PostResource($this->whenLoaded('post')),
            'offer' => new OfferResource($this->whenLoaded('offer')),
            'normal_user' => new UserResource($this->whenLoaded('normalUser')),
            'skilled_user' => new UserResource($this->whenLoaded('skilledUser')),
        ];
    }
}
