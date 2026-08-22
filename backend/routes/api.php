<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Profiles
    Route::get('/profiles/{user}', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile', [ProfileController::class, 'update']); // multipart form-data
    Route::get('/skilled-users', [ProfileController::class, 'skilled']);
    Route::put('/profile/push-token', [ProfileController::class, 'updatePushToken']);

    // Posts
    Route::apiResource('posts', PostController::class);

    // Offers
    Route::get('/posts/{post}/offers', [OfferController::class, 'index']);
    Route::post('/posts/{post}/offers', [OfferController::class, 'store']);
    Route::get('/my-offers', [OfferController::class, 'mine']);
    Route::put('/offers/{offer}', [OfferController::class, 'update']);
    Route::delete('/offers/{offer}', [OfferController::class, 'destroy']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/{action}', [OrderController::class, 'transition'])
        ->whereIn('action', ['accept', 'decline', 'complete', 'cancel']);

    // Chats
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store']);
    Route::get('/chats/{chat}/messages', [ChatController::class, 'messages']);
    Route::post('/chats/{chat}/messages', [ChatController::class, 'sendMessage'])
        ->middleware('throttle:60,1');
    Route::post('/chats/{chat}/read', [ChatController::class, 'markRead']);

    // Reviews
    Route::get('/users/{user}/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Admin
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/activity', [AdminController::class, 'recentActivity']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/posts', [AdminController::class, 'posts']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/reviews', [AdminController::class, 'reviews']);
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser']);
        Route::delete('/reviews/{review}', [AdminController::class, 'destroyReview']);
    });
});
