<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SkilledProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'bio' => $this->bio,
            'skills' => $this->skills ?? [],
            'rating' => (float) $this->rating,
            'review_count' => $this->review_count,
        ];
    }
}
