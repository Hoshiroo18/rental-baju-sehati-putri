<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Costume;
use App\Models\RentalTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RentalController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $rentals = RentalTransaction::with('costume')->orderBy('id', 'desc')->get();
            return response()->json(['success' => true, 'data' => $rentals], 200)
                ->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'costume_id' => 'required|exists:costumes,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'rental_date' => 'required|date',
            'return_date' => 'required|date|after_or_equal:rental_date',
            'payment_status' => 'required|in:dp,lunas',
            'dp_amount' => 'nullable|numeric',
            'status' => 'required|in:booking,active,returned,late',
            'fulfillment_status' => 'required|in:belum_diambil,sudah_diambil',
            'guarantee_type' => 'required|string',
            'guarantee_detail' => 'required|string',
            'guarantee_status' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $costume = Costume::lockForUpdate()->find($request->costume_id);
                
                $booking = RentalTransaction::where('costume_id', $costume->id)->where('status', 'booking')->count();
                $sedang_dirental = RentalTransaction::where('costume_id', $costume->id)->where('status', 'active')->count();
                $baju_tersedia = ($costume->stock_total ?? 0) - ($booking + $sedang_dirental);

                if ($baju_tersedia < 1) {
                    return response()->json(['success' => false, 'message' => "Stok baju adat sudah habis dibooking/dirental!"], 400);
                }

                $start = new \DateTime($request->rental_date);
                $end = new \DateTime($request->return_date);
                $totalDays = $start->diff($end)->days + 1;
                
                $totalPayment = 0;
                if ($totalDays == 1) {
                    $totalPayment = $costume->price_1_day;
                } elseif ($totalDays == 2) {
                    $totalPayment = $costume->price_2_day;
                } else {
                    $totalPayment = $costume->price_3_day;
                }

                $dpAmount = $request->payment_status === 'dp' ? (float)$request->dp_amount : 0;

                $transaction = RentalTransaction::create([
                    'customer_name' => $request->customer_name,
                    'customer_phone' => $request->customer_phone,
                    'costume_id' => $request->costume_id,
                    'rental_date' => $request->rental_date,
                    'return_date' => $request->return_date,
                    'status' => $request->status,
                    'total_payment' => $totalPayment,
                    'dp_amount' => $dpAmount,
                    'payment_status' => $request->payment_status,
                    'fulfillment_status' => $request->fulfillment_status,
                    'fine_amount' => 0,
                    'guarantee_type' => $request->guarantee_type,
                    'guarantee_detail' => $request->guarantee_detail,
                    'guarantee_status' => $request->guarantee_status ?? 'ditahan_admin',
                ]);

                return response()->json(['success' => true, 'data' => $transaction], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        $rental = RentalTransaction::find($id);
        if (!$rental) {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);
        }

        $rental->update([
            'customer_name'      => $request->customer_name ?? $rental->customer_name,
            'customer_phone'     => $request->customer_phone ?? $rental->customer_phone, // <-- Update nomor hp jika berubah
            'status'             => $request->status ?? $rental->status,
            'fine_amount'        => $request->has('fine_amount') ? (float)$request->fine_amount : $rental->fine_amount,
            'fine_description'   => $request->has('fine_description') ? $request->fine_description : $rental->fine_description,
            'payment_status'     => $request->payment_status ?? $rental->payment_status,
            'fulfillment_status' => $request->fulfillment_status ?? $rental->fulfillment_status,
            'guarantee_status'   => $request->guarantee_status ?? $rental->guarantee_status,
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Data rental / pengembalian berhasil diperbarui!',
            'data' => $rental
        ], 200)->header('Access-Control-Allow-Origin', '*');
    }

    public function destroy($id): JsonResponse
    {
        $rental = RentalTransaction::find($id);
        if (!$rental) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        $rental->delete();
        return response()->json(['success' => true, 'message' => 'Data riwayat berhasil dihapus!']);
    }
}