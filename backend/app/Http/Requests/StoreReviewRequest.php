<?php

namespace App\Http\Requests;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = Order::find($this->input('order_id'));

        return $order && $this->user()->can('create', [Review::class, $order]);
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review_text' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
