<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Costume;
use App\Models\RentalTransaction;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function getSummary(): JsonResponse
    {
        try {
            // Kita hitung total stock dari semua baju tanpa filter hardcode 'Baju Adat' agar tidak 0
            $stockAdat = Costume::sum('stock_total');
            
            $booking = RentalTransaction::where('status', 'booking')->count();
            $sewaAktif = RentalTransaction::where('status', 'active')->count();
            $pengembalian = RentalTransaction::where('status', 'returned')->count();
            
            // Menggunakan (float) agar jika database kosong, hasilnya tetap 0 bukan null
            $laporanKeuangan = (float) RentalTransaction::sum('total_payment');
            $danaHarian = (float) RentalTransaction::whereDate('created_at', today())->sum('total_payment');
            
            $audit = RentalTransaction::where('status', 'late')->count();

            return response()->json([
                'stock_adat' => $stockAdat,
                'booking' => $booking,
                'sewa_aktif' => $sewaAktif,
                'pengembalian' => $pengembalian,
                'laporan_keuangan' => $laporanKeuangan,
                'dana_harian' => $danaHarian,
                'audit' => $audit,
            ])->header('Access-Control-Allow-Origin', '*'); // Buka gerbang CORS khusus endpoint ini
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi error di Dashboard: ' . $e->getMessage()
            ], 500);
        }
    }
}