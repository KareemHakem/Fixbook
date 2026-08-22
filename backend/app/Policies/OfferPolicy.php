<?php

namespace App\Policies;

use App\Enums\OfferStatus;
use App\Models\Offer;
use App\Models\Post;
use App\Models\User;

class OfferPolicy
{
    public function create(User $user, Post $post): bool
    {
        return $user->isSkilled();
    }

    public function update(User $user, Offer $offer): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isSkilled()
            && $offer->skilled_user_id === $user->id
            && $offer->status === OfferStatus::Pending;
    }

    public function delete(User $user, Offer $offer): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isSkilled()
            && $offer->skilled_user_id === $user->id
            && $offer->status === OfferStatus::Pending;
    }
}
