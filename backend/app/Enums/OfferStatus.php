<?php

namespace App\Enums;

enum OfferStatus: string
{
    case Pending = 'pending';
    case Ordered = 'ordered';
    case Declined = 'declined';
}
