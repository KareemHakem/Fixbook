<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Offer;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'offer_id' => Offer::factory(),
            'post_id' => fn (array $attributes) => Offer::find($attributes['offer_id'])->post_id,
            'normal_user_id' => fn (array $attributes) => Offer::find($attributes['offer_id'])->post->user_id,
            'skilled_user_id' => fn (array $attributes) => Offer::find($attributes['offer_id'])->skilled_user_id,
            'scheduled_date' => fake()->dateTimeBetween('+1 day', '+1 month')->format('Y-m-d'),
            'scheduled_time' => '10:00',
            'contact_phone' => fake()->phoneNumber(),
            'location' => fake()->address(),
            'status' => OrderStatus::Pending,
        ];
    }
}
