<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'normal_user_id' => fn (array $attributes) => Order::find($attributes['order_id'])->normal_user_id,
            'skilled_user_id' => fn (array $attributes) => Order::find($attributes['order_id'])->skilled_user_id,
            'rating' => fake()->numberBetween(1, 5),
            'review_text' => fake()->paragraph(),
        ];
    }
}
