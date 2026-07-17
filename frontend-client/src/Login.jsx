import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/login`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError('');
        onLoginSuccess(); 
      } else {
        setError(data.message || 'Username atau password salah!');
      }
    } catch (err) {
      setError('Gagal terhubung ke server backend Laravel.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAEAEA] px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold text-[#334239] tracking-wide mt-2">Sehati Puteri</h2>
          <p className="text-xs text-gray-500 mt-1">Sistem Admin Rental Baju Adat</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 rounded-lg text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User size={16} />
              </span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username admin" 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#334239] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={16} />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••" 
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#334239] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#334239] text-white py-2.5 rounded-lg font-medium text-sm shadow hover:bg-[#25312a] active:scale-[0.98] transition-all mt-2"
          >
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;