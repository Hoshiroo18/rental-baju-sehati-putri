import React, { useState, useEffect } from 'react';
import { RefreshCw, Package, Trash2, Image as ImageIcon, Plus, X, Pencil, Upload, Clock, MoreVertical, Search } from 'lucide-react';

export default function StokBaju({ costumesData = [], loadingCostumes, onRefresh }) {
  const dataAman = Array.isArray(costumesData) ? costumesData : [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', category: '', price_1_day: '', price_2_day: '', price_3_day: '', stock_total: '', image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const filteredCostumes = dataAman.filter(baju => {
    const name = (baju.costume_name ?? baju.name ?? '').toLowerCase();
    const category = (baju.category ?? '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || category.includes(query);
  });

  const totalVarian = filteredCostumes.length;
  const totalAsetBaju = filteredCostumes.reduce((acc, curr) => {
    const stok = curr.total_stok ?? curr.stock_total ?? 0;
    return acc + Number(stok);
  }, 0);

  const formatRupiah = (angka) => {
    if (!angka) return '';
    const cleanNumber = String(angka).split('.')[0].replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(cleanNumber);
  };

  const cleanRupiah = (stringRupiah) => {
    return String(stringRupiah).replace(/\./g, '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('price_')) {
      const rawValue = cleanRupiah(value);
      setFormData({ ...formData, [name]: rawValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          
          // Validasi ukuran file di sisi React (10MB = 10 * 1024 * 1024 bytes)
          if (file.size > 10 * 1024 * 1024) {
            alert("Wok, ukuran gambar kegedean! Maksimal cuma boleh 10 MB.");
            e.target.value = ""; // Reset input file
            return;
          }

          setFormData({ ...formData, image: file });
          setImagePreview(URL.createObjectURL(file));
        }
      };

  const openEditModal = (costume) => {
    setEditingId(costume.id);
    setFormData({
      name: costume.costume_name ?? costume.name ?? '',
      category: costume.category ?? '',
      price_1_day: String(costume.price_1_day ?? '').split('.')[0], 
      price_2_day: String(costume.price_2_day ?? '').split('.')[0], 
      price_3_day: String(costume.price_3_day ?? '').split('.')[0], 
      stock_total: costume.total_stok ?? costume.stock_total ?? '',
      image: null 
    });
    setImagePreview(costume.image ?? null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', category: '', price_1_day: '', price_2_day: '', price_3_day: '', stock_total: '', image: null });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('category', formData.category);
    dataToSend.append('stock_total', formData.stock_total); 
    dataToSend.append('price_1_day', formData.price_1_day); 
    dataToSend.append('price_2_day', formData.price_2_day); 
    dataToSend.append('price_3_day', formData.price_3_day); 
    
    if (formData.image) {
      dataToSend.append('image', formData.image);
    }

    if (editingId) {
      dataToSend.append('_method', 'PUT');
    }

    const targetUrl = editingId 
      ? `${import.meta.env.VITE_API_BASE_URL}/costumes/${editingId}`
      : `${import.meta.env.VITE_API_BASE_URL}/costumes`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: dataToSend
      });

      const res = await response.json();
      
      if (response.ok && res.success) {
        alert(res.message);
        setIsModalOpen(false);
        setEditingId(null);
        setImagePreview(null);
        setTimeout(() => { onRefresh(); }, 300);
      } else {
        alert('Gagal memproses data: ' + JSON.stringify(res.errors || res.message));
      }
    } catch (error) {
      console.error(error);
      alert('Koneksi bermasalah dengan backend API.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus baju adat ini dari database realtime?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/costumes/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const res = await response.json();
      if (res.success) {
        alert(res.message);
        onRefresh();
      }
    } catch (error) {
      alert('Gagal menghapus data');
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="w-full flex-1 flex flex-col justify-between min-w-0 bg-[#D1D1D1]">
      <div className="flex-1 w-full pb-16 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 w-full">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#394931] tracking-tight">Manajemen Stok Kostum</h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1">Kelola data inventaris</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button onClick={onRefresh} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-50 font-medium transition-colors">
              <RefreshCw size={14} className={loadingCostumes ? "animate-spin" : ""} />
              <span>Muat Ulang</span>
            </button>
            <button onClick={openAddModal} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-[#334239] text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl hover:bg-[#25312a] font-medium shadow transition-all">
              <Plus size={14} /> <span>Tambah Kostum</span>
            </button>
          </div>
        </div>

        <div className="w-full max-w-md mb-6">
          <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:border-[#334239] transition-all duration-300 px-3">
            <Search size={18} className="text-gray-400 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Cari nama baju adat atau kategori..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 w-full">
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-gray-100 text-[#2E4A3F] rounded-xl"><Package className="h-5 w-5 sm:h-6 sm:w-6" /></div>
            <div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 block">Total Varian</span>
              <span className="text-sm sm:text-base md:text-lg font-bold text-gray-800">{totalVarian} Jenis</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 flex-1 flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-green-50 text-green-700 rounded-xl"><Package className="h-5 w-5 sm:h-6 sm:w-6" /></div>
            <div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 block">Total Aset</span>
              <span className="text-sm sm:text-base md:text-lg font-bold text-gray-800">{totalAsetBaju} Pcs</span>
            </div>
          </div>
        </div>

        <div className="block lg:hidden w-full space-y-3 mb-6">
          {loadingCostumes ? (
            <div className="text-center text-sm text-gray-400 py-8">Memuat data realtime...</div>
          ) : filteredCostumes.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">Data tidak ditemukan atau basis data kosong.</div>
          ) : (
            filteredCostumes.map((costume) => {
              const namaKostum = costume.costume_name ?? costume.name ?? 'Tanpa Nama';
              const stokTotal = costume.total_stok ?? costume.stock_total ?? 0;
              const readyStok = costume.baju_tersedia ?? stokTotal;

              return (
                <div key={costume.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                      {costume.image ? (
                        <img src={costume.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-950 text-sm sm:text-base truncate">{namaKostum}</h4>
                      <p className="text-xs text-gray-500 truncate">{costume.category}</p>
                      <p className="text-xs font-semibold text-[#334239] mt-1">
                        1 Hari: Rp {Number(costume.price_1_day).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 bg-gray-50 p-2 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Stok</span>
                      <span className="font-bold text-gray-800">{stokTotal}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Booked</span>
                      <span className="font-bold text-cyan-600">{costume.booking || '0'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Status</span>
                      <span className="font-bold text-green-700 block text-[11px]">{readyStok} Ready</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button onClick={() => openEditModal(costume)} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-xl font-medium transition-colors">
                      <Pencil size={12} /> <span>Edit</span>
                    </button>
                    <button onClick={() => handleDelete(costume.id)} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-xl font-medium transition-colors">
                      <Trash2 size={12} /> <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden lg:block bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-[#334239] text-white font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-4 text-center w-24">Foto</th>
                  <th className="px-6 py-4">Nama Kostum</th>
                  <th className="px-6 py-4">Kategori / Asal</th>
                  <th className="px-6 py-4 min-w-[180px]">Matrix Harga Sewa</th>
                  <th className="px-4 py-4 text-center w-28">Total Stok</th>
                  <th className="px-4 py-4 text-center w-28">Booking</th>
                  <th className="px-4 py-4 text-center w-28">Di Rental</th>
                  <th className="px-4 py-4 text-center w-28">Tersedia</th>
                  <th className="px-4 py-4 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 bg-white font-medium">
                {loadingCostumes ? (
                  <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-400">Memuat data realtime...</td></tr>
                ) : filteredCostumes.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-400">Data tidak ditemukan atau basis data kosong.</td></tr>
                ) : (
                  filteredCostumes.map((costume, index) => {
                    const namaKostum = costume.costume_name ?? costume.name ?? 'Tanpa Nama';
                    const stokTotal = costume.total_stok ?? costume.stock_total ?? 0;
                    const readyStok = costume.baju_tersedia ?? stokTotal;

                    return (
                      <tr key={costume.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-center align-middle">
                          <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center mx-auto shadow-xs">
                            {costume.image ? (
                              <img src={costume.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={18} className="text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{namaKostum}</td>
                        <td className="px-6 py-4 text-gray-700 capitalize">{costume.category}</td>
                        <td className="px-6 py-4 text-gray-900 text-xs whitespace-nowrap">
                          <div className="mb-0.5">1 Hari: <span className="font-bold text-gray-950">Rp {Number(costume.price_1_day).toLocaleString('id-ID')}</span></div>
                          <div className="mb-0.5">2 Hari: <span className="font-bold text-gray-950">Rp {Number(costume.price_2_day).toLocaleString('id-ID')}</span></div>
                          <div>3 Hari: <span className="font-bold text-gray-950">Rp {Number(costume.price_3_day).toLocaleString('id-ID')}</span></div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-gray-900">{stokTotal}</td>
                        <td className="px-4 py-4 text-center font-bold text-cyan-600">{costume.booking ?? '0'}</td>
                        <td className="px-4 py-4 text-center font-bold text-orange-600">{costume.sedang_dirental ?? '0'}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">{readyStok} Ready</span>
                        </td>
                        <td className="px-4 py-4 text-center align-middle relative">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => setActiveDropdown(activeDropdown === index ? null : index)} 
                              className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            >
                              <MoreVertical size={16}/>
                            </button>
                            
                            {activeDropdown === index && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}></div>
                                <div className="absolute right-10 top-8 w-32 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-40 text-left animate-fadeIn">
                                  <button 
                                    onClick={() => { openEditModal(costume); setActiveDropdown(null); }} 
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <Pencil size={13}/> <span>Edit Baju</span>
                                  </button>
                                  <button 
                                    onClick={() => { handleDelete(costume.id); setActiveDropdown(null); }} 
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={13}/> <span>Hapus</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {editingId ? 'Edit Data Baju Adat' : 'Tambah Kostum Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kostum</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs sm:text-sm outline-none focus:border-[#334239]" placeholder="Contoh: Baju Adat Minang" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori / Asal Daerah</label>
                <input type="text" name="category" required value={formData.category} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs sm:text-sm outline-none focus:border-[#334239]" placeholder="Contoh: Sumatera Barat" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Total Stok (Pcs)</label>
                <input type="number" name="stock_total" required value={formData.stock_total} onChange={handleChange} className="w-full border p-2 rounded-xl text-xs sm:text-sm outline-none focus:border-[#334239]" placeholder="Contoh: 10" />
              </div>
              
              <div className="space-y-2 border-t pt-2">
                <label className="block text-xs font-bold text-[#334239] flex items-center gap-1"><Clock size={12}/> Pengaturan Matrix Harga Sewa</label>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">Harga Paket 1 Hari</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-gray-500 font-medium">Rp</span>
                      <input type="text" name="price_1_day" required value={formatRupiah(formData.price_1_day)} onChange={handleChange} className="w-full border pl-9 p-2 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#334239]" placeholder="100.000" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">Harga Paket 2 Hari</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-gray-500 font-medium">Rp</span>
                      <input type="text" name="price_2_day" required value={formatRupiah(formData.price_2_day)} onChange={handleChange} className="w-full border pl-9 p-2 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#334239]" placeholder="180.000" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 block mb-0.5">Harga Paket 3 Hari (atau lebih)</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-gray-500 font-medium">Rp</span>
                      <input type="text" name="price_3_day" required value={formatRupiah(formData.price_3_day)} onChange={handleChange} className="w-full border pl-9 p-2 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#334239]" placeholder="250.000" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Foto Baju {editingId && <span className="text-gray-400 font-normal">(Kosongkan jika tidak diganti)</span>}
                </label>
                <label htmlFor="file-upload-realtime" className="mt-1 flex flex-col justify-center items-center px-4 py-4 border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group relative min-h-[140px]">
                  {imagePreview ? (
                    <div className="w-full flex flex-col items-center space-y-2 animate-fadeIn">
                      <div className="w-24 h-24 rounded-xl border border-gray-300 overflow-hidden shadow-sm bg-white relative">
                        <img src={imagePreview} alt="Live Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-semibold text-[#334239] bg-white border px-3 py-1 rounded-full shadow-xs hover:bg-gray-50">Ganti Foto</span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 text-[#334239] group-hover:scale-110 transition-transform" />
                      <div className="flex text-xs sm:text-sm text-gray-600 justify-center font-semibold text-[#334239] hover:text-[#25312a]">
                        <span>Pilih file foto</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                    </div>
                  )}
                  <input id="file-upload-realtime" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <button type="submit" className="w-full bg-[#334239] text-white p-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#25312a] transition-all shadow-md active:scale-[0.99] mt-2">
                {editingId ? 'Simpan Perubahan Data' : 'Simpan ke Database Realtime'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}