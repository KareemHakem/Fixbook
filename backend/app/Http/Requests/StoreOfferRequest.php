<?php

namespace App\Http\Requests;

use App\Models\Offer;
use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', [Offer::class, $this->route('post')]);
    }

    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0.01', 'max:99999999'],
        ];
    }
}
