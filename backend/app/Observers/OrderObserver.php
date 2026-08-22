<?php

namespace App\Observers;

use App\Enums\OfferStatus;
use App\Enums\OrderStatus;
use App\Enums\PostStatus;
use App\Models\Order;

class OrderObserver
{
    /**
     * Drives the post and offer status state machine when an order
     * changes status. Replaces the Supabase trg_order_status_change trigger.
     */
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        $post = $order->post;

        match ($order->status) {
            OrderStatus::Accepted => $this->handleAccepted($order, $post),
            OrderStatus::Completed => $post->update(['status' => PostStatus::Completed]),
            OrderStatus::Declined, OrderStatus::Cancelled => $this->handleInactive($order, $post),
            default => null,
        };
    }

    private function handleAccepted(Order $order, $post): void
    {
        $post->update(['status' => PostStatus::InProgress]);
        $order->offer->update(['status' => OfferStatus::Ordered]);

        $post->offers()
            ->where('id', '!=', $order->offer_id)
            ->where('status', OfferStatus::Pending->value)
            ->update(['status' => OfferStatus::Declined->value]);
    }

    private function handleInactive(Order $order, $post): void
    {
        $order->offer->update(['status' => OfferStatus::Declined->value]);

        // Reopen the post only if no other active orders exist.
        $hasActiveOrders = $post->orders()
            ->where('id', '!=', $order->id)
            ->whereNotIn('status', ['declined', 'cancelled', 'completed'])
            ->exists();

        if (! $hasActiveOrders && $post->status !== PostStatus::Completed) {
            $post->update(['status' => PostStatus::Open]);
        }
    }
}
