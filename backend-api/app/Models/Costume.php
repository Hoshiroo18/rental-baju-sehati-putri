<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Costume extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'price_1_day',
        'price_2_day',
        'price_3_day',
        'image_path',
        'stock_total',
        'stock_available'
    ];

    public function rentalTransactions()
    {
        return $this->hasMany(RentalTransaction::class, 'costume_id');
    }
}