import React, { useState, useEffect } from 'react';

export default function Penggajian({ token }) {
  const [dataGaji, setDataGaji] = useState([]);
  const [periode, setPeriode] = useState([]);
  const [guru, setGuru] = useState([]);
  const [filterPeriodeId, setFilterPeriodeId] = useState('');
  
  const initialState = {
    guru_id: '', periode_id: '', jumlah_jam: '', jumlah_kelebihan_jam: '', honor_per_jam: '',
    hadir: '', tunj_kehadiran: '', t_kamad: '', t_bendahara: '', t_kur: '', t_kes: '', t_sap: '', t_pramuka: '',
    t_uks: '', t_10k: '', t_kesenian: '', t_keagamaan: '', t_perpus: '', t_operator: '', t_dramband: '', t_staff_tu: '', t_wali_kls: '',
    jasa_ganti_guru: '', keterangan: '', nama: '', bulan: '',
    p_koperasi: '', p_pinjaman: '', p_kas_sekolah: '', p_kehadiran: '', p_lainnya: '', ket_potongan: ''
  };
  const [formData, setFormData] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedGaji, setSelectedGaji] = useState(null);

  useEffect(() => {
    fetchPeriode();
    fetchGuru();
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [filterPeriodeId, token]);

  const fetchPeriode = async () => {
    const res = await fetch('/api/periode', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setPeriode(data);
    if(data.length > 0 && !filterPeriodeId) setFilterPeriodeId(data[0].id);
  };

  const fetchGuru = async () => {
    const res = await fetch('/api/guru', { headers: { 'Authorization': `Bearer ${token}` } });
    setGuru(await res.json());
  };

  const fetchData = async () => {
    if (!token) return;
    let url = '/api/gaji';
    if (filterPeriodeId) url += `?periode_id=${filterPeriodeId}`;
    
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    setDataGaji(await res.json());
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleGuruChange = (e) => {
    const selectedGuru = guru.find(g => g.id === parseInt(e.target.value));
    if(selectedGuru) {
        setFormData({
            ...formData, 
            guru_id: selectedGuru.id, 
            nama: selectedGuru.nama,
            honor_per_jam: selectedGuru.tarif_honor
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedPeriode = periode.find(p => p.id === parseInt(formData.periode_id));
    const finalData = {
        ...formData,
        bulan: selectedPeriode?.bulan || ''
    };
    
    const url = isEditing ? `/api/gaji/${editId}` : '/api/gaji';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(finalData)
    });
    setFormData({ ...initialState, periode_id: formData.periode_id });
    setIsEditing(false);
    setEditId(null);
    fetchData();
  };

  const handleEdit = (gaji) => {
    setFormData(gaji);
    setIsEditing(true);
    setEditId(gaji.id);
  };

  const handleDelete = async (id) => {
    if(confirm('Yakin ingin menghapus data ini?')) {
      await fetch(`/api/gaji/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    }
  };

  const currentPeriodeStatus = periode.find(p => p.id === parseInt(filterPeriodeId))?.status;
  const isLocked = currentPeriodeStatus === 'DIKUNCI';

  // Real-time perhitungan (Preview)
  const honorPerJam = parseInt(formData.honor_per_jam) || 0;
  const kelebihanJam = parseInt(formData.jumlah_kelebihan_jam) || 0;
  const gajiPokokPreview = honorPerJam * kelebihanJam;
  const tunjKehadiranPreview = parseInt(formData.tunj_kehadiran) || 0;
  const jasaGantiPreview = parseInt(formData.jasa_ganti_guru) || 0;
  const tunjTugas = ['t_kamad', 't_bendahara', 't_kur', 't_kes', 't_sap', 't_pramuka', 't_uks', 't_10k', 't_kesenian', 't_keagamaan', 't_perpus', 't_operator', 't_dramband', 't_staff_tu', 't_wali_kls'];
  const totalTugasPreview = tunjTugas.reduce((sum, f) => sum + (parseInt(formData[f]) || 0), 0);
  const totalPendapatanPreview = gajiPokokPreview + tunjKehadiranPreview + jasaGantiPreview + totalTugasPreview;

  const potFields = ['p_koperasi', 'p_pinjaman', 'p_kas_sekolah', 'p_kehadiran', 'p_lainnya'];
  const totalPotonganPreview = potFields.reduce((sum, f) => sum + (parseInt(formData[f]) || 0), 0);
  const totalDiterimaPreview = totalPendapatanPreview - totalPotonganPreview;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded shadow flex justify-between items-center">
         <div>
            <label className="text-xs text-gray-500 font-bold block mb-1">Filter Periode</label>
            <select value={filterPeriodeId} onChange={e => {setFilterPeriodeId(e.target.value); setFormData({...formData, periode_id: e.target.value}); setIsEditing(false);}} className="border p-2 rounded">
                <option value="">Pilih Periode</option>
                {periode.map(p => <option key={p.id} value={p.id}>{p.bulan} - {p.tahun_ajaran}</option>)}
            </select>
         </div>
         {isLocked && <div className="bg-red-100 text-red-800 px-4 py-2 rounded font-bold">PERIODE DIKUNCI</div>}
      </div>

      {/* MODAL DETAIL */}
      {showDetail && selectedGaji && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowDetail(false)} className="absolute top-2 right-4 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold mb-4 text-center border-b pb-2">Detail Gaji: {selectedGaji.nama}</h2>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between font-bold text-green-700 bg-green-50 p-2 rounded"><span>Total Pendapatan:</span> <span>{formatRupiah(selectedGaji.total_pendapatan)}</span></div>
              <div className="flex justify-between pl-4"><span>Gaji Pokok:</span> <span>{formatRupiah(selectedGaji.jumlah_gaji_pokok)}</span></div>
              <div className="flex justify-between pl-4"><span>Tunj. Kehadiran:</span> <span>{formatRupiah(selectedGaji.tunj_kehadiran)}</span></div>
              <div className="flex justify-between pl-4"><span>Jasa Ganti Guru:</span> <span>{formatRupiah(selectedGaji.jasa_ganti_guru)}</span></div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between font-bold text-red-700 bg-red-50 p-2 rounded"><span>Total Potongan:</span> <span>{formatRupiah(selectedGaji.total_potongan)}</span></div>
              <div className="flex justify-between pl-4"><span>Potongan Koperasi:</span> <span>{formatRupiah(selectedGaji.p_koperasi)}</span></div>
              <div className="flex justify-between pl-4"><span>Potongan Pinjaman:</span> <span>{formatRupiah(selectedGaji.p_pinjaman)}</span></div>
              <div className="flex justify-between pl-4"><span>Potongan Kas Sekolah:</span> <span>{formatRupiah(selectedGaji.p_kas_sekolah)}</span></div>
              <div className="flex justify-between pl-4"><span>Potongan Kehadiran:</span> <span>{formatRupiah(selectedGaji.p_kehadiran)}</span></div>
              <div className="flex justify-between pl-4"><span>Potongan Lainnya:</span> <span>{formatRupiah(selectedGaji.p_lainnya)}</span></div>
              <div className="text-gray-500 pl-4 italic text-xs">Ket: {selectedGaji.ket_potongan}</div>
            </div>

            <div className="flex justify-between font-bold text-lg bg-yellow-100 p-3 rounded">
              <span>JUMLAH DITERIMA:</span>
              <span>{formatRupiah(selectedGaji.jumlah_terima)}</span>
            </div>
          </div>
        </div>
      )}

      {/* FORM */}
      {!isLocked && filterPeriodeId && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="font-bold text-lg text-gray-700">{isEditing ? 'Edit Data Gaji' : 'Input Gaji Baru'}</h2>
              {isEditing && <button onClick={() => {setIsEditing(false); setFormData({...initialState, periode_id: formData.periode_id});}} className="text-red-500 text-xs hover:underline">Batal Edit</button>}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-3 rounded">
                  <select name="guru_id" value={formData.guru_id} onChange={handleGuruChange} required className="border p-2 rounded">
                      <option value="">Pilih Guru...</option>
                      {guru.filter(g => g.status_aktif || g.id === formData.guru_id).map(g => (
                          <option key={g.id} value={g.id}>{g.nama}</option>
                      ))}
                  </select>
                  <input type="number" name="jumlah_jam" placeholder="Total Jam" value={formData.jumlah_jam} onChange={handleChange} className="border p-2 rounded" />
                  <input type="number" name="jumlah_kelebihan_jam" placeholder="Lembur Jam" value={formData.jumlah_kelebihan_jam} onChange={handleChange} required className="border p-2 rounded" />
                  <input type="number" name="honor_per_jam" placeholder="Honor/Jam" value={formData.honor_per_jam} onChange={handleChange} required className="border p-2 rounded bg-gray-100" readOnly />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-green-50 p-3 rounded">
                  <input type="number" name="hadir" placeholder="Hari Hadir" value={formData.hadir} onChange={handleChange} className="border p-2 rounded" />
                  <input type="number" name="tunj_kehadiran" placeholder="Total Rp Kehadiran" value={formData.tunj_kehadiran} onChange={handleChange} className="border p-2 rounded" />
              </div>

              <h3 className="font-semibold text-gray-600 mt-4 mb-2">Tunjangan Tugas</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <input type="number" name="t_kamad" placeholder="Kamad" value={formData.t_kamad} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_bendahara" placeholder="Bendahara" value={formData.t_bendahara} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_kur" placeholder="K.Kur" value={formData.t_kur} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_kes" placeholder="K.Kes" value={formData.t_kes} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_sap" placeholder="K.Sap" value={formData.t_sap} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_pramuka" placeholder="Pramuka" value={formData.t_pramuka} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_uks" placeholder="UKS" value={formData.t_uks} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_10k" placeholder="10 K" value={formData.t_10k} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_kesenian" placeholder="Kesenian" value={formData.t_kesenian} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_keagamaan" placeholder="Keagamaan" value={formData.t_keagamaan} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_perpus" placeholder="Perpus" value={formData.t_perpus} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_operator" placeholder="Operator" value={formData.t_operator} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_dramband" placeholder="Dramband" value={formData.t_dramband} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_staff_tu" placeholder="Staff TU" value={formData.t_staff_tu} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="t_wali_kls" placeholder="Wali Kls" value={formData.t_wali_kls} onChange={handleChange} className="border p-1.5 rounded" />
              </div>
              <div className="grid grid-cols-2 bg-yellow-50 p-3 gap-3 rounded">
                <input type="number" name="jasa_ganti_guru" placeholder="Jasa Ganti Guru" value={formData.jasa_ganti_guru} onChange={handleChange} className="border p-2 rounded" />
                <input type="text" name="keterangan" placeholder="Ket Ganti Guru (Opsional)" value={formData.keterangan} onChange={handleChange} className="border p-2 rounded" />
              </div>

              <h3 className="font-semibold text-gray-600 mt-4 mb-2">Potongan Gaji</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-red-50 p-3 rounded">
                  <input type="number" name="p_koperasi" placeholder="Koperasi" value={formData.p_koperasi} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="p_pinjaman" placeholder="Pinjaman" value={formData.p_pinjaman} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="p_kas_sekolah" placeholder="Kas Sekolah" value={formData.p_kas_sekolah} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="p_kehadiran" placeholder="Pot. Kehadiran" value={formData.p_kehadiran} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="number" name="p_lainnya" placeholder="Lainnya" value={formData.p_lainnya} onChange={handleChange} className="border p-1.5 rounded" />
                  <input type="text" name="ket_potongan" placeholder="Ket Potongan" value={formData.ket_potongan} onChange={handleChange} className="border p-1.5 rounded" />
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="bg-gray-800 text-white p-4 rounded grid grid-cols-3 text-center font-bold">
                <div>Total Pendapatan <br/><span className="text-green-400 text-lg">{formatRupiah(totalPendapatanPreview)}</span></div>
                <div>Total Potongan <br/><span className="text-red-400 text-lg">{formatRupiah(totalPotonganPreview)}</span></div>
                <div className="border-l border-gray-600">Jumlah Diterima <br/><span className="text-yellow-400 text-xl">{formatRupiah(totalDiterimaPreview)}</span></div>
              </div>

              <button type="submit" className="bg-green-600 text-white p-3 rounded hover:bg-green-700 font-bold w-full text-lg">
                {isEditing ? 'Simpan Perubahan' : 'Simpan Gaji'}
              </button>
            </form>
          </div>
      )}

      {/* TABEL */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-300">
        <table className="min-w-max w-full text-left border-collapse whitespace-nowrap text-xs">
           <thead className="bg-green-700 text-white uppercase text-center align-middle">
               <tr>
                <th className="border px-2 py-2">Nama</th>
                <th className="border px-2 py-2 bg-yellow-600">Pendapatan</th>
                <th className="border px-2 py-2 bg-red-600">Potongan</th>
                <th className="border px-2 py-2 text-sm bg-green-800">Jumlah Terima</th>
                <th className="border px-2 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataGaji.map((g) => {
                return (
                <tr key={g.id} className="hover:bg-gray-100">
                  <td className="border px-2 py-3 font-semibold">{g.nama}</td>
                  <td className="border px-2 py-3 text-right font-bold text-green-700 bg-green-50">{formatRupiah(g.total_pendapatan)}</td>
                  <td className="border px-2 py-3 text-right font-bold text-red-700 bg-red-50">{formatRupiah(g.total_potongan)}</td>
                  <td className="border px-2 py-3 text-right font-bold text-yellow-700 text-sm">{formatRupiah(g.jumlah_terima)}</td>
                  <td className="border px-2 py-3 text-center flex gap-1 justify-center">
                    <button onClick={() => {setSelectedGaji(g); setShowDetail(true);}} className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700">Detail</button>
                    {!isLocked && (
                      <>
                        <button onClick={() => handleEdit(g)} className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-700">Edit</button>
                        <button onClick={() => handleDelete(g.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700">Hapus</button>
                      </>
                    )}
                  </td>
                </tr>
              )})}
              {dataGaji.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 font-bold text-gray-500">Belum ada data</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  );
}

