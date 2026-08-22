<?php

namespace Tests\Feature;

use App\Models\Offer;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfferTest extends TestCase
{
    use RefreshDatabase;

    public function test_skilled_user_can_make_offer(): void
    {
        $post = Post::factory()->create();
        $skilled = User::factory()->skilled()->create();

        $this->actingAs($skilled)->postJson("/api/posts/{$post->id}/offers", [
            'description' => 'I can fix this in one day.',
            'price' => 150.00,
        ])->assertCreated();

        $this->assertDatabaseHas('offers', ['post_id' => $post->id, 'skilled_user_id' => $skilled->id]);
        $this->assertEquals(1, $post->fresh()->offers_count);
    }

    public function test_normal_user_cannot_make_offer(): void
    {
        $post = Post::factory()->create();

        $this->actingAs(User::factory()->create())->postJson("/api/posts/{$post->id}/offers", [
            'description' => 'I should not be able to do this.',
            'price' => 100,
        ])->assertForbidden();
    }

    public function test_one_offer_per_user_per_post(): void
    {
        $post = Post::factory()->create();
        $skilled = User::factory()->skilled()->create();
        Offer::factory()->for($post)->create(['skilled_user_id' => $skilled->id]);

        $this->actingAs($skilled)->postJson("/api/posts/{$post->id}/offers", [
            'description' => 'Second offer attempt.',
            'price' => 200,
        ])->assertUnprocessable();
    }

    public function test_offers_count_syncs_on_delete(): void
    {
        $post = Post::factory()->create();
        $offer = Offer::factory()->for($post)->create();

        $this->assertEquals(1, $post->fresh()->offers_count);

        $this->actingAs($offer->skilledUser)->deleteJson("/api/offers/{$offer->id}")->assertOk();
        $this->assertEquals(0, $post->fresh()->offers_count);
    }

    public function test_offer_can_only_be_edited_while_pending(): void
    {
        $offer = Offer::factory()->create(['status' => 'ordered']);

        $this->actingAs($offer->skilledUser)->putJson("/api/offers/{$offer->id}", [
            'price' => 999,
        ])->assertForbidden();
    }

    public function test_post_owner_receives_notification_on_new_offer(): void
    {
        $post = Post::factory()->create();
        $skilled = User::factory()->skilled()->create();

        $this->actingAs($skilled)->postJson("/api/posts/{$post->id}/offers", [
            'description' => 'Available next week.',
            'price' => 300,
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $post->user_id,
            'type' => 'App\Notifications\OfferReceived',
        ]);
    }
}
