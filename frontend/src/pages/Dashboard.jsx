import React, { useState, useEffect } from 'react';

export default function Dashboard({ token }) {
  const [stats, setStats] = useState({
    totalGuru: 0,
    totalPeriode: 0,
    totalGaji: 0,
    totalBersih: 0,
    recentGaji: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [guruRes, periodeRes, gajiRes] = await Promise.all([
        fetch('/api/guru', { headers }),
        fetch('/api/periode', { headers }),
        fetch('/api/gaji', { headers })
      ]);

      const guru = guruRes.ok ? await guruRes.json() : [];
      const periode = periodeRes.ok ? await periodeRes.json() : [];
      const gaji = gajiRes.ok ? await gajiRes.json() : [];

      const totalBersih = gaji.reduce((sum, g) => sum + (g.jumlah_terima || 0), 0);
      const recentGaji = [...gaji].sort((a, b) => b.id - a.id).slice(0, 5);

      setStats({
        totalGuru: guru.length,
        totalPeriode: periode.length,
        totalGaji: gaji.length,
        totalBersih,
        recentGaji
      });
    } catch (err) {
      console.error('Gagal memuat dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mb-6">Selamat datang di Sistem Informasi Penggajian Guru MI Miftahul Huda.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-xs font-bold uppercase">Total Guru</div>
            <div className="text-3xl font-bold text-blue-800">{stats.totalGuru}</div>
            <div className="text-xs text-blue-500 mt-1">Data master guru</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-xs font-bold uppercase">Total Periode</div>
            <div className="text-3xl font-bold text-green-800">{stats.totalPeriode}</div>
            <div className="text-xs text-green-500 mt-1">Periode penggajian</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-xs font-bold uppercase">Total Data Gaji</div>
            <div className="text-3xl font-bold text-yellow-800">{stats.totalGaji}</div>
            <div className="text-xs text-yellow-500 mt-1">Transaksi gaji</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-xs font-bold uppercase">Total Bersih</div>
            <div className="text-2xl font-bold text-purple-800">{formatRupiah(stats.totalBersih)}</div>
            <div className="text-xs text-purple-500 mt-1">Jumlah terima keseluruhan</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="bg-gray-100 p-4 border-b font-bold text-gray-700">5 Data Gaji Terbaru</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border-b">Nama</th>
                <th className="p-3 border-b">Bulan</th>
                <th className="p-3 border-b text-right">Pendapatan</th>
                <th className="p-3 border-b text-right">Potongan</th>
                <th className="p-3 border-b text-right">Diterima</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentGaji.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">Belum ada data gaji</td>
                </tr>
              ) : (
                stats.recentGaji.map((g) => (
                  <tr key={g.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{g.nama}</td>
                    <td className="p-3">{g.bulan || '-'}</td>
                    <td className="p-3 text-right text-green-700">{formatRupiah(g.total_pendapatan)}</td>
                    <td className="p-3 text-right text-red-700">{formatRupiah(g.total_potongan)}</td>
                    <td className="p-3 text-right font-bold text-blue-700">{formatRupiah(g.jumlah_terima)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
