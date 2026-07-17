import React, { useState, useEffect } from 'react';
import { Search, Undo2, Calendar, AlertTriangle, DollarSign, FileText, CheckCircle, Shield, RefreshCw } from 'lucide-react';

export default function Pengembalian() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [fineAmount, setFineAmount] = useState(0);
  const [fineDescription, setFineDescription] = useState('');
  const [isLate, setIsLate] = useState(false);
  const [lateDays, setLateDays] = useState(0);

  const [isGuaranteeReturned, setIsGuaranteeReturned] = useState(true);

  const formatRupiah = (angka) => {
    if (!angka && angka !== 0) return '0';
    const cleanNumber = String(angka).replace(/\D/g, '');
    if (!cleanNumber) return '0';
    return new Intl.NumberFormat('id-ID').format(parseInt(cleanNumber, 10));
  };

  const cleanRupiah = (stringRupiah) => {
    return String(stringRupiah).replace(/\./g, '');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rentals`);
      const res = await response.json();
      if (response.ok && res.success && Array.isArray(res.data)) {
        const activeOrders = res.data.filter(o => o.status !== 'returned');
        setOrders(activeOrders);
      }
    } catch (error) {
      console.error("Gagal memuat data sewa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getGroupedActiveOrders = () => {
    const groups = {};
    orders.forEach(order => {
      const key = `${order.customer_name}_${order.rental_date}_${order.return_date}`;
      const costumeName = order.costume ? (order.costume.name ?? order.costume.costume_name) : 'Baju Adat';
      
      if (!groups[key]) {
        groups[key] = {
          key: key,
          customer_name: order.customer_name,
          rental_date: order.rental_date,
          return_date: order.return_date,
          total_payment: 0,
          status: order.status,
          guarantee_type: order.guarantee_type || 'KTP',
          guarantee_detail: order.guarantee_detail || '-',
          guarantee_status: order.guarantee_status || 'ditahan_admin',
          items: [],
          originalOrders: []
        };
      }
      groups[key].items.push(costumeName);
      groups[key].total_payment += Number(order.total_payment) || 0;
      groups[key].originalOrders.push(order);
    });

    return Object.values(groups).filter(g =>
      g.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSelectGroup = (group) => {
    // Jika diklik lagi pada penyewa yang sama, kita toggle tutup detailnya
    if (selectedGroup?.key === group.key) {
      setSelectedGroup(null);
      return;
    }

    setSelectedGroup(group);
    setIsGuaranteeReturned(true); 
    
    const tglKembali = new Date(group.return_date);
    const tglSekarang = new Date();
    
    tglKembali.setHours(0,0,0,0);
    tglSekarang.setHours(0,0,0,0);

    if (tglSekarang > tglKembali) {
      const diffTime = Math.abs(tglSekarang - tglKembali);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setIsLate(true);
      setLateDays(diffDays);
      const hitungDenda = diffDays * 25000;
      setFineAmount(hitungDenda);
      setFineDescription(`Terlambat mengembalikan selama ${diffDays} hari.`);
    } else {
      setIsLate(false);
      setLateDays(0);
      setFineAmount(0);
      setFineDescription('');
    }
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (!window.confirm(`Proses pengembalian busana atas nama ${selectedGroup.customer_name}?`)) return;

    setLoading(true);
    try {
      const finalGuaranteeStatus = isGuaranteeReturned ? 'dikembalikan_ke_penyewa' : 'ditahan_admin';

      const updatePromises = selectedGroup.originalOrders.map((order, index) => {
        const distributedFine = index === 0 ? fineAmount : 0;
        const distributedDesc = index === 0 ? fineDescription : '';

        return fetch(`${import.meta.env.VITE_API_BASE_URL}/rentals/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            status: 'returned',
            fulfillment_status: 'sudah_diambil',
            fine_amount: distributedFine,
            fine_description: distributedDesc,
            guarantee_status: finalGuaranteeStatus
          })
        });
      });

      await Promise.all(updatePromises);
      alert(`Sukses! Baju sewaan kelompok ${selectedGroup.customer_name} telah resmi dikembalikan!`);
      setSelectedGroup(null);
      setFineAmount(0);
      setFineDescription('');
      fetchOrders();
    } catch (error) {
      alert("Gagal memproses pengembalian data.");
    } finally {
      setLoading(false);
    }
  };

  const groupedActiveList = getGroupedActiveOrders();

  // Komponen Form Pengembalian (Biar kodenya ga duplikat)
  const renderReturnForm = () => (
    <form onSubmit={handleProcessReturn} className="space-y-4 animate-fadeIn">
      <div className="bg-gray-50 p-3 rounded-2xl border text-xs space-y-1">
        <p className="text-gray-400 font-bold uppercase tracking-wide text-[10px]">Penyewa Terpilih</p>
        <p className="text-gray-900 font-bold text-sm capitalize">{selectedGroup.customer_name}</p>
        <p className="text-gray-600 font-medium">Batas Kembali: <span className="underline font-bold text-gray-800">{selectedGroup.return_date}</span></p>
        <p className="text-gray-600 font-medium">Total Biaya Pokok: Rp {selectedGroup.total_payment.toLocaleString('id-ID')}</p>
      </div>

      <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <Shield size={14} className="text-amber-700"/> Berkas Jaminan Ditahan
          </span>
          <span className="bg-amber-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md uppercase">
            {selectedGroup.guarantee_type}
          </span>
        </div>
        <p className="text-gray-700 font-semibold bg-white p-2 rounded-xl border border-amber-100">
          Detail: <span className="text-gray-950 font-bold">{selectedGroup.guarantee_detail}</span>
        </p>
        
        <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
          <label className="text-gray-700 font-bold text-[11px] cursor-pointer" htmlFor="chkGuarantee">
            Kembalikan Jaminan Sekarang?
          </label>
          <button
            type="button"
            id="chkGuarantee"
            onClick={() => setIsGuaranteeReturned(!isGuaranteeReturned)}
            className={`w-12 h-6 flex items-center rounded-full p-0.5 duration-300 transition-colors ${
              isGuaranteeReturned ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 flex items-center justify-center text-[9px] ${
              isGuaranteeReturned ? 'translate-x-6 text-emerald-600 font-bold' : 'text-gray-400'
            }`}>
              {isGuaranteeReturned ? 'Ya' : 'No'}
            </div>
          </button>
        </div>
      </div>

      {isLate && (
        <div className="bg-red-50 text-red-800 p-3 rounded-2xl border border-red-200 text-xs flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 text-red-600 mt-0.5"/>
          <div>
            <span className="font-bold block">Peringatan Keterlambatan!</span>
            Grup ini terlambat <span className="font-extrabold">{lateDays} hari</span>.
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-red-700 mb-1 definition-flex">
          <DollarSign size={14}/> Nominal Denda Tambahan (Rp)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-bold text-red-600">Rp</span>
          <input 
            type="text" 
            value={formatRupiah(fineAmount)}
            onChange={(e) => setFineAmount(Number(cleanRupiah(e.target.value)) || 0)}
            className="w-full border pl-9 p-2.5 rounded-xl text-sm font-bold text-red-600 outline-none focus:border-red-400 bg-white"
            placeholder="Masukkan 0 jika aman"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Deskripsi Denda</label>
        <textarea 
          value={fineDescription}
          onChange={(e) => setFineDescription(e.target.value)}
          placeholder="Isi alasan jika ada denda" 
          className="w-full border p-2.5 rounded-xl text-xs outline-none focus:border-[#3A4D39] h-20自动 resize-none"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#3A4D39] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#2C3A2B] shadow transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle size={14}/> {loading ? 'Memproses...' : 'Selesaikan Pengembalian'}
      </button>
    </form>
  );

  return (
    <div className="w-full flex-1 flex flex-col justify-between min-w-0 bg-[#D1D1D1]" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      <div className="flex-1 w-full pb-16 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Header Judul Utama Bersih Tanpa Button */}
        <div className="flex items-center mb-6 border-b border-gray-300/60 pb-4">
          <Undo2 className="text-[#3A4D39] flex-shrink-0 mr-3" size={28} />
          <h2 className="text-xl md:text-3xl font-bold text-[#3A4D39] tracking-tight">
            Kelola Pengembalian Busana
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Search & List Data Card */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Box Input Search + Integrasi Button Refresh di Sebelah Kanan Atas Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700">Cari Transaksi Rental Active</label>
                
                {/* Button Refresh Nyempil Proporsional Deket Card Data */}
                <button 
                  onClick={fetchOrders} 
                  disabled={loading}
                  className="flex items-center space-x-1 bg-white border border-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded-xl hover:bg-gray-50 active:scale-95 shadow-2xs transition-all"
                >
                  <RefreshCw size={11} className={`text-[#3A4D39] ${loading ? "animate-spin" : ""}`} />
                  <span className="text-[10px] tracking-wide whitespace-nowrap">Refresh Data</span>
                </button>
              </div>

              <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 px-3">
                <Search size={16} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Ketik nama pelanggan sewa..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 text-sm bg-transparent outline-none text-gray-800"
                />
              </div>
            </div>

            {/* List Card Penyewa */}
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              {groupedActiveList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl text-gray-400 border text-sm">
                  Tidak ada transaksi sewa aktif yang terdeteksi, wok.
                </div>
              ) : (
                groupedActiveList.map((group, index) => {
                  const isCurrentSelected = selectedGroup?.key === group.key;

                  return (
                    <div key={index} className="space-y-2">
                      {/* Card Data Penyewa */}
                      <div 
                        onClick={() => handleSelectGroup(group)}
                        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer text-center sm:text-left ${
                          isCurrentSelected 
                            ? 'shadow-[0_8px_20px_-5px_rgba(58,77,57,0.2)] border-[#3A4D39] bg-[#3A4D39]/5' 
                            : 'border-gray-200 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base capitalize">{group.customer_name}</h4>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar size={12}/> Jadwal: {group.rental_date} s/d {group.return_date}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${group.status === 'late' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {group.status === 'late' ? 'Terlambat' : 'Aktif'}
                            </span>
                            <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded">
                              🔒 Jaminan: {group.guarantee_type}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-gray-600 justify-center sm:justify-start">
                          {group.items.map((item, idx) => (
                            <span key={idx} className="bg-gray-100 border px-2 py-0.5 rounded-lg capitalize">{item}</span>
                          ))}
                        </div>
                      </div>

                      {/* KHUSUS MOBILE: Menyisipkan Form Detail Tepat Di Bawah Card Yang Dipilih */}
                      {isCurrentSelected && (
                        <div className="block lg:hidden bg-white rounded-2xl p-5 border-2 border-[#3A4D39] shadow-md animate-fadeIn mb-4">
                          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-1.5 flex items-center gap-2">
                            <FileText size={14} className="text-[#3A4D39]"/> Detail Proses Form Pengembalian
                          </h3>
                          {renderReturnForm()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: View Desktop Permanen */}
          <div className="hidden lg:block bg-white rounded-3xl p-6 border border-gray-200 shadow-sm h-fit sticky top-24">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
              <FileText size={16} className="text-[#3A4D39]"/> Detail Proses Form
            </h3>

            {selectedGroup ? (
              renderReturnForm()
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs font-medium">
                Pilih salah satu data transaksi rental aktif di sebelah kiri untuk memproses pemulangan baju, wok.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}