<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Post;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_stats(): void
    {
        $admin = User::factory()->admin()->create();
        $users = User::factory(3)->create();
        Post::factory(2)->recycle($users)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/stats');

        $response->assertOk()
            ->assertJsonPath('users.total', 3)
            ->assertJsonPath('users.normal', 3);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/admin/stats')->assertForbidden();
        $this->actingAs(User::factory()->skilled()->create())->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_can_delete_user_but_not_another_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $otherAdmin = User::factory()->admin()->create();

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$user->id}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/admin/users/{$otherAdmin->id}")->assertUnprocessable();
    }

    public function test_admin_review_delete_recalculates_rating(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'completed']);
        $review = Review::factory()->create([
            'order_id' => $order->id,
            'normal_user_id' => $order->normal_user_id,
            'skilled_user_id' => $order->skilled_user_id,
            'rating' => 5,
        ]);

        $this->assertEquals(5.0, (float) $order->skilledUser->skilledProfile->fresh()->rating);

        $this->actingAs($admin)->deleteJson("/api/admin/reviews/{$review->id}")->assertOk();

        $profile = $order->skilledUser->skilledProfile->fresh();
        $this->assertEquals(0.0, (float) $profile->rating);
        $this->assertEquals(0, $profile->review_count);
    }
}
