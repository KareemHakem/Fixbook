<?php

namespace Database\Seeders;

use App\Models\Offer;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@fixbook.test',
            'full_name' => 'FixBook Admin',
        ]);

        $homeowners = User::factory(5)->create();
        $skilled = User::factory(5)->skilled()->create();

        Post::factory(10)
            ->recycle($homeowners)
            ->create()
            ->each(function (Post $post) use ($skilled) {
                // Distinct skilled users per post: offers are unique on (post_id, skilled_user_id).
                $bidders = $skilled->random(min(rand(0, 3), $skilled->count()));

                foreach ($bidders as $bidder) {
                    Offer::factory()->for($post)->create(['skilled_user_id' => $bidder->id]);
                }
            });
    }
}
