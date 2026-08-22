<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function create(User $user, Order $order): bool
    {
        return $user->isNormal()
            && $order->normal_user_id === $user->id
            && $order->status === OrderStatus::Completed
            && ! $order->review_left;
    }

    public function delete(User $user, Review $review): bool
    {
        return $user->isAdmin();
    }
}
