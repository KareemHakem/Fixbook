<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->when(
                $request->user()?->id === $this->id || $request->user()?->isAdmin(),
                $this->email
            ),
            'role' => $this->role->value,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'address' => $this->address,
            'avatar_url' => $this->avatar_url,
            'created_at' => $this->created_at?->toISOString(),
            'skilled_profile' => new SkilledProfileResource($this->whenLoaded('skilledProfile')),
        ];
    }
}
