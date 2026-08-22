<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private function completedOrder(): Order
    {
        return Order::factory()->create(['status' => 'completed']);
    }

    public function test_review_allowed_after_order_completed(): void
    {
        $order = $this->completedOrder();

        $this->actingAs($order->normalUser)->postJson('/api/reviews', [
            'order_id' => $order->id,
            'rating' => 5,
            'review_text' => 'Excellent work!',
        ])->assertCreated();

        $this->assertTrue($order->fresh()->review_left);
    }

    public function test_review_rejected_before_completion(): void
    {
        $order = Order::factory()->create(['status' => 'accepted']);

        $this->actingAs($order->normalUser)->postJson('/api/reviews', [
            'order_id' => $order->id,
            'rating' => 5,
        ])->assertForbidden();
    }

    public function test_only_one_review_per_order(): void
    {
        $order = $this->completedOrder();
        Review::factory()->create([
            'order_id' => $order->id,
            'normal_user_id' => $order->normal_user_id,
            'skilled_user_id' => $order->skilled_user_id,
        ]);

        $this->actingAs($order->normalUser)->postJson('/api/reviews', [
            'order_id' => $order->id,
            'rating' => 4,
        ])->assertForbidden();
    }

    public function test_rating_recalculated_on_review_create_and_delete(): void
    {
        $orderA = $this->completedOrder();
        $orderB = Order::factory()->create([
            'status' => 'completed',
            'skilled_user_id' => $orderA->skilled_user_id,
        ]);

        Review::factory()->create([
            'order_id' => $orderA->id,
            'normal_user_id' => $orderA->normal_user_id,
            'skilled_user_id' => $orderA->skilled_user_id,
            'rating' => 4,
        ]);
        $reviewB = Review::factory()->create([
            'order_id' => $orderB->id,
            'normal_user_id' => $orderB->normal_user_id,
            'skilled_user_id' => $orderA->skilled_user_id,
            'rating' => 2,
        ]);

        $profile = User::find($orderA->skilled_user_id)->skilledProfile;
        $this->assertEquals(3.0, (float) $profile->rating);
        $this->assertEquals(2, $profile->review_count);

        $reviewB->delete();

        $profile->refresh();
        $this->assertEquals(4.0, (float) $profile->rating);
        $this->assertEquals(1, $profile->review_count);
    }
}
