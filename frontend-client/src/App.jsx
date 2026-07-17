import React, { useState, useEffect } from 'react';
import ilustrasiHero from './assets/hero-dashboard.svg';
import { LayoutDashboard, Package, Wallet, Undo2, LogOut, Star, Calendar, Clock, RefreshCw, Menu, X, FileText, Moon, FileSpreadsheet } from 'lucide-react';
import Login from './Login.jsx';
import StokBaju from "./pages/StokBaju.jsx";
import PilihBaju from "./pages/PilihBaju.jsx";
import DaftarPesanan from "./pages/DaftarPesanan.jsx";
import Pengembalian from "./pages/Pengembalian.jsx";
import RekapExcel from "./pages/RekapExcel.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [costumesData, setCostumesData] = useState([]);
  const [loadingCostumes, setLoadingCostumes] = useState(false);
  const [summaryData, setSummaryData] = useState({
    stock_adat: 0,
    booking: 0,
    sewa_aktif: 0,
    pengembalian: 0
  });

  const fetchCostumes = async () => {
    setLoadingCostumes(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/costumes`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setCostumesData(result.data || []);
      }
    } catch (error) {
      console.error("Gagal mengambil data stok:", error);
    } finally {
      setLoadingCostumes(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/summary`);
      if (response.ok) {
        const result = await response.json();
        setSummaryData({
          stock_adat: result.stock_adat || 0,
          booking: result.booking || 0,
          sewa_aktif: result.sewa_aktif || 0,
          pengembalian: result.pengembalian || 0
        });
      }
    } catch (err) {
      console.error("Gagal memuat summary dashboard:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchCostumes();
      fetchSummary();
    }
  }, [activePage, isLoggedIn]);

  const handleLoginSuccess = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setIsAdminMenuOpen(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#D1D1D1] ${darkMode ? 'dark' : ''}`} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-1 text-gray-600 hover:bg-gray-100 rounded z-50">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-[#2D3E4E]">Sehati Puteri</span>
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className="flex items-center space-x-1 border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
            <Star size={14} className={isAdminMenuOpen ? "fill-yellow-400 text-yellow-400" : ""} />
            <span>Hi Admin!</span>
          </button>
          {isAdminMenuOpen && (
            <>
              <div onClick={() => setIsAdminMenuOpen(false)} className="fixed inset-0 z-10"></div>
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                <button onClick={handleLogout} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={14} /> <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside className={`fixed inset-y-0 left-0 top-0 pt-16 md:pt-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white flex flex-col justify-between p-4 border-r border-gray-200 z-40 h-screen md:h-auto`}>
          <div className="space-y-6">
            <nav className="space-y-1">
              <button onClick={() => { setActivePage('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors font-medium ${activePage === 'dashboard' ? 'bg-[#D4DDD8] text-[#2E4A3F]' : 'text-gray-600 hover:bg-[#D4DDD8] hover:text-[#2E4A3F]'}`}>
                <LayoutDashboard size={18} /> <span>Dashboard</span>
              </button>
              <button onClick={() => { setActivePage('stok'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors font-medium ${activePage === 'stok' ? 'bg-[#D4DDD8] text-[#2E4A3F]' : 'text-gray-600 hover:bg-[#D4DDD8] hover:text-[#2E4A3F]'}`}>
                <Package size={18} /> <span>Stok Baju</span>
              </button>
              <button onClick={() => { setActivePage('rental-baju'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors font-medium ${activePage === 'rental-baju' ? 'bg-[#D4DDD8] text-[#2E4A3F]' : 'text-gray-600 hover:bg-[#D4DDD8] hover:text-[#2E4A3F]'}`}>
                <Wallet size={18} /> <span>Rental Baju</span>
              </button>
              <button 
                onClick={() => { setActivePage('pesanan'); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors font-medium ${activePage === 'pesanan' ? 'bg-[#D4DDD8] text-[#2E4A3F]' : 'text-gray-600 hover:bg-[#D4DDD8] hover:text-[#2E4A3F]'}`}
              >
                <FileText size={18} />
                <span>Daftar Pesanan</span>
              </button>
              <button 
                onClick={() => { setActivePage('pengembalian'); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors font-medium ${activePage === 'pengembalian' ? 'bg-[#D4DDD8] text-[#2E4A3F]' : 'text-gray-600 hover:bg-[#D4DDD8] hover:text-[#2E4A3F]'}`}
              >
                <Undo2 size={18} /> 
                <span>Pengembalian</span>
              </button>
              <button onClick={() => { setActivePage('rekap'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors font-medium ${activePage === 'rekap' ? 'bg-[#D4DDD8] text-[#2E4A3F]' : 'text-gray-600 hover:bg-[#D4DDD8] hover:text-[#2E4A3F]'}`}>
                <FileSpreadsheet size={18} /> <span>Rekap Excel</span>
              </button>
            </nav>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 pt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600"><Moon size={18} /> <span>Dark Mode</span></div>
              <button onClick={() => setDarkMode(!darkMode)} className={`w-10 h-5 flex items-center rounded-full p-0.5 duration-300 ${darkMode ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${darkMode ? 'translate-x-5' : ''}`}></div>
              </button>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-[#334239] text-white py-2 rounded-md hover:bg-[#25312a] transition"><LogOut size={16} /> <span>Logout</span></button>
          </div>
        </aside>

        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden"></div>}

        <main className="flex-1 flex flex-col justify-between overflow-x-hidden min-w-0">
          <div className={`flex-1 w-full ${(activePage === 'rental-baju' || activePage === 'pesanan' || activePage === 'stok') ? 'p-0' : 'p-4 md:p-8'}`}>
            {activePage === 'dashboard' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 gap-6 md:gap-4 bg-transparent w-full">
                  <div className="max-w-xl text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#394931] leading-tight mb-4">Selamat Datang Di<br />Website Rental Kostum<br />Sehati Puteri</h1>
                    <p className="text-gray-700 text-sm leading-relaxed mb-6">destinasi utama Anda untuk tampil memukau di setiap momen spesial. Kami menyediakan berbagai pilihan koleksi busana berkualitas mulai dari gaun pesta elegan, kebaya tradisional yang anggun,  hingga pakaian formal yang siap menyempurnakan penampilan Anda.</p>
                    <button onClick={() => setActivePage('rental-baju')} className="bg-[#334239] text-white px-6 py-2 rounded-md font-medium text-sm shadow hover:bg-[#25312a] transition mx-auto md:mx-0 block md:inline-block">Rental</button>
                  </div>
                  <div className="hidden md:flex w-80 h-auto flex-col items-center justify-center md:ml-auto md:-mr-2 md:-mt-5">
                    <img src={ilustrasiHero} alt="Hero" className="w-full h-auto object-contain" />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-auto w-full mb-8">
                  <button 
                    onClick={() => setActivePage('stok')} 
                    className="bg-white rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md border border-transparent hover:border-[#2E4A3F] transition-all text-center group"
                  >
                    <Package size={36} className="text-[#2E4A3F] mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-medium text-gray-500 mb-1">Stock Baju Adat</span>
                    <span className="text-base md:text-lg font-bold text-gray-800">{summaryData.stock_adat}</span>
                  </button>

                  <button 
                    onClick={() => setActivePage('pesanan')} 
                    className="bg-white rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md border border-transparent hover:border-[#2E4A3F] transition-all text-center group"
                  >
                    <Calendar size={36} className="text-[#2E4A3F] mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-medium text-gray-500 mb-1">Booking</span>
                    <span className="text-base md:text-lg font-bold text-gray-800">{summaryData.booking}</span>
                  </button>

                  <button 
                    onClick={() => setActivePage('pesanan')} 
                    className="bg-white rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md border border-transparent hover:border-[#2E4A3F] transition-all text-center group"
                  >
                    <Clock size={36} className="text-[#2E4A3F] mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-medium text-gray-500 mb-1">Sewa Aktif</span>
                    <span className="text-base md:text-lg font-bold text-gray-800">{summaryData.sewa_aktif}</span>
                  </button>

                  <button 
                    onClick={() => setActivePage('pengembalian')} 
                    className="bg-white rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md border border-transparent hover:border-[#2E4A3F] transition-all text-center group w-full"
                  >
                    <Undo2 size={36} className="text-[#2E4A3F] mb-3 group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="text-xs font-medium text-gray-500 mb-1">Pengembalian</span>
                    <span className="text-base md:text-lg font-bold text-gray-800">{summaryData.pengembalian}</span>
                  </button>
                </div>
              </>
            ) : activePage === 'stok' ? (
              <StokBaju costumesData={costumesData} loadingCostumes={loadingCostumes} onRefresh={fetchCostumes} />
            ) : activePage === 'rental-baju' ? (
              <PilihBaju costumesData={costumesData} loadingCostumes={loadingCostumes} onRefresh={fetchCostumes} />
            ) : activePage === 'pesanan' ? (
            <DaftarPesanan />
            ) : activePage === 'rekap' ? ( // <-- Tambahkan block ini
              <RekapExcel />
            ) : (
              <Pengembalian />
            )}
          </div>

          <footer className="bg-[#3A4D39] text-white pt-10 pb-6 w-full border-t border-[#2C3A2B] mt-auto">
            <div className="w-full mx-auto px-6 text-center flex flex-col items-center">
              <p className="text-xs text-gray-400 mt-6 tracking-wider font-light">© 2026 Sehati Putri. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;