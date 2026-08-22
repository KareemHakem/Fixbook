<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_or_create_chat_is_idempotent(): void
    {
        $normal = User::factory()->create();
        $skilled = User::factory()->skilled()->create();

        $first = $this->actingAs($normal)->postJson('/api/chats', ['skilled_user_id' => $skilled->id]);
        $second = $this->actingAs($normal)->postJson('/api/chats', ['skilled_user_id' => $skilled->id]);

        $first->assertCreated();
        $second->assertOk();
        $this->assertEquals($first->json('id'), $second->json('id'));
        $this->assertEquals(1, Chat::count());
    }

    public function test_chat_can_only_be_started_with_skilled_user(): void
    {
        $normal = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($normal)->postJson('/api/chats', ['skilled_user_id' => $other->id])
            ->assertUnprocessable();
    }

    public function test_participants_can_exchange_messages(): void
    {
        $chat = Chat::factory()->create();

        $this->actingAs($chat->normalUser)->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Hello, are you available?',
        ])->assertCreated();

        $this->actingAs($chat->skilledUser)->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Yes, next Tuesday works.',
        ])->assertCreated();

        $this->assertNotNull($chat->fresh()->last_message_at);
        $this->assertEquals(2, $chat->messages()->count());
    }

    public function test_stranger_cannot_read_messages(): void
    {
        $chat = Chat::factory()->create();
        Message::factory()->create(['chat_id' => $chat->id, 'sender_id' => $chat->normal_user_id]);

        $this->actingAs(User::factory()->create())
            ->getJson("/api/chats/{$chat->id}/messages")
            ->assertForbidden();
    }

    public function test_mark_read_only_affects_received_messages(): void
    {
        $chat = Chat::factory()->create();
        Message::factory(3)->create(['chat_id' => $chat->id, 'sender_id' => $chat->skilled_user_id]);
        Message::factory()->create(['chat_id' => $chat->id, 'sender_id' => $chat->normal_user_id]);

        $response = $this->actingAs($chat->normalUser)->postJson("/api/chats/{$chat->id}/read");

        $response->assertOk();
        $this->assertEquals(3, $response->json('marked_read'));
        $this->assertEquals(1, $chat->messages()->where('is_read', false)->count());
    }
}
