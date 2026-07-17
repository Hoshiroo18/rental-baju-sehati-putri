<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $usernameInput = $request->input('username');
        $passwordInput = $request->input('password');

        $user = User::where('name', $usernameInput)->first();

        if ($user && Hash::check($passwordInput, $user->password)) {
            Auth::login($user); 

            return response()->json([
                'success' => true, 
                'message' => 'Login sukses, selamat datang ' . $user->name
            ])->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json([
            'success' => false, 
            'message' => 'Username atau password salah!'
        ], 401)->header('Access-Control-Allow-Origin', '*');
    }
}