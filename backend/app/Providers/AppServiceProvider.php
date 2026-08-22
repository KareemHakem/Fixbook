<?php

namespace App\Providers;

use App\Models\Message;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Review;
use App\Observers\MessageObserver;
use App\Observers\OfferObserver;
use App\Observers\OrderObserver;
use App\Observers\ReviewObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Offer::observe(OfferObserver::class);
        Order::observe(OrderObserver::class);
        Review::observe(ReviewObserver::class);
        Message::observe(MessageObserver::class);
    }
}
