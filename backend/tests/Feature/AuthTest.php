<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_as_normal(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'home@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'full_name' => 'Home Owner',
            'role' => 'normal',
        ]);

        $response->assertCreated()->assertJsonStructure(['token', 'user']);
        $this->assertDatabaseHas('users', ['email' => 'home@example.com', 'role' => 'normal']);
    }

    public function test_skilled_registration_creates_skilled_profile(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'pro@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'full_name' => 'Pro Plumber',
            'role' => 'skilled',
        ]);

        $response->assertCreated();
        $user = User::where('email', 'pro@example.com')->first();
        $this->assertNotNull($user->skilledProfile);
    }

    public function test_registration_cannot_self_assign_admin_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'evil@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'full_name' => 'Evil User',
            'role' => 'admin',
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('users', ['email' => 'evil@example.com']);
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $login->assertOk()->assertJsonStructure(['token', 'user']);

        $this->withToken($login->json('token'))
            ->postJson('/api/auth/logout')
            ->assertOk();
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }
}
