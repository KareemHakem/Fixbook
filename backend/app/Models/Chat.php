<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'normal_user_id',
        'skilled_user_id',
        'post_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function normalUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'normal_user_id');
    }

    public function skilledUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'skilled_user_id');
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
