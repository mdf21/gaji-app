import { useState, useEffect } from 'react';

function App() {
  // State untuk Auth
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [loginInput, setLoginInput] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // State Data Gaji
  const [dataGaji, setDataGaji] = useState([]);
  const [filterBulan, setFilterBulan] = useState(''); // Format: YYYY-MM
  
  // State Form
  const currentMonth = new Date().toISOString().slice(0, 7);
  const initialState = {
    nama: '', bulan: currentMonth, jumlah_jam: '', jumlah_kelebihan_jam: '', honor_per_jam: '',
    hadir: '', tunj_kehadiran: '', t_kamad: '', t_bendahara: '', t_kur: '', t_kes: '', t_sap: '', t_pramuka: '',
    t_uks: '', t_10k: '', t_kesenian: '', t_keagamaan: '', t_perpus: '', t_operator: '', t_dramband: '', t_staff_tu: '', t_wali_kls: '',
    jasa_ganti_guru: '', keterangan: ''
  };
  const [formData, setFormData] = useState(initialState);

  // --- Fungsi Autentikasi ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginInput)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUsername(data.username);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setLoginError('');
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError("Koneksi gagal");
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setDataGaji([]);
  };

  // --- Mengambil Data (Dengan Filter Bulan) ---
  const fetchData = async () => {
    if (!token) return;
    let url = '/api/gaji';
    if (filterBulan) url += `?bulan=${filterBulan}`;
    
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if(res.status === 403 || res.status === 401) return handleLogout();
    const data = await res.json();
    setDataGaji(data);
  };

  useEffect(() => {
    fetchData();
  }, [token, filterBulan]);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- CRUD & Ekspor ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/gaji', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    setFormData({ ...initialState, bulan: formData.bulan }); // Pertahankan bulan yg dipilih
    fetchData();
  };

  const handleDelete = async (id) => {
    if(confirm('Yakin ingin menghapus data ini?')) {
      await fetch(`/api/gaji/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    }
  };

  const handleExport = (type) => {
    let url = `/api/export/${type}`;
    if (filterBulan) url += `?bulan=${filterBulan}`;
    
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `Gaji_${filterBulan||'Semua'}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  // --- UI RENDER ---
  // Jika belum login, tampilkan layar login
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-green-700">Login Sistem Gaji</h2>
          {loginError && <p className="text-red-500 mb-4 text-center text-sm">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Username (default: admin)" value={loginInput.username} onChange={(e) => setLoginInput({...loginInput, username: e.target.value})} className="w-full border p-2 rounded" required />
            <input type="password" placeholder="Password (default: admin123)" value={loginInput.password} onChange={(e) => setLoginInput({...loginInput, password: e.target.value})} className="w-full border p-2 rounded" required />
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Login</button>
          </form>
        </div>
      </div>
    );
  }

  // Jika sudah login, tampilkan aplikasi utama
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-sm">
      <div className="w-full mx-auto space-y-6">
        
        {/* HEADER & FILTER */}
        <div className="flex justify-between items-center bg-white p-4 rounded shadow border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Sistem Penggajian Guru</h1>
            <p className="text-gray-500">Selamat datang, {username}</p>
          </div>
          <div className="flex space-x-4 items-center">
             <div className="flex flex-col">
                <label className="text-xs text-gray-500 font-bold">Filter Bulan</label>
                <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="border p-2 rounded" />
             </div>
             <button onClick={() => handleExport('excel')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 h-10 mt-4">📥 Export Excel</button>
             <button onClick={() => handleExport('pdf')} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 h-10 mt-4">📥 Export PDF</button>
             <button onClick={handleLogout} className="bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 h-10 mt-4">Logout</button>
          </div>
        </div>

        {/* --- FORM INPUT --- */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="font-bold text-lg mb-4 text-gray-700 border-b pb-2">Tambah Data Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
             {/* Identitas (Ditambah input Bulan untuk entri spesifik) */}
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-blue-50 p-3 rounded">
                <input type="month" name="bulan" value={formData.bulan} onChange={handleChange} required className="border p-2 rounded col-span-2 md:col-span-1" />
                <input type="text" name="nama" placeholder="Nama Guru" value={formData.nama} onChange={handleChange} required className="border p-2 rounded col-span-2 md:col-span-1" />
                <input type="number" name="jumlah_jam" placeholder="Total Jam" value={formData.jumlah_jam} onChange={handleChange} className="border p-2 rounded" />
                <input type="number" name="jumlah_kelebihan_jam" placeholder="Lembur Jam" value={formData.jumlah_kelebihan_jam} onChange={handleChange} required className="border p-2 rounded" />
                <input type="number" name="honor_per_jam" placeholder="Honor/Jam" value={formData.honor_per_jam} onChange={handleChange} required className="border p-2 rounded"/>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-green-50 p-3 rounded">
                <input type="number" name="hadir" placeholder="Hari Hadir" value={formData.hadir} onChange={handleChange} className="border p-2 rounded" />
                <input type="number" name="tunj_kehadiran" placeholder="Total Rp Kehadiran" value={formData.tunj_kehadiran} onChange={handleChange} className="border p-2 rounded" />
            </div>

            <h3 className="font-semibold text-gray-600 mt-4 mb-2">Tunjangan Tugas (Kosongkan jika tidak ada)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input type="number" name="t_kamad" placeholder="Kamad (Rp)" value={formData.t_kamad} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_bendahara" placeholder="Bendahara (Rp)" value={formData.t_bendahara} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_kur" placeholder="K.Kur (Rp)" value={formData.t_kur} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_kes" placeholder="K.Kes (Rp)" value={formData.t_kes} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_sap" placeholder="K.Sap (Rp)" value={formData.t_sap} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_pramuka" placeholder="Pramuka (Rp)" value={formData.t_pramuka} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_uks" placeholder="UKS (Rp)" value={formData.t_uks} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_10k" placeholder="10 K (Rp)" value={formData.t_10k} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_kesenian" placeholder="Kesenian (Rp)" value={formData.t_kesenian} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_keagamaan" placeholder="Keagamaan (Rp)" value={formData.t_keagamaan} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_perpus" placeholder="Perpus (Rp)" value={formData.t_perpus} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_operator" placeholder="Operator (Rp)" value={formData.t_operator} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_dramband" placeholder="Dramband (Rp)" value={formData.t_dramband} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_staff_tu" placeholder="Staff TU (Rp)" value={formData.t_staff_tu} onChange={handleChange} className="border p-1.5 rounded" />
                <input type="number" name="t_wali_kls" placeholder="Wali Kls (Rp)" value={formData.t_wali_kls} onChange={handleChange} className="border p-1.5 rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-yellow-50 p-3 rounded items-center">
                 <input type="number" name="jasa_ganti_guru" placeholder="Jasa Ganti Guru (Rp)" value={formData.jasa_ganti_guru} onChange={handleChange} className="border p-2 rounded" />
                 <input type="text" name="keterangan" placeholder="Ket (Opsional)" value={formData.keterangan} onChange={handleChange} className="border p-2 rounded" />
                 <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700 font-bold w-full">Simpan & Hitung Otomatis</button>
            </div>
          </form>
        </div>

        {/* --- TABEL DATA LEBAR --- */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-300">
          <table className="min-w-max w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-green-700 text-white text-xs uppercase text-center align-middle">
               <tr>
                <th rowSpan="2" className="border px-2 py-1">Bulan</th>
                <th rowSpan="2" className="border px-3 py-1">Nama</th>
                <th rowSpan="2" className="border px-3 py-1 bg-yellow-600">Gaji Pokok</th>
                <th colSpan="15" className="border px-2 py-1 bg-green-800">Tunjangan Tugas</th>
                <th rowSpan="2" className="border px-3 py-1">Jasa Ganti</th>
                <th rowSpan="2" className="border px-4 py-1 text-lg bg-red-600">Jumlah Terima</th>
                <th rowSpan="2" className="border px-2 py-1">Aksi</th>
              </tr>
              <tr className="bg-green-600">
                <th className="border px-2 py-1 font-normal">Kamad</th>
                <th className="border px-2 py-1 font-normal">Bend</th>
                <th className="border px-2 py-1 font-normal">Kur</th>
                <th className="border px-2 py-1 font-normal">Kes</th>
                <th className="border px-2 py-1 font-normal">Sap</th>
                <th className="border px-2 py-1 font-normal">Pramuka</th>
                <th className="border px-2 py-1 font-normal">UKS</th>
                <th className="border px-2 py-1 font-normal">10 K</th>
                <th className="border px-2 py-1 font-normal">Kesenian</th>
                <th className="border px-2 py-1 font-normal">Agm.</th>
                <th className="border px-2 py-1 font-normal">Perpus</th>
                <th className="border px-2 py-1 font-normal">Opr</th>
                <th className="border px-2 py-1 font-normal">D-Bnd</th>
                <th className="border px-2 py-1 font-normal">TU</th>
                <th className="border px-2 py-1 font-normal">Wali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataGaji.map((g) => (
                <tr key={g.id} className="hover:bg-gray-100 text-xs">
                  <td className="border px-2 py-2 text-center font-bold text-gray-600">{g.bulan}</td>
                  <td className="border px-2 py-2 font-semibold">{g.nama}</td>
                  <td className="border px-2 py-2 text-right font-bold bg-yellow-50">{formatRupiah(g.jumlah_gaji_pokok)}</td>
                  
                  <td className="border px-2 py-2 text-right">{g.t_kamad ? formatRupiah(g.t_kamad) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_bendahara ? formatRupiah(g.t_bendahara) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_kur ? formatRupiah(g.t_kur) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_kes ? formatRupiah(g.t_kes) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_sap ? formatRupiah(g.t_sap) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_pramuka ? formatRupiah(g.t_pramuka) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_uks ? formatRupiah(g.t_uks) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_10k ? formatRupiah(g.t_10k) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_kesenian ? formatRupiah(g.t_kesenian) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_keagamaan ? formatRupiah(g.t_keagamaan) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_perpus ? formatRupiah(g.t_perpus) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_operator ? formatRupiah(g.t_operator) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_dramband ? formatRupiah(g.t_dramband) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_staff_tu ? formatRupiah(g.t_staff_tu) : '-'}</td>
                  <td className="border px-2 py-2 text-right">{g.t_wali_kls ? formatRupiah(g.t_wali_kls) : '-'}</td>
                  
                  <td className="border px-2 py-2 text-right">{g.jasa_ganti_guru ? formatRupiah(g.jasa_ganti_guru) : '-'}</td>
                  <td className="border px-3 py-2 text-right font-bold text-red-600 text-sm bg-red-50">{formatRupiah(g.jumlah_terima)}</td>
                  
                  <td className="border px-2 py-2 text-center">
                    <button onClick={() => handleDelete(g.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700">Hapus</button>
                  </td>
                </tr>
              ))}
              {dataGaji.length === 0 && (
                <tr>
                  <td colSpan="20" className="text-center py-4 font-bold text-gray-500">Tidak ada data untuk bulan yang dipilih</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default App;