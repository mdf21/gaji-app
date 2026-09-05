import React, { useState, useEffect } from 'react';

export default function Periode({ token }) {
  const [periode, setPeriode] = useState([]);
  const [formData, setFormData] = useState({ bulan: '', tahun_ajaran: '', status: 'DRAFT' });

  useEffect(() => {
    fetchPeriode();
  }, [token]);

  const [error, setError] = useState('');

  const fetchPeriode = async () => {
    try {
      setError('');
      const res = await fetch('/api/periode', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Gagal memuat data periode');
      setPeriode(await res.json());
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await fetch('/api/periode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal membuat periode');
      }
      setFormData({ bulan: '', tahun_ajaran: '', status: 'DRAFT' });
      fetchPeriode();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setError('');
      const res = await fetch(`/api/periode/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal mengubah status periode');
      }
      fetchPeriode();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-100 text-red-800 p-3 rounded border border-red-300">{error}</div>}
      <h2 className="text-xl font-bold text-gray-800">Periode Penggajian</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow flex gap-4 items-end">
        <div>
          <label className="block text-xs mb-1">Bulan (YYYY-MM)</label>
          <input type="month" value={formData.bulan} onChange={e => setFormData({...formData, bulan: e.target.value})} required className="border p-2 rounded" />
        </div>
        <div>
          <label className="block text-xs mb-1">Tahun Ajaran</label>
          <input type="text" placeholder="Contoh: 2026/2027" value={formData.tahun_ajaran} onChange={e => setFormData({...formData, tahun_ajaran: e.target.value})} required className="border p-2 rounded" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Buat Periode</button>
      </form>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Bulan</th>
              <th className="p-3">Tahun Ajaran</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {periode.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-3 font-bold">{p.bulan}</td>
                <td className="p-3">{p.tahun_ajaran}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs text-white ${p.status === 'DRAFT' ? 'bg-gray-500' : p.status === 'DIPERIKSA' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  {p.status === 'DRAFT' && <button onClick={() => updateStatus(p.id, 'DIPERIKSA')} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Ajukan Periksa</button>}
                  {p.status === 'DIPERIKSA' && <button onClick={() => updateStatus(p.id, 'DIKUNCI')} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Kunci</button>}
                  {p.status === 'DIKUNCI' && <button onClick={() => updateStatus(p.id, 'DRAFT')} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Buka Kunci</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

