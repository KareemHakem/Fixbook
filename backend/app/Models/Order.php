<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => 'pending',
        'review_left' => false,
    ];

    protected $fillable = [
        'post_id',
        'offer_id',
        'normal_user_id',
        'skilled_user_id',
        'scheduled_date',
        'scheduled_time',
        'contact_phone',
        'location',
        'status',
        'review_left',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'scheduled_date' => 'date',
            'review_left' => 'boolean',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function normalUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'normal_user_id');
    }

    public function skilledUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'skilled_user_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
