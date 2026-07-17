import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Trash2, CheckCircle, AlertTriangle, Printer, Clock, Calendar, MoreVertical, X, Search, Phone, RefreshCw } from 'lucide-react';

export default function DaftarPesanan() {
  const [orders, setOrders] = useState([]);
  const [costumesList, setCostumesList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    rental_date: '',
    return_date: '',
    status: '',
    fine_amount: 0,
    fine_description: '',
    items: [] 
  });
  
  const [activeDropdown, setActiveDropdown] = useState(null);

  const formatRupiah = (angka) => {
    if (!angka && angka !== 0) return '';
    const cleanNumber = String(angka).split('.')[0].replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(cleanNumber);
  };

  const cleanRupiah = (stringRupiah) => {
    return String(stringRupiah).replace(/\./g, '');
  };

  const getGroupedOrders = () => {
    const groups = {};

    orders.forEach(order => {
      const key = `${order.customer_name}_${order.rental_date}_${order.return_date}`;
      const costumeName = order.costume ? (order.costume.name ?? order.costume.costume_name) : 'Baju Adat (#ID:' + order.costume_id + ')';
      const basePrice = order.costume ? (order.costume.price_1_day ?? 0) : 0;
      const dbFine = Number(order.fine_amount) || 0; 

      if (!groups[key]) {
        groups[key] = {
          customer_name: order.customer_name,
          customer_phone: order.customer_phone || '-',
          rental_date: order.rental_date,
          return_date: order.return_date,
          total_payment: 0,
          fine_amount: 0, 
          fine_description: order.fine_description || '',
          status: order.status, 
          items: [],
          originalOrders: []
        };
      }

      groups[key].items.push({
        id: order.id,
        costume_id: order.costume_id,
        costume_name: costumeName,
        price_per_day: basePrice,
        total_payment: Number(order.total_payment) || 0
      });

      groups[key].total_payment += (Number(order.total_payment) || 0);
      groups[key].fine_amount += dbFine; 
      if (order.fine_description && !groups[key].fine_description.includes(order.fine_description)) {
        groups[key].fine_description = groups[key].fine_description 
          ? groups[key].fine_description + ', ' + order.fine_description 
          : order.fine_description;
      }
      groups[key].originalOrders.push(order);

      if (order.status === 'late') {
        groups[key].status = 'late';
      } else if (groups[key].status !== 'late' && order.status === 'active') {
        groups[key].status = 'active';
      } else if (groups[key].status !== 'late' && groups[key].status !== 'active' && order.status === 'booking') {
        groups[key].status = 'booking';
      } else if (groups[key].status !== 'late' && groups[key].status !== 'active' && groups[key].status !== 'booking' && order.status === 'returned') {
        groups[key].status = 'returned';
      }
    });

    let arrayGroups = Object.values(groups);

    if (searchQuery) {
      arrayGroups = arrayGroups.filter(g => 
        (g.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      arrayGroups = arrayGroups.filter(g => {
        if (statusFilter === 'booking') return g.status === 'booking';
        if (statusFilter === 'active') return g.status === 'active';
        if (statusFilter === 'late') return g.status === 'late';
        if (statusFilter === 'returned_no_fine') return g.status === 'returned' && g.fine_amount <= 0;
        if (statusFilter === 'returned_fine') return g.status === 'returned' && g.fine_amount > 0;
        return true;
      });
    }

    return arrayGroups;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rentals`);
      const res = await response.json();
      if (response.ok && res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Gagal memuat data pesanan:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostumes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/costumes`);
      const res = await response.json();
      if (response.ok && res.data) {
        setCostumesList(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar opsi kostum", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCostumes();
  }, []);

  const handleDeleteGroup = async (originalOrders) => {
    if (!window.confirm("Apakah anda yakin ingin menghapus seluruh riwayat pesanan kelompok ini?")) return;
    try {
      setLoading(true);
      const deletePromises = originalOrders.map(order => 
        fetch(`${import.meta.env.VITE_API_BASE_URL}/rentals/${order.id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        })
      );
      await Promise.all(deletePromises);
      alert("Seluruh pesanan dalam grup ini berhasil dihapus!");
      fetchOrders();
    } catch (error) {
      alert("Gagal menghapus beberapa data pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setEditForm({
      customer_name: group.customer_name,
      customer_phone: group.customer_phone || '',
      rental_date: group.rental_date,
      return_date: group.return_date,
      status: group.status,
      fine_amount: group.fine_amount,
      fine_description: group.fine_description || '',
      items: group.items.map(item => ({
        id: item.id,
        costume_id: item.costume_id,
        total_payment: item.total_payment
      }))
    });
    setIsEditModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editForm.items];
    newItems[index][field] = value;
    setEditForm({ ...editForm, items: newItems });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatePromises = editForm.items.map((item, index) => {
        const distributedFine = index === 0 ? editForm.fine_amount : 0; 
        const distributedDesc = index === 0 ? editForm.fine_description : '';
        
        return fetch(`${import.meta.env.VITE_API_BASE_URL}/rentals/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            customer_name: editForm.customer_name,
            customer_phone: editForm.customer_phone, 
            rental_date: editForm.rental_date,
            return_date: editForm.return_date,
            status: editForm.status,
            costume_id: item.costume_id,
            total_payment: Number(item.total_payment) || 0,
            fine_amount: distributedFine,
            fine_description: distributedDesc
          })
        });
      });

      await Promise.all(updatePromises);
      alert("Seluruh data transaksi kelompok berhasil diperbarui!");
      setIsEditModalOpen(false);
      fetchOrders();
    } catch (error) {
      alert("Gagal memperbarui detail transaksi grup.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintNota = (group) => {
    const aggregatedItems = {};
    group.items.forEach(item => {
      if (!aggregatedItems[item.costume_name]) {
        aggregatedItems[item.costume_name] = {
          price_per_day: item.price_per_day,
          quantity: 0,
          total_payment: 0
        };
      }
      aggregatedItems[item.costume_name].quantity += 1;
      aggregatedItems[item.costume_name].total_payment += item.total_payment;
    });

    let costumeRowsHtml = '';
    Object.entries(aggregatedItems).forEach(([name, details]) => {
      costumeRowsHtml += `
        <tr>
          <td style="text-transform: uppercase;">${name} <strong>(${details.quantity} Pcs)</strong></td>
          <td>Rp ${Number(details.price_per_day).toLocaleString('id-ID')}</td>
          <td style="text-align:right;">Rp ${Number(details.total_payment).toLocaleString('id-ID')}</td>
        </tr>
      `;
    });

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Rental - ${group.customer_name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 30px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px dashed #3A4D39; padding-bottom: 15px; margin-bottom: 20px; }
            .brand { font-size: 24px; font-weight: bold; color: #3A4D39; text-transform: uppercase; letter-spacing: 2px; }
            .title { font-size: 12px; color: #666; margin-top: 5px; }
            .info-table { width: 100%; margin-bottom: 20px; font-size: 13px; }
            .info-table td { padding: 4px 0; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            .details-table th { background: #EDF2EE; padding: 10px; text-align: left; color: #3A4D39; border-bottom: 1px solid #ddd; }
            .details-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .total-section { text-align: right; margin-top: 20px; font-size: 14px; font-weight: bold; }
            .footer-note { text-align: center; margin-top: 40px; font-size: 11px; color: #888; border-top: 1px dashed #ccc; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">⭐ SEHATI PUTRI ⭐</div>
            <div class="title">Nota Resmi Penyewaan Busana & Pakaian Adat Premium</div>
          </div>
          <table class="info-table">
            <tr><td><strong>Nama Penyewa:</strong> ${group.customer_name}</td><td style="text-align:right;"><strong>ID Grup:</strong> #${group.originalOrders[0]?.id}</td></tr>
            <tr><td><strong>No. Telp:</strong> ${group.customer_phone}</td><td style="text-align:right;"><strong>Status:</strong> ${group.status.toUpperCase()}</td></tr>
            <tr><td><strong>Tgl Mulai:</strong> ${group.rental_date}</td><td></td></tr>
            <tr><td><strong>Tgl Selesai:</strong> ${group.return_date}</td><td></td></tr>
          </table>
          <table class="details-table">
            <thead>
              <tr><th>Nama Pakaian (Qty)</th><th>Harga Dasar</th><th style="text-align:right;">Total</th></tr>
            </thead>
            <tbody>
              ${costumeRowsHtml}
            </tbody>
          </table>
          <div class="total-section">
            ${group.fine_amount > 0 ? `<p style="color:red; font-weight:normal; font-size:12px; margin-bottom:5px;">Total Denda Admin: Rp ${Number(group.fine_amount).toLocaleString('id-ID')}</p>` : ''}
            ${group.fine_description ? `<p style="color:red; font-weight:normal; font-size:11px; margin-bottom:5px;">Keterangan Denda: ${group.fine_description}</p>` : ''}
            <p>Total Pembayaran Akhir: Rp ${(Number(group.total_payment) + Number(group.fine_amount)).toLocaleString('id-ID')}</p>
          </div>
          <div class="footer-note">
            <p>Terima kasih telah mempercayakan kebutuhan busana adat Anda pada Sehati Putri.<br/>Harap kembalikan pakaian sewaan tepat waktu sesuai dengan jadwal kesepakatan nota.</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'returned': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap"><CheckCircle size={12}/> Dikembalikan</span>;
      case 'active': return <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap"><Clock size={12}/> Sedang Rental</span>;
      case 'booking': return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap"><Calendar size={12}/> Booking</span>;
      case 'late': return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap"><AlertTriangle size={12}/> Terlambat</span>;
      default: return <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap">{status}</span>;
    }
  };

  const groupedOrdersList = getGroupedOrders();

  return (
    <div className="w-full flex-1 flex flex-col justify-between min-w-0 bg-[#D1D1D1]" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      <div className="flex-1 w-full pb-16 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Header Judul Utama Bersih - Tanpa Button Menggantung */}
        <div className="flex items-center mb-6 border-b border-gray-300/60 pb-4">
          <FileText className="text-[#3A4D39] flex-shrink-0 mr-3" size={28} />
          <h2 className="text-xl md:text-3xl font-bold text-[#3A4D39] tracking-tight">Daftar Kelola Pesanan</h2>
        </div>

        {/* Section Filter & Search + Integrasi Button Refresh Realtime */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 w-full items-stretch lg:items-center justify-between">
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-full lg:w-auto overflow-x-auto touch-pan-x">
            <div className="flex items-center space-x-1 overflow-x-auto whitespace-nowrap wrapper-scroll">
              <button onClick={() => setStatusFilter('all')} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${statusFilter === 'all' ? 'bg-[#3A4D39] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Semua ({orders.length})</button>
              <button onClick={() => setStatusFilter('booking')} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${statusFilter === 'booking' ? 'bg-amber-600 text-white' : 'text-amber-600 hover:bg-amber-50'}`}>Booking</button>
              <button onClick={() => setStatusFilter('active')} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${statusFilter === 'active' ? 'bg-sky-600 text-white' : 'text-sky-600 hover:bg-sky-50'}`}>Aktif Sewa</button>
              <button onClick={() => setStatusFilter('late')} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${statusFilter === 'late' ? 'bg-rose-600 text-white' : 'text-rose-600 hover:bg-rose-50'}`}>Terlambat</button>
              <button onClick={() => setStatusFilter('returned_no_fine')} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${statusFilter === 'returned_no_fine' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50'}`}>Kembali (No Denda)</button>
              <button onClick={() => setStatusFilter('returned_fine')} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${statusFilter === 'returned_fine' ? 'bg-red-700 text-white' : 'text-red-700 hover:bg-red-50'}`}>Kembali (+ Denda)</button>
            </div>
          </div>

          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
            {/* Row Label Atas Input: Judul Cari + Button Refresh Nyempil Proporsional */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Cari Riwayat Pesanan</span>
              
              <button 
                onClick={fetchOrders} 
                disabled={loading}
                className="flex items-center space-x-1 bg-white border border-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded-xl hover:bg-gray-50 active:scale-95 shadow-2xs transition-all"
              >
                <RefreshCw size={11} className={`text-[#3A4D39] ${loading ? "animate-spin" : ""}`} />
                <span className="text-[10px] tracking-wide whitespace-nowrap">Refresh Data</span>
              </button>
            </div>

            {/* Input Form Search */}
            <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 px-3">
              <Search size={16} className="text-gray-400 mr-2" />
              <input type="text" placeholder="Cari nama pelanggan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-2 text-xs bg-transparent outline-none text-gray-800" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Memuat riwayat transaksi...</div>
        ) : groupedOrdersList.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-3xl border shadow-xs">Data tidak ditemukan wok.</div>
        ) : (
          <div className="w-full">
            {/* View Mobile */}
            <div className="block lg:hidden space-y-4">
              {groupedOrdersList.map((group, index) => {
                const itemCounts = {};
                group.items.forEach(item => { itemCounts[item.costume_name] = (itemCounts[item.costume_name] || 0) + 1; });

                return (
                  <div key={index} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm capitalize">{group.customer_name}</h4>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1"><Phone size={10}/> {group.customer_phone}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{group.rental_date} s/d {group.return_date}</p>
                      </div>
                      <div className="relative">
                        <button onClick={() => setActiveDropdown(activeDropdown === index ? null : index)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <MoreVertical size={16} />
                        </button>
                        {activeDropdown === index && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}></div>
                            <div className="absolute right-0 top-8 w-36 bg-white border rounded-xl shadow-xl py-2 z-40">
                              <button onClick={() => { handlePrintNota(group); setActiveDropdown(null); }} className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"><Printer size={14}/> <span>Cetak Nota</span></button>
                              <button onClick={() => { openEditModal(group); setActiveDropdown(null); }} className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><Edit2 size={14}/> <span>Edit Data</span></button>
                              <button onClick={() => { handleDeleteGroup(group.originalOrders); setActiveDropdown(null); }} className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14}/> <span>Hapus</span></button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 mb-3 bg-gray-50 p-2.5 rounded-xl border font-medium">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Item Baju</span> 
                      {Object.entries(itemCounts).map(([name, count], idx) => (
                        <div key={idx} className="capitalize text-gray-950">{idx + 1}. {name} ({count} Pcs)</div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div>
                        <p className="font-bold text-gray-950 text-sm">Rp {group.total_payment.toLocaleString('id-ID')}</p>
                        {group.fine_amount > 0 && <p className="text-[10px] font-bold text-red-600">+ Denda Rp {group.fine_amount.toLocaleString('id-ID')}</p>}
                      </div>
                      <div>{getStatusBadge(group.status)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View Desktop */}
            <div className="hidden lg:block bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="bg-[#334239] text-white font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-4 text-center w-12">No</th>
                      <th className="px-5 py-4">Nama Pelanggan</th>
                      <th className="px-5 py-4">No Telepon</th>
                      <th className="px-5 py-4">Koleksi Baju</th>
                      <th className="px-5 py-4">Tgl Pinjam</th>
                      <th className="px-5 py-4">Tgl Kembali</th>
                      <th className="px-5 py-4">Total Pokok</th>
                      <th className="px-5 py-4">Denda</th>
                      <th className="px-5 py-4 text-center w-32">Status</th>
                      <th className="px-5 py-4 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700 bg-white">
                    {groupedOrdersList.map((group, index) => {
                      const itemCounts = {};
                      group.items.forEach(item => { itemCounts[item.costume_name] = (itemCounts[item.costume_name] || 0) + 1; });

                      return (
                        <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-4 text-gray-400 text-center">{index + 1}</td>
                          <td className="px-5 py-4 text-gray-900 capitalize">{group.customer_name}</td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{group.customer_phone}</td>
                          <td className="px-5 py-4 capitalize text-gray-600">
                            {Object.entries(itemCounts).map(([name, count], idx) => (
                              <div key={idx} className="whitespace-nowrap">{idx + 1}. {name} ({count} Pcs)</div>
                            ))}
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{group.rental_date}</td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{group.return_date}</td>
                          <td className="px-5 py-4 text-gray-900 whitespace-nowrap">Rp {group.total_payment.toLocaleString('id-ID')}</td>
                          <td className={`px-5 py-4 whitespace-nowrap ${group.fine_amount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{group.fine_amount > 0 ? `Rp ${group.fine_amount.toLocaleString('id-ID')}` : '-'}</td>
                          <td className="px-5 py-4 text-center align-middle">{getStatusBadge(group.status)}</td>
                          <td className="px-5 py-4 text-center align-middle relative">
                            <button onClick={() => setActiveDropdown(activeDropdown === index ? null : index)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><MoreVertical size={16}/></button>
                            {activeDropdown === index && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}></div>
                                <div className="absolute right-12 top-6 w-36 bg-white border rounded-xl shadow-xl py-2 z-40 text-left">
                                  <button onClick={() => { handlePrintNota(group); setActiveDropdown(null); }} className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"><Printer size={14}/> <span>Cetak Nota</span></button>
                                  <button onClick={() => { openEditModal(group); setActiveDropdown(null); }} className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"><Edit2 size={14}/> <span>Edit Full</span></button>
                                  <button onClick={() => { handleDeleteGroup(group.originalOrders); setActiveDropdown(null); }} className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14}/> <span>Hapus</span></button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Lengkap Transaksi Kelompok</h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pelanggan</label>
                  <input type="text" required value={editForm.customer_name} onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">No. HP / Telepon</label>
                  <input type="text" required value={editForm.customer_phone} onChange={(e) => setEditForm({...editForm, customer_phone: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Pinjam</label>
                  <input type="date" required value={editForm.rental_date} onChange={(e) => setEditForm({...editForm, rental_date: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Kembali</label>
                  <input type="date" required value={editForm.return_date} onChange={(e) => setEditForm({...editForm, return_date: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status Transaksi</label>
                <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none bg-white">
                  <option value="booking">Booking</option>
                  <option value="active">Aktif (Sedang Rental)</option>
                  <option value="returned">Returned (Selesai)</option>
                  <option value="late">Terlambat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-red-700 mb-1 flex items-center gap-1"><AlertTriangle size={14}/> Input Denda Manual (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-gray-500">Rp</span>
                  <input type="text" value={formatRupiah(editForm.fine_amount)} onChange={(e) => setEditForm({...editForm, fine_amount: Number(cleanRupiah(e.target.value)) || 0})} className="w-full border pl-9 p-2.5 rounded-xl text-sm font-bold text-red-600 bg-white" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan Denda</label>
                <textarea value={editForm.fine_description} onChange={(e) => setEditForm({...editForm, fine_description: e.target.value})} placeholder="Contoh: Terlambat & kotor" className="w-full border p-2.5 rounded-xl text-sm outline-none h-16 resize-none" />
              </div>

              <div className="border-t pt-3 space-y-3">
                <label className="block text-xs font-bold text-gray-800 uppercase">Daftar Baju Yang Disewa</label>
                {editForm.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-2xl border space-y-2 relative">
                    <span className="absolute top-2 right-3 text-[10px] font-bold text-gray-400">Item #{idx+1}</span>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block mb-0.5">Pilih Baju Adat</span>
                      <select value={item.costume_id} onChange={(e) => handleItemChange(idx, 'costume_id', Number(e.target.value))} className="w-full border p-2 rounded-xl text-xs bg-white">
                        {costumesList.map(c => <option key={c.id} value={c.id}>{c.costume_name || c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block mb-0.5">Subtotal Bayar Item (Rp)</span>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs text-gray-500">Rp</span>
                        <input type="text" value={formatRupiah(item.total_payment)} onChange={(e) => handleItemChange(idx, 'total_payment', Number(cleanRupiah(e.target.value)) || 0)} className="w-full border pl-8 p-2 rounded-xl text-xs font-bold text-gray-800 bg-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 border rounded-xl text-xs font-semibold hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-[#3A4D39] text-white rounded-xl text-xs font-bold hover:bg-[#2C3A2B]">Simpan Detail Pesanan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}