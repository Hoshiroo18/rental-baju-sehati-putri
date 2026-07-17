<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'customer_phone',
        'costume_id',
        'rental_date',
        'return_date',
        'status',
        'total_payment',
        'dp_amount',
        'payment_status',
        'fulfillment_status',
        'fine_amount',
        'fine_description',
        'guarantee_type',
        'guarantee_detail',
        'guarantee_status'
    ];

    public function costume()
    {
        return $this->belongsTo(Costume::class, 'costume_id');
    }
}