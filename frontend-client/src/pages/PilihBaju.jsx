import React, { useState } from 'react';
import { ShoppingCart, X, Calendar, User, Wallet, ClipboardCheck, Minus, Plus, Trash2, Search, Clock, ShieldCheck, Phone } from 'lucide-react';

export default function PilihBaju({ costumesData = [], loadingCostumes, onRefresh }) {
  const dataAman = Array.isArray(costumesData) ? costumesData : [];
  
  const [cart, setCart] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    customer_name: '', 
    customer_phone: '', // <-- State awal no hp
    rental_date: '', 
    return_date: '', 
    payment_status: 'lunas', 
    dp_amount: 0, 
    status: 'booking',
    rent_days: '1',
    guarantee_type: 'KTP', 
    guarantee_detail: '' 
  });

  const formatRupiah = (angka) => {
    if (!angka && angka !== 0) return '';
    const cleanNumber = String(angka).split('.')[0].replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(cleanNumber);
  };

  const cleanRupiah = (stringRupiah) => {
    return String(stringRupiah).replace(/\./g, '');
  };

  const filteredCostumes = dataAman.filter(baju => {
    const name = (baju.costume_name ?? baju.name ?? '').toLowerCase();
    const category = (baju.category ?? '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || category.includes(query);
  });

  const addToCart = (baju) => {
    const readyStok = Number(baju.baju_tersedia) || 0;
    const existing = cart.find(item => item.id === baju.id);

    if (existing) {
      if (existing.quantity >= readyStok) {
        alert(`Stok tersedia hanya sisa ${readyStok} Pcs!`);
        return;
      }
      setCart(cart.map(item => item.id === baju.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...baju, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, amount) => {
    const item = cart.find(i => i.id === id);
    const readyStok = Number(item.baju_tersedia) || 0;
    const newQty = item.quantity + amount;

    if (newQty > readyStok) {
      alert(`Stok maksimal: ${readyStok} Pcs.`);
      return;
    }
    if (newQty <= 0) {
      setCart(cart.filter(i => i.id !== id));
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateReturnDate = (startDateStr, days) => {
    if (!startDateStr) return '';
    const daysNum = parseInt(days, 10) || 1;
    const startDate = new Date(startDateStr);
    startDate.setDate(startDate.getDate() + (daysNum - 1));
    return startDate.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'rental_date') {
      const computedReturn = calculateReturnDate(value, formData.rent_days);
      setFormData(prev => ({ ...prev, rental_date: value, return_date: computedReturn }));
    } else if (name === 'rent_days') {
      const computedReturn = calculateReturnDate(formData.rental_date, value);
      setFormData(prev => ({ ...prev, rent_days: value, return_date: computedReturn }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Keranjang rental kosong!');
    if (!formData.rental_date || !formData.return_date) return alert('Pilih tanggal persewaan dahulu!');
    if (!formData.guarantee_detail.trim()) return alert('Keterangan detail jaminan wajib diisi!');

    let checkoutQueue = [];
    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        checkoutQueue.push(item);
      }
    });

    let successCount = 0;
    let failedCount = 0;

    const selectedStatus = formData.status; 
    const mappedFulfillment = selectedStatus === 'booking' ? 'belum_diambil' : 'sudah_diambil';

    for (const item of checkoutQueue) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rentals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            costume_id: item.id,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone, // <-- Kirim no hp ke backend
            rental_date: formData.rental_date,
            return_date: formData.return_date,
            payment_status: formData.payment_status,
            dp_amount: formData.payment_status === 'dp' ? (Number(formData.dp_amount) || 0) : 0,
            status: selectedStatus,             
            fulfillment_status: mappedFulfillment,
            guarantee_type: formData.guarantee_type,
            guarantee_detail: formData.guarantee_detail,
            guarantee_status: 'ditahan_admin' 
          })
        });

        const res = await response.json();
        if (response.ok && res.success) successCount++;
        else failedCount++;
      } catch (error) {
        failedCount++;
      }
    }

    if (successCount > 0) {
      alert(`Berhasil membuat rental kelompok untuk ${successCount} baju adat beserta data jaminan aman ditahan!`);
      setCart([]);
      setIsModalOpen(false);
      setFormData({
        customer_name: '', customer_phone: '', rental_date: '', payment_status: 'lunas', dp_amount: 0, status: 'booking', rent_days: '1', guarantee_type: 'KTP', guarantee_detail: ''
      });
      onRefresh(); 
    }
    if (failedCount > 0) alert(`Ada ${failedCount} sewa baju gagal diproses server.`);
  };

  const hitungTotalBiayaCart = () => {
    const days = parseInt(formData.rent_days, 10) || 1;
    return cart.reduce((acc, curr) => {
      let hargaPaket = 0;
      if (days === 1) {
        hargaPaket = Number(curr.price_1_day) || 0;
      } else if (days === 2) {
        hargaPaket = Number(curr.price_2_day) || 0;
      } else {
        hargaPaket = Number(curr.price_3_day) || 0;
      }
      return acc + (hargaPaket * curr.quantity);
    }, 0);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between bg-[#D1D1D1]" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      <div className="flex-1 w-full pb-16 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[#3A4D39] mt-2 mb-6 tracking-tight uppercase">Katalog Pilih Rental Baju</h2>

        <div className="w-full max-w-md mx-auto mb-8">
          <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:border-[#3A4D39] transition-all duration-300 px-3">
            <Search size={18} className="text-gray-400 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Cari baju adat atau asal daerah..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loadingCostumes ? (
          <div className="text-center py-12 text-gray-500 font-medium text-xs sm:text-sm">Memuat katalog baju adat...</div>
        ) : filteredCostumes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-xs max-w-md mx-auto p-6 text-xs sm:text-sm border">
            {searchQuery ? 'Baju adat yang lu cari gak nemu wok.' : 'Belum ada koleksi baju di database.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredCostumes.map((baju) => {
              const name = baju.costume_name ?? baju.name ?? 'Baju Adat';
              const readyStok = Number(baju.baju_tersedia) || 0; 
              const isReady = readyStok > 0;
              const inCart = cart.find(item => item.id === baju.id);

              return (
                <div key={baju.id} className="bg-white rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 group overflow-hidden border border-gray-100">
                  <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden relative shadow-xs">
                    {baju.image ? (
                      <img src={baju.image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">No Image</div>
                    )}
                    {!isReady && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold tracking-wider">HABIS</div>
                    )}
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 bg-[#3A4D39] text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                        {inCart.quantity} Pilih
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-base tracking-tight uppercase truncate">{name}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-400 capitalize mt-0.5 truncate">{baju.category}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-1.5 border-t border-gray-50 gap-1">
                        <p className="text-xs sm:text-sm font-extrabold text-[#3A4D39] truncate">
                          Rp {Number(baju.price_1_day).toLocaleString('id-ID')} <span className="text-[8px] sm:text-[10px] font-normal text-gray-400">/ 1 Hari</span>
                        </p>
                        <span className="text-[9px] sm:text-[10px] bg-[#EDF2EE] text-[#3A4D39] px-2 py-0.5 rounded-full font-bold w-fit">
                          Sisa: {readyStok}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => isReady && addToCart(baju)} 
                      disabled={!isReady} 
                      className={`mt-3 w-full py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-white tracking-wider uppercase transition-all duration-300 ${
                        isReady ? 'bg-[#3A4D39] hover:bg-[#2C3A2B] active:scale-95' : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {inCart ? 'Tambah' : 'Pilih'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-4 bg-[#3A4D39] text-white px-4 py-3 rounded-full flex items-center space-x-2 shadow-2xl z-40 font-bold text-xs hover:bg-[#2C3A2B] transition-all duration-300 active:scale-95">
          <ShoppingCart size={14} />
          <span>Keranjang ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="flex items-center space-x-3 pb-3 border-b">
              <ShoppingCart className="text-[#3A4D39]" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Keranjang Checkout Rental</h3>
            </div>

            <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto">
              {cart.map((item) => {
                let currentPrice = formData.rent_days === '1' ? item.price_1_day : formData.rent_days === '2' ? item.price_2_day : item.price_3_day;
                return (
                  <div key={item.id} className="bg-gray-50 p-2.5 rounded-xl flex items-center justify-between text-xs border border-gray-100">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">{item.costume_name ?? item.name}</p>
                      <p className="text-gray-500 font-semibold text-[#3A4D39]">Rp {Number(currentPrice).toLocaleString('id-ID')} / Paket {formData.rent_days} Hari</p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-white border rounded-md"><Minus size={10}/></button>
                      <span className="font-bold text-gray-800 text-xs px-1">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-white border rounded-md"><Plus size={10}/></button>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 ml-1.5"><Trash2 size={12}/></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleCheckout} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1"><User size={12}/> Nama Penyewa</label>
                  <input type="text" name="customer_name" required value={formData.customer_name} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs outline-none focus:border-[#3A4D39]" placeholder="Nama pelanggan" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1"><Phone size={12}/> No Telepon</label>
                  <input type="text" name="customer_phone" required value={formData.customer_phone} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs outline-none focus:border-[#3A4D39]" placeholder="08xxxxxx" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={12}/> Mau Sewa (Hari)</label>
                  <input type="number" name="rent_days" min="1" max="30" required value={formData.rent_days} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs outline-none font-bold text-center text-[#3A4D39]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1"><Calendar size={12}/> Tgl Awal</label>
                  <input type="date" name="rental_date" required value={formData.rental_date} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Tgl Selesai</label>
                  <input type="date" name="return_date" readOnly value={formData.return_date} className="w-full border p-2 rounded-xl text-xs bg-gray-100 text-gray-600 outline-none font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1"><Wallet size={12}/> Status Bayar</label>
                  <select name="payment_status" value={formData.payment_status} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs outline-none bg-white">
                    <option value="lunas">Lunas</option>
                    <option value="dp">Uang Muka (DP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1"><ClipboardCheck size={12}/> Status Awal Sewa</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs outline-none bg-white font-bold text-[#3A4D39]">
                    <option value="booking">Aktif (Booking / Belum Diambil)</option>
                    <option value="active">Aktif (Sedang Rental / Diambil)</option>
                  </select>
                </div>
              </div>

              {formData.payment_status === 'dp' && (
                <div className="animate-fadeIn">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Nominal DP (Rp)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-gray-500 font-medium">Rp</span>
                    <input 
                      type="text" 
                      required 
                      value={formatRupiah(formData.dp_amount)} 
                      onChange={(e) => setFormData(prev => ({ ...prev, dp_amount: Number(cleanRupiah(e.target.value)) || 0 }))} 
                      className="w-full border pl-8 p-2 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#3A4D39] bg-white" 
                      placeholder="50.000" 
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-[#3A4D39]"/> Informasi Jaminan Wajib
                </span>
                
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="col-span-1 text-[11px] font-bold text-gray-600">Jenis Jaminan</label>
                  <select 
                    name="guarantee_type" 
                    value={formData.guarantee_type} 
                    onChange={handleChange} 
                    className="col-span-2 border p-1.5 rounded-xl text-xs bg-white outline-none focus:border-[#3A4D39]"
                  >
                    <option value="KTP">KTP Asli</option>
                    <option value="SIM">SIM Asli</option>
                    <option value="Uang">Uang Jaminan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-600">
                    {formData.guarantee_type === 'Uang' ? 'Nominal Uang Jaminan (Rp / Keterangan)' : 'No. Identitas / Keterangan Detail'}
                  </label>
                  <input 
                    type="text"
                    name="guarantee_detail"
                    required
                    placeholder={formData.guarantee_type === 'Uang' ? 'Contoh: 100.000' : 'Contoh: KTP atas nama pelanggan'}
                    value={formData.guarantee_detail}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-xl text-xs bg-white outline-none focus:border-[#3A4D39] font-medium text-gray-800"
                  />
                </div>
              </div>

              <div className="mt-3 bg-green-50 p-2.5 rounded-xl text-xs flex justify-between font-bold text-[#3A4D39] border border-green-200">
                <span>Total Estimasi Pembayaran:</span>
                <span>Rp {hitungTotalBiayaCart().toLocaleString('id-ID')}</span>
              </div>

              <button type="submit" className="w-full bg-[#3A4D39] text-white p-2.5 rounded-xl text-xs font-bold hover:bg-[#2C3A2B] mt-2 shadow-md uppercase tracking-wider transition-all">
                Konfirmasi & Ambil Baju
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}