<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->foreignId('costume_id')->constrained('costumes')->onDelete('cascade');
            $table->date('rental_date');
            $table->date('return_date');
            $table->enum('status', ['booking', 'active', 'returned', 'late'])->default('booking');
            
            // Kolom Keuangan & Denda
            $table->decimal('total_payment', 10, 2)->default(0);
            $table->decimal('dp_amount', 10, 2)->default(0);
            $table->enum('payment_status', ['dp', 'lunas'])->default('lunas');
            
            $table->enum('fulfillment_status', ['belum_diambil', 'sudah_diambil'])->default('belum_diambil');
            $table->decimal('fine_amount', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_transactions');
    }
};