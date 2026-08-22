<?php

namespace Tests\Feature;

use App\Enums\OfferStatus;
use App\Enums\PostStatus;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function createOrderPayload(Offer $offer): array
    {
        return [
            'offer_id' => $offer->id,
            'scheduled_date' => now()->addWeek()->toDateString(),
            'scheduled_time' => '10:00',
            'contact_phone' => '+37060000000',
            'location' => 'Vilnius, Lithuania',
        ];
    }

    public function test_post_owner_can_create_order_from_offer(): void
    {
        $offer = Offer::factory()->create();

        $this->actingAs($offer->post->user)
            ->postJson('/api/orders', $this->createOrderPayload($offer))
            ->assertCreated();

        $this->assertDatabaseHas('orders', [
            'offer_id' => $offer->id,
            'post_id' => $offer->post_id,
            'status' => 'pending',
        ]);
    }

    public function test_only_one_active_order_per_post(): void
    {
        $post = Post::factory()->create();
        $offerA = Offer::factory()->for($post)->create();
        $offerB = Offer::factory()->for($post)->create();

        $this->actingAs($post->user)->postJson('/api/orders', $this->createOrderPayload($offerA))->assertCreated();
        $this->actingAs($post->user)->postJson('/api/orders', $this->createOrderPayload($offerB))->assertUnprocessable();
    }

    public function test_accepting_order_updates_post_and_offers(): void
    {
        $post = Post::factory()->create();
        $offerA = Offer::factory()->for($post)->create();
        $offerB = Offer::factory()->for($post)->create();
        $order = Order::factory()->create(['offer_id' => $offerA->id, 'post_id' => $post->id]);

        $this->actingAs($offerA->skilledUser)
            ->postJson("/api/orders/{$order->id}/accept")
            ->assertOk();

        $this->assertEquals(PostStatus::InProgress, $post->fresh()->status);
        $this->assertEquals(OfferStatus::Ordered, $offerA->fresh()->status);
        $this->assertEquals(OfferStatus::Declined, $offerB->fresh()->status);
    }

    public function test_declining_order_reopens_post(): void
    {
        $post = Post::factory()->create(['status' => 'in_progress']);
        $offer = Offer::factory()->for($post)->create();
        $order = Order::factory()->create(['offer_id' => $offer->id, 'post_id' => $post->id]);

        $this->actingAs($offer->skilledUser)
            ->postJson("/api/orders/{$order->id}/decline")
            ->assertOk();

        $this->assertEquals(PostStatus::Open, $post->fresh()->status);
        $this->assertEquals(OfferStatus::Declined, $offer->fresh()->status);
    }

    public function test_completing_order_completes_post(): void
    {
        $post = Post::factory()->create(['status' => 'in_progress']);
        $offer = Offer::factory()->for($post)->create(['status' => 'ordered']);
        $order = Order::factory()->create([
            'offer_id' => $offer->id,
            'post_id' => $post->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($offer->skilledUser)
            ->postJson("/api/orders/{$order->id}/complete")
            ->assertOk();

        $this->assertEquals(PostStatus::Completed, $post->fresh()->status);
    }

    public function test_normal_user_cannot_accept_order(): void
    {
        $order = Order::factory()->create();

        $this->actingAs($order->normalUser)
            ->postJson("/api/orders/{$order->id}/accept")
            ->assertForbidden();
    }

    public function test_stranger_cannot_view_order(): void
    {
        $order = Order::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }
}
