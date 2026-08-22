<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skilled_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->unique(['post_id', 'skilled_user_id']);
            $table->index('skilled_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
