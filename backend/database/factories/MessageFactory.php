<?php

namespace Database\Factories;

use App\Models\Chat;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'chat_id' => Chat::factory(),
            'sender_id' => fn (array $attributes) => Chat::find($attributes['chat_id'])->normal_user_id,
            'content' => fake()->sentence(),
            'is_read' => false,
        ];
    }
}
