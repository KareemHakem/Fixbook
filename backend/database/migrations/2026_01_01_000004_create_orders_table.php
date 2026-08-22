<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('normal_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('skilled_user_id')->constrained('users')->cascadeOnDelete();
            $table->date('scheduled_date');
            $table->time('scheduled_time');
            $table->string('contact_phone');
            $table->string('location');
            $table->string('status')->default('pending');
            $table->boolean('review_left')->default(false);
            $table->timestamps();

            $table->index('normal_user_id');
            $table->index('skilled_user_id');
        });

        // One active order per post (PostgreSQL partial unique index).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("CREATE UNIQUE INDEX orders_one_active_per_post ON orders (post_id) WHERE status NOT IN ('declined', 'cancelled', 'completed')");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
