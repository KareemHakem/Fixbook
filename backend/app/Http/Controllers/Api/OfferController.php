<?php

namespace App\Http\Controllers\Api;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use App\Http\Resources\OfferResource;
use App\Models\Offer;
use App\Models\Post;
use App\Notifications\OfferReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OfferController extends Controller
{
    public function index(Post $post): AnonymousResourceCollection
    {
        $offers = $post->offers()
            ->with(['skilledUser.skilledProfile'])
            ->latest()
            ->paginate(15);

        return OfferResource::collection($offers);
    }

    public function mine(Request $request): AnonymousResourceCollection
    {
        $offers = $request->user()->offers()
            ->with(['post.user'])
            ->latest()
            ->paginate(15);

        return OfferResource::collection($offers);
    }

    public function store(StoreOfferRequest $request, Post $post): JsonResponse
    {
        abort_if($post->status !== PostStatus::Open, 422, 'This post is not accepting offers.');
        abort_if($post->user_id === $request->user()->id, 422, 'You cannot make an offer on your own post.');

        $offer = Offer::firstOrNew([
            'post_id' => $post->id,
            'skilled_user_id' => $request->user()->id,
        ]);

        if ($offer->exists) {
            abort(422, 'You have already made an offer on this post.');
        }

        $offer->fill($request->safe()->only(['description', 'price']))->save();

        $post->user->notify(new OfferReceived($offer));

        return response()->json(new OfferResource($offer->load('skilledUser.skilledProfile')), 201);
    }

    public function update(UpdateOfferRequest $request, Offer $offer): OfferResource
    {
        $offer->update($request->safe()->only(['description', 'price']));

        return new OfferResource($offer->fresh()->load('skilledUser.skilledProfile'));
    }

    public function destroy(Request $request, Offer $offer): JsonResponse
    {
        $request->user()->can('delete', $offer) || abort(403);
        $offer->delete();

        return response()->json(['message' => 'Offer deleted']);
    }
}
