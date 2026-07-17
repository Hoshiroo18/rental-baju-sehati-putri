<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_transactions', function (Blueprint $table) {
            // Cek dulu biar ga duplikat kolom kalau sebelumnya udah ada sebagian
            if (!Schema::hasColumn('rental_transactions', 'dp_amount')) {
                $table->decimal('dp_amount', 12, 2)->default(0)->after('total_payment');
            }
            if (!Schema::hasColumn('rental_transactions', 'payment_status')) {
                $table->enum('payment_status', ['dp', 'lunas'])->default('lunas')->after('dp_amount');
            }
            if (!Schema::hasColumn('rental_transactions', 'fulfillment_status')) {
                $table->enum('fulfillment_status', ['belum_diambil', 'sudah_diambil'])->default('belum_diambil')->after('payment_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('rental_transactions', function (Blueprint $table) {$table->dropColumn(['dp_amount', 'payment_status', 'fulfillment_status']);
        });
    }
};