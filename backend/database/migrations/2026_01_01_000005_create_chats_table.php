<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('normal_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('skilled_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('post_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['normal_user_id', 'skilled_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
