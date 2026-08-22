<?php

namespace App\Notifications;

use App\Models\Offer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OfferReceived extends Notification
{
    use Queueable;

    public function __construct(public readonly Offer $offer) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'offer_received',
            'offer_id' => $this->offer->id,
            'post_id' => $this->offer->post_id,
            'post_title' => $this->offer->post->title,
            'skilled_user_name' => $this->offer->skilledUser->full_name,
            'price' => $this->offer->price,
        ];
    }
}
