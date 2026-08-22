<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\ReviewResource;
use App\Http\Resources\UserResource;
use App\Models\Order;
use App\Models\Post;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'users' => [
                'total' => User::where('role', '!=', 'admin')->count(),
                'normal' => User::where('role', 'normal')->count(),
                'skilled' => User::where('role', 'skilled')->count(),
                'new_last_7_days' => User::where('role', '!=', 'admin')
                    ->where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'posts' => Post::select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')->pluck('total', 'status'),
            'orders' => Order::select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')->pluck('total', 'status'),
            'reviews' => [
                'total' => Review::count(),
                'average_rating' => round((float) Review::avg('rating'), 2),
            ],
        ]);
    }

    public function recentActivity(): JsonResponse
    {
        $orders = Order::with(['normalUser', 'post'])->latest()->limit(5)->get()
            ->map(fn ($o) => [
                'type' => 'order',
                'date' => $o->created_at?->toISOString(),
                'summary' => "{$o->normalUser->full_name} ordered {$o->post->title}",
            ]);

        $reviews = Review::with('reviewer')->latest()->limit(5)->get()
            ->map(fn ($r) => [
                'type' => 'review',
                'date' => $r->created_at?->toISOString(),
                'summary' => "{$r->reviewer->full_name} left a {$r->rating}-star review",
            ]);

        return response()->json(
            $orders->concat($reviews)->sortByDesc('date')->values()->take(10)
        );
    }

    public function users(Request $request): AnonymousResourceCollection
    {
        $users = User::with('skilledProfile')
            ->where('role', '!=', 'admin')
            ->when($request->query('role'), fn ($q, $role) => $q->where('role', $role))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($inner) => $inner->where('full_name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")))
            ->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return UserResource::collection($users);
    }

    public function posts(Request $request): AnonymousResourceCollection
    {
        $posts = Post::with('user')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return PostResource::collection($posts);
    }

    public function orders(Request $request): AnonymousResourceCollection
    {
        $orders = Order::with(['post', 'offer', 'normalUser', 'skilledUser'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return OrderResource::collection($orders);
    }

    public function reviews(Request $request): AnonymousResourceCollection
    {
        $reviews = Review::with(['reviewer', 'skilledUser', 'order.post'])
            ->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return ReviewResource::collection($reviews);
    }

    public function destroyUser(User $user): JsonResponse
    {
        abort_if($user->isAdmin(), 422, 'Admin users cannot be deleted.');
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function destroyReview(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json(['message' => 'Review deleted']);
    }
}
