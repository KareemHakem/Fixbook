<?php

namespace App\Models;

use App\Enums\PostStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Post extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => 'open',
        'offers_count' => 0,
    ];

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'image_url',
        'status',
        'offers_count',
    ];

    protected function casts(): array
    {
        return [
            'status' => PostStatus::class,
            'offers_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function activeOrder(): HasOne
    {
        return $this->hasOne(Order::class)
            ->whereNotIn('status', ['declined', 'cancelled', 'completed']);
    }

    public function scopeBoard($query)
    {
        return $query->whereIn('status', [PostStatus::Open->value, PostStatus::InProgress->value])
            ->whereDoesntHave('orders', fn ($q) => $q->where('status', 'completed'));
    }
}
