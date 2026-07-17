<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_transactions', function (Blueprint $table) {
            // Menambahkan kolom deskripsi denda jika belum ada
            if (!Schema::hasColumn('rental_transactions', 'fine_description')) {
                $table->text('fine_description')->nullable()->after('fine_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('rental_transactions', function (Blueprint $table) {$table->dropColumn('fine_description');
        });
    }
};