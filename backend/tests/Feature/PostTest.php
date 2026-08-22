<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_user_can_create_post(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/posts', [
            'title' => 'Leaky kitchen sink',
            'description' => 'The pipe under the sink is leaking.',
        ])->assertCreated();

        $this->assertDatabaseHas('posts', ['title' => 'Leaky kitchen sink', 'status' => 'open']);
    }

    public function test_skilled_user_cannot_create_post(): void
    {
        $user = User::factory()->skilled()->create();

        $this->actingAs($user)->postJson('/api/posts', [
            'title' => 'Not allowed',
            'description' => 'Skilled users cannot post jobs.',
        ])->assertForbidden();
    }

    public function test_board_excludes_completed_and_cancelled_posts(): void
    {
        $owner = User::factory()->create();
        Post::factory()->for($owner)->create(['status' => 'open']);
        Post::factory()->for($owner)->create(['status' => 'completed']);
        Post::factory()->for($owner)->create(['status' => 'cancelled']);

        $response = $this->actingAs(User::factory()->skilled()->create())
            ->getJson('/api/posts');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_post_search_matches_title(): void
    {
        $owner = User::factory()->create();
        Post::factory()->for($owner)->create(['title' => 'Fix bathroom tiles']);
        Post::factory()->for($owner)->create(['title' => 'Paint the garage']);

        $response = $this->actingAs($owner)->getJson('/api/posts?search=bathroom');

        $this->assertCount(1, $response->json('data'));
    }

    public function test_owner_can_update_post_but_others_cannot(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->for($owner)->create();

        $this->actingAs($other)->putJson("/api/posts/{$post->id}", [
            'title' => 'Hijacked',
        ])->assertForbidden();

        $this->actingAs($owner)->putJson("/api/posts/{$post->id}", [
            'title' => 'Updated title',
        ])->assertOk();

        $this->assertDatabaseHas('posts', ['id' => $post->id, 'title' => 'Updated title']);
    }

    public function test_post_with_completed_order_is_hidden_from_board(): void
    {
        $order = Order::factory()->create(['status' => 'completed']);

        $response = $this->actingAs(User::factory()->skilled()->create())->getJson('/api/posts');

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertNotContains($order->post_id, $ids);
    }
}
