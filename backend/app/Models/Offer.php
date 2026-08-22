<?php

namespace App\Models;

use App\Enums\OfferStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Offer extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => 'pending',
    ];

    protected $fillable = [
        'post_id',
        'skilled_user_id',
        'description',
        'price',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => OfferStatus::class,
            'price' => 'decimal:2',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function skilledUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'skilled_user_id');
    }
}
