<?php

namespace App\Observers;

use App\Models\Review;

class ReviewObserver
{
    public function created(Review $review): void
    {
        $review->order()->update(['review_left' => true]);
        $this->recalculateRating($review);
    }

    public function deleted(Review $review): void
    {
        $this->recalculateRating($review);
    }

    private function recalculateRating(Review $review): void
    {
        $stats = Review::where('skilled_user_id', $review->skilled_user_id)
            ->selectRaw('COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total')
            ->first();

        $review->skilledUser->skilledProfile()?->update([
            'rating' => round((float) $stats->avg_rating, 2),
            'review_count' => (int) $stats->total,
        ]);
    }
}
