<?php

namespace Database\Factories;

use App\Enums\OfferStatus;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OfferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'skilled_user_id' => User::factory()->skilled(),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 50, 2000),
            'status' => OfferStatus::Pending,
        ];
    }
}
