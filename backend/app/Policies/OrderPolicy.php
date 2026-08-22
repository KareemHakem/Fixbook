<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $user->isAdmin()
            || $order->normal_user_id === $user->id
            || $order->skilled_user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isNormal() || $user->isAdmin();
    }

    public function accept(User $user, Order $order): bool
    {
        return ($user->isSkilled() && $order->skilled_user_id === $user->id || $user->isAdmin())
            && $order->status === OrderStatus::Pending;
    }

    public function decline(User $user, Order $order): bool
    {
        return ($user->isSkilled() && $order->skilled_user_id === $user->id || $user->isAdmin())
            && $order->status === OrderStatus::Pending;
    }

    public function complete(User $user, Order $order): bool
    {
        return ($user->isSkilled() && $order->skilled_user_id === $user->id || $user->isAdmin())
            && $order->status === OrderStatus::Accepted;
    }

    public function cancel(User $user, Order $order): bool
    {
        $isParticipant = $order->normal_user_id === $user->id || $order->skilled_user_id === $user->id;

        return ($isParticipant || $user->isAdmin())
            && in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted]);
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->isAdmin();
    }
}
