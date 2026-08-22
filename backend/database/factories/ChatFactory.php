<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChatFactory extends Factory
{
    public function definition(): array
    {
        return [
            'normal_user_id' => User::factory(),
            'skilled_user_id' => User::factory()->skilled(),
        ];
    }
}
