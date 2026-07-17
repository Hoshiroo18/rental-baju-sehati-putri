<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Costume;
use App\Models\RentalTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CostumeController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $costumes = Costume::all()->map(function ($costume) {
                $booking = RentalTransaction::where('costume_id', $costume->id)->where('status', 'booking')->count();
                $sedang_dirental = RentalTransaction::where('costume_id', $costume->id)->where('status', 'active')->count();
                $total_stok = $costume->stock_total ?? 0; 
                $baju_tersedia = $total_stok - ($booking + $sedang_dirental);

                return [
                    'id' => $costume->id,
                    'costume_name' => $costume->name ?? 'Tanpa Nama', 
                    'category' => $costume->category,
                    'price_1_day' => $costume->price_1_day,
                    'price_2_day' => $costume->price_2_day,
                    'price_3_day' => $costume->price_3_day,
                    'image' => $costume->image_path ? url('storage/' . $costume->image_path) : null,
                    'total_stok' => $total_stok,
                    'booking' => $booking,
                    'sedang_dirental' => $sedang_dirental,
                    'baju_tersedia' => $baju_tersedia < 0 ? 0 : $baju_tersedia, 
                ];
            });

            return response()->json(['success' => true, 'data' => $costumes], 200)
                ->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'stock_total' => 'required|numeric', 
            'price_1_day' => 'required|numeric',
            'price_2_day' => 'required|numeric',
            'price_3_day' => 'required|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('costumes', 'public');
        }

        $costume = Costume::create([
            'name' => $request->name,
            'category' => $request->category,
            'stock_total' => $request->stock_total, 
            'stock_available' => $request->stock_total, 
            'price_1_day' => $request->price_1_day,
            'price_2_day' => $request->price_2_day,
            'price_3_day' => $request->price_3_day,
            'image_path' => $imagePath,
        ]);

        return response()->json(['success' => true, 'message' => 'Baju berhasil ditambahkan!', 'data' => $costume], 201)
            ->header('Access-Control-Allow-Origin', '*');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $costume = Costume::find($id);
        if (!$costume) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'stock_total' => 'required|numeric',
            'price_1_day' => 'required|numeric',
            'price_2_day' => 'required|numeric',
            'price_3_day' => 'required|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('image')) {
            if ($costume->image_path) {
                Storage::disk('public')->delete($costume->image_path);
            }
            $costume->image_path = $request->file('image')->store('costumes', 'public');
        }

        $costume->update([
            'name' => $request->name,
            'category' => $request->category,
            'stock_total' => $request->stock_total,
            'stock_available' => $request->stock_total,
            'price_1_day' => $request->price_1_day,
            'price_2_day' => $request->price_2_day,
            'price_3_day' => $request->price_3_day,
        ]);

        return response()->json(['success' => true, 'message' => 'Data baju berhasil diperbarui!'], 200)
            ->header('Access-Control-Allow-Origin', '*');
    }

    public function destroy($id): JsonResponse
    {
        $costume = Costume::find($id);
        if (!$costume) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        if ($costume->image_path) Storage::disk('public')->delete($costume->image_path);
        $costume->delete();
        return response()->json(['success' => true, 'message' => 'Baju dihapus!'], 200)->header('Access-Control-Allow-Origin', '*');
    }
}