<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SkilledProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'bio' => fake()->paragraph(),
            'skills' => fake()->randomElements(
                ['plumbing', 'electrical', 'carpentry', 'painting', 'hvac', 'roofing'],
                2
            ),
            'rating' => 0,
            'review_count' => 0,
        ];
    }
}
