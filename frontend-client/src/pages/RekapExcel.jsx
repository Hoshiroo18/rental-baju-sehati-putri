import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-rental.hoshiroo.my.id/api';

export default function RekapExcel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rentals`);
      const res = await response.json();
      if (response.ok && res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data untuk rekap:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const exportToExcel = (tipe) => {
    if (orders.length === 0) {
      alert("Tidak ada data pesanan yang bisa direkap!");
      return;
    }

    const sekarang = new Date();
    sekarang.setHours(0, 0, 0, 0);

    const dataTersaring = orders.filter(order => {
      const tglOrder = new Date(order.rental_date);
      tglOrder.setHours(0, 0, 0, 0);

      if (tipe === 'harian') return tglOrder.getTime() === sekarang.getTime();
      if (tipe === 'mingguan') {
        const selisihWaktu = sekarang.getTime() - tglOrder.getTime();
        const selisihHari = selisihWaktu / (1000 * 3600 * 24);
        return selisihHari >= 0 && selisihHari <= 7;
      } 
      if (tipe === 'bulanan') return tglOrder.getMonth() === sekarang.getMonth() && tglOrder.getFullYear() === sekarang.getFullYear();
      if (tipe === 'tahunan') return tglOrder.getFullYear() === sekarang.getFullYear();
      return true;
    });

    if (dataTersaring.length === 0) {
      alert(`Data rekap ${tipe} kosong untuk saat ini!`);
      return;
    }

    const rows = dataTersaring.map((order, index) => ({
      'No': index + 1,
      'Nama Pelanggan': order.customer_name,
      'No. HP': order.customer_phone || '-',
      'Baju Adat': order.costume ? (order.costume.name ?? order.costume.costume_name) : 'Baju Adat ID #' + order.costume_id,
      'Kategori': order.costume ? order.costume.category : '-',
      'Tanggal Pinjam': order.rental_date,
      'Tanggal Kembali': order.return_date,
      'Status': order.status.toUpperCase(),
      'Total Pembayaran (Rp)': Number(order.total_payment) || 0,
      'Uang Muka/DP (Rp)': Number(order.dp_amount) || 0,
      'Status Bayar': order.payment_status.toUpperCase(),
      'Denda Admin (Rp)': Number(order.fine_amount) || 0,
      'Keterangan Denda': order.fine_description || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${tipe}`);

    const maxProps = Object.keys(rows[0]);
    worksheet['!cols'] = maxProps.map(prop => ({
      wch: Math.max(...rows.map(row => row[prop] ? row[prop].toString().length : 0), prop.length) + 3
    }));

    const namaFile = `Rekap_${tipe.toUpperCase()}_SEHATI_PUTRI_${sekarang.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, namaFile);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between min-w-0 bg-[#D1D1D1]" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      <div className="flex-1 w-full pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b border-gray-300/60 pb-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="bg-[#3A4D39] p-2.5 rounded-xl text-white shadow-sm">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#3A4D39] tracking-tight">Pusat Rekap Data Excel</h2>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">Unduh data laporan realtime inventaris & keuangan ke format spreadsheet.</p>
            </div>
          </div>
          <button 
            onClick={fetchAllOrders} 
            disabled={loading}
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 font-bold py-2 px-5 text-xs sm:text-sm rounded-xl hover:bg-gray-50 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Sync Database
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs mb-6 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-700 px-2.5 py-1.5 rounded-xl border border-green-100 font-black text-sm">
              📊 {orders.length}
            </div>
            <div>
              <span className="font-bold text-gray-800 block">Total Data Terkunci</span>
              <span className="text-[11px] text-gray-400 block sm:inline">Seluruh riwayat transaksi di MySQL siap diekspor.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-100 w-fit block">Hari Ini</span>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-2">Rekap Transaksi Harian</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-relaxed">Mengunduh semua transaksi sewa baju adat yang masuk per tanggal hari ini.</p>
            </div>
            <button onClick={() => exportToExcel('harian')} className="mt-4 sm:mt-5 w-full bg-[#3A4D39] hover:bg-[#2C3A2B] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]">
              <Download size={13}/> Download Excel
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <span className="bg-sky-50 text-sky-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-sky-100 w-fit block">7 Hari Terakhir</span>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-2">Rekap Transaksi Mingguan</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-relaxed">Mengunduh riwayat sirkulasi busana adat dalam periode 1 minggu terakhir.</p>
            </div>
            <button onClick={() => exportToExcel('mingguan')} className="mt-4 sm:mt-5 w-full bg-[#3A4D39] hover:bg-[#2C3A2B] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]">
              <Download size={13}/> Download Excel
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-100 w-fit block">Bulan Berjalan</span>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-2">Rekap Transaksi Bulanan</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-relaxed">Laporan omset kas, total denda, dan baju terpopuler dalam bulan ini.</p>
            </div>
            <button onClick={() => exportToExcel('bulanan')} className="mt-4 sm:mt-5 w-full bg-[#3A4D39] hover:bg-[#2C3A2B] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]">
              <Download size={13}/> Download Excel
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-rose-100 w-fit block">Arsip 1 Tahun</span>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-2">Rekap Transaksi Tahunan</h4>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-relaxed">Audit besar seluruh data penyewaan baju sehati putri sepanjang tahun aktif.</p>
            </div>
            <button onClick={() => exportToExcel('tahunan')} className="mt-4 sm:mt-5 w-full bg-[#3A4D39] hover:bg-[#2C3A2B] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]">
              <Download size={13}/> Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}