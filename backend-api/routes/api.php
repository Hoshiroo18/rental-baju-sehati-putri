<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CostumeController;
use App\Http\Controllers\Api\RentalController;

Route::middleware([\Illuminate\Http\Middleware\HandleCors::class])->group(function () {
    // API Baju Adat
    Route::get('/costumes', [CostumeController::class, 'index']);
    Route::post('/costumes', [CostumeController::class, 'store']); 
    Route::put('/costumes/{id}', [CostumeController::class, 'update']); 
    Route::delete('/costumes/{id}', [CostumeController::class, 'destroy']);
    
    // API Kelola Transaksi (Checkout diarahkan ke POST /rentals)
    Route::get('/rentals', [RentalController::class, 'index']);
    Route::post('/rentals', [RentalController::class, 'store']); 
    Route::put('/rentals/{id}', [RentalController::class, 'update']);
    Route::delete('/rentals/{id}', [RentalController::class, 'destroy']);
    
    // API Auth & Dashboard
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/dashboard/summary', [DashboardController::class, 'getSummary']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});