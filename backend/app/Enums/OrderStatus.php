<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function isActive(): bool
    {
        return match ($this) {
            self::Pending, self::Accepted => true,
            default => false,
        };
    }
}
