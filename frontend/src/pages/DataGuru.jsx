import React, { useState, useEffect } from 'react';

export default function DataGuru({ token }) {
  const [guru, setGuru] = useState([]);
  const [formData, setFormData] = useState({
    nip: '', nama: '', jenis_kelamin: 'L', status_guru: 'Tetap',
    jabatan: 'Guru', mata_pelajaran: '', pendidikan: '',
    gaji_pokok: 0, tarif_honor: 0, no_rekening: '', status_aktif: true, keterangan: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGuru();
  }, [token]);

  const fetchGuru = async () => {
    try {
      const res = await fetch('/api/guru', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setGuru(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/guru/${editId}` : '/api/guru';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    
    setShowForm(false);
    setIsEditing(false);
    setFormData({ nip: '', nama: '', jenis_kelamin: 'L', status_guru: 'Tetap', jabatan: 'Guru', mata_pelajaran: '', pendidikan: '', gaji_pokok: 0, tarif_honor: 0, no_rekening: '', status_aktif: true, keterangan: '' });
    fetchGuru();
  };

  const handleEdit = (g) => {
    setFormData(g);
    setEditId(g.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus guru ini?')) {
      await fetch(`/api/guru/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchGuru();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Master Data Guru</h2>
        <button onClick={() => { setShowForm(!showForm); setIsEditing(false); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {showForm ? 'Tutup Form' : '+ Tambah Guru'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow grid grid-cols-2 md:grid-cols-3 gap-4">
          <input type="text" name="nip" placeholder="NIP/NUPTK" value={formData.nip} onChange={handleChange} className="border p-2 rounded" />
          <input type="text" name="nama" placeholder="Nama Guru" value={formData.nama} onChange={handleChange} required className="border p-2 rounded" />
          <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className="border p-2 rounded">
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <input type="text" name="jabatan" placeholder="Jabatan" value={formData.jabatan} onChange={handleChange} className="border p-2 rounded" />
          <input type="text" name="mata_pelajaran" placeholder="Mata Pelajaran" value={formData.mata_pelajaran} onChange={handleChange} className="border p-2 rounded" />
          <input type="number" name="gaji_pokok" placeholder="Gaji Pokok" value={formData.gaji_pokok} onChange={handleChange} className="border p-2 rounded" />
          <input type="number" name="tarif_honor" placeholder="Tarif Honor/Jam" value={formData.tarif_honor} onChange={handleChange} className="border p-2 rounded" />
          <input type="text" name="no_rekening" placeholder="No Rekening" value={formData.no_rekening} onChange={handleChange} className="border p-2 rounded" />
          
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="status_aktif" checked={formData.status_aktif} onChange={handleChange} />
            <span>Status Aktif</span>
          </label>
          <div className="col-span-full">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">{isEditing ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Jabatan</th>
              <th className="p-3">Mapel</th>
              <th className="p-3">Gaji Pokok</th>
              <th className="p-3">Honor/Jam</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {guru.map(g => (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-semibold">{g.nama} <br/><span className="text-xs text-gray-500">{g.nip}</span></td>
                <td className="p-3">{g.jabatan}</td>
                <td className="p-3">{g.mata_pelajaran}</td>
                <td className="p-3">Rp {g.gaji_pokok?.toLocaleString('id-ID')}</td>
                <td className="p-3">Rp {g.tarif_honor?.toLocaleString('id-ID')}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${g.status_aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {g.status_aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(g)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

