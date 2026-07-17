<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('costumes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->integer('stock_total');
            $table->integer('stock_available');
            
            // 3 Kolom Harga Matrix Kustom Baru
            $table->decimal('price_1_day', 10, 2)->default(0);
            $table->decimal('price_2_day', 10, 2)->default(0);
            $table->decimal('price_3_day', 10, 2)->default(0);
            
            $table->string('image_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('costumes');
    }
};