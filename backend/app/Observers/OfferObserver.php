<?php

namespace App\Observers;

use App\Models\Offer;

class OfferObserver
{
    public function created(Offer $offer): void
    {
        $this->syncOffersCount($offer);
    }

    public function deleted(Offer $offer): void
    {
        $this->syncOffersCount($offer);
    }

    private function syncOffersCount(Offer $offer): void
    {
        $post = $offer->post;
        $post->update(['offers_count' => $post->offers()->count()]);
    }
}
