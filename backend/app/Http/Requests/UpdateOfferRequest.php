<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('offer'));
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'string', 'max:2000'],
            'price' => ['sometimes', 'numeric', 'min:0.01', 'max:99999999'],
        ];
    }
}
