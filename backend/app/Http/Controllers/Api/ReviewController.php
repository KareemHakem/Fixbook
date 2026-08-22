<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    public function index(User $user): AnonymousResourceCollection
    {
        $reviews = Review::with('reviewer')
            ->where('skilled_user_id', $user->id)
            ->latest()
            ->paginate(15);

        return ReviewResource::collection($reviews);
    }

    public function store(StoreReviewRequest $request): JsonResponse
    {
        $order = Order::findOrFail($request->order_id);

        $review = Review::create([
            'order_id' => $order->id,
            'normal_user_id' => $request->user()->id,
            'skilled_user_id' => $order->skilled_user_id,
            'rating' => $request->rating,
            'review_text' => $request->review_text,
        ]);

        return response()->json(new ReviewResource($review->load('reviewer')), 201);
    }
}
