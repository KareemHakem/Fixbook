<?php

namespace App\Http\Controllers\Api;

use App\Enums\OfferStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Offer;
use App\Models\Order;
use App\Notifications\OrderStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $orders = Order::with(['post', 'offer', 'normalUser', 'skilledUser.skilledProfile'])
            ->when($user->isNormal(), fn ($q) => $q->where('normal_user_id', $user->id))
            ->when($user->isSkilled(), fn ($q) => $q->where('skilled_user_id', $user->id))
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('history') === 'true',
                fn ($q) => $q->whereIn('status', ['completed', 'cancelled', 'declined']),
                fn ($q) => $q->whereIn('status', ['pending', 'accepted']))
            ->latest()
            ->paginate(min((int) $request->query('per_page', 15), 50));

        return OrderResource::collection($orders);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        $request->user()->can('view', $order) || abort(403);

        return new OrderResource($order->load(['post', 'offer', 'normalUser', 'skilledUser.skilledProfile']));
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $offer = Offer::with('post')->findOrFail($request->offer_id);

        abort_if($offer->post->user_id !== $request->user()->id && ! $request->user()->isAdmin(),
            403, 'Only the post owner can create an order for an offer.');
        abort_if($offer->status !== OfferStatus::Pending, 422, 'This offer is no longer available.');

        $order = DB::transaction(function () use ($request, $offer) {
            $hasActiveOrder = Order::where('post_id', $offer->post_id)
                ->whereNotIn('status', ['declined', 'cancelled', 'completed'])
                ->lockForUpdate()
                ->exists();

            abort_if($hasActiveOrder, 422, 'This post already has an active order.');

            return Order::create([
                'post_id' => $offer->post_id,
                'offer_id' => $offer->id,
                'normal_user_id' => $offer->post->user_id,
                'skilled_user_id' => $offer->skilled_user_id,
                'scheduled_date' => $request->scheduled_date,
                'scheduled_time' => $request->scheduled_time,
                'contact_phone' => $request->contact_phone,
                'location' => $request->location,
            ]);
        });

        $order->skilledUser->notify(new OrderStatusChanged($order));

        return response()->json(
            new OrderResource($order->load(['post', 'offer', 'normalUser', 'skilledUser'])),
            201
        );
    }

    public function transition(Request $request, Order $order, string $action): JsonResponse
    {
        $target = match ($action) {
            'accept' => OrderStatus::Accepted,
            'decline' => OrderStatus::Declined,
            'complete' => OrderStatus::Completed,
            'cancel' => OrderStatus::Cancelled,
            default => abort(404),
        };

        $request->user()->can($action, $order) || abort(403);

        $order->update(['status' => $target]);

        $order->normalUser->notify(new OrderStatusChanged($order));

        return response()->json(new OrderResource($order->fresh()->load(['post', 'offer'])));
    }
}
