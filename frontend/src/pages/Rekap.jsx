import React, { useState, useEffect } from 'react';

export default function Rekap({ token }) {
  const [dataGaji, setDataGaji] = useState([]);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  
  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    const res = await fetch('/api/gaji', { headers: { 'Authorization': `Bearer ${token}` } });
    setDataGaji(await res.json());
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  
  // Filter by year
  const filteredData = dataGaji.filter(g => g.bulan && g.bulan.startsWith(filterTahun));

  // Compute Grand Totals
  const totalGuru = new Set(filteredData.map(g => g.guru_id)).size;
  const totalGajiPokok = filteredData.reduce((sum, g) => sum + (g.jumlah_gaji_pokok || 0), 0);
  const totalTunjKehadiran = filteredData.reduce((sum, g) => sum + (g.tunj_kehadiran || 0), 0);
  const totalJasaGanti = filteredData.reduce((sum, g) => sum + (g.jasa_ganti_guru || 0), 0);
  const totalPotongan = filteredData.reduce((sum, g) => sum + (g.total_potongan || 0), 0);
  const totalDiterima = filteredData.reduce((sum, g) => sum + (g.jumlah_terima || 0), 0);
  
  // Tunjangan Tugas
  const tunjTugas = ['t_kamad', 't_bendahara', 't_kur', 't_kes', 't_sap', 't_pramuka', 't_uks', 't_10k', 't_kesenian', 't_keagamaan', 't_perpus', 't_operator', 't_dramband', 't_staff_tu', 't_wali_kls'];
  const totalTunjanganTugas = filteredData.reduce((sum, g) => sum + tunjTugas.reduce((tSum, f) => tSum + (g[f] || 0), 0), 0);

  // Group by Month (01 to 12)
  const rekapBulanan = [];
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  for (let i = 1; i <= 12; i++) {
    const monthStr = i.toString().padStart(2, '0');
    const bData = filteredData.filter(g => g.bulan === `${filterTahun}-${monthStr}`);
    if(bData.length > 0) {
      const bTerima = bData.reduce((sum, g) => sum + (g.jumlah_terima || 0), 0);
      const bPotongan = bData.reduce((sum, g) => sum + (g.total_potongan || 0), 0);
      const bPendapatan = bData.reduce((sum, g) => sum + (g.total_pendapatan || 0), 0);
      rekapBulanan.push({
        bulan: namaBulan[i-1],
        jumlah_guru: bData.length,
        total_pendapatan: bPendapatan,
        total_potongan: bPotongan,
        total_diterima: bTerima
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold text-gray-800">Rekap Penggajian</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-600">Pilih Tahun:</label>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="border p-2 rounded">
            {[2024, 2025, 2026, 2027, 2028].map(y => (
               <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <div className="text-gray-500 text-xs font-bold uppercase">Total Guru Dibayar</div>
          <div className="text-2xl font-bold text-gray-800">{totalGuru} Orang</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <div className="text-gray-500 text-xs font-bold uppercase">Total Gaji Pokok</div>
          <div className="text-xl font-bold text-gray-800">{formatRupiah(totalGajiPokok)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <div className="text-gray-500 text-xs font-bold uppercase">Total Tunjangan</div>
          <div className="text-xl font-bold text-gray-800">{formatRupiah(totalTunjKehadiran + totalTunjanganTugas)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
          <div className="text-gray-500 text-xs font-bold uppercase">Total Jasa Ganti</div>
          <div className="text-xl font-bold text-gray-800">{formatRupiah(totalJasaGanti)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-red-50 p-6 rounded shadow text-center border border-red-200">
            <h3 className="text-red-800 font-bold text-lg mb-2">Total Potongan</h3>
            <p className="text-3xl font-black text-red-600">{formatRupiah(totalPotongan)}</p>
         </div>
         <div className="bg-green-50 p-6 rounded shadow text-center border border-green-200">
            <h3 className="text-green-800 font-bold text-lg mb-2">Total Bersih Dikeluarkan</h3>
            <p className="text-3xl font-black text-green-600">{formatRupiah(totalDiterima)}</p>
         </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="bg-gray-100 p-4 border-b font-bold text-gray-700">Rekapitulasi Bulanan - Tahun {filterTahun}</div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border-b">Bulan</th>
              <th className="p-3 border-b">Jml Data (Guru)</th>
              <th className="p-3 border-b text-right">Total Pendapatan</th>
              <th className="p-3 border-b text-right">Total Potongan</th>
              <th className="p-3 border-b text-right bg-green-50">Total Diterima</th>
            </tr>
          </thead>
          <tbody>
            {rekapBulanan.length === 0 ? (
               <tr><td colSpan="5" className="p-4 text-center text-gray-500">Belum ada data penggajian untuk tahun {filterTahun}</td></tr>
            ) : (
              rekapBulanan.map((b, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-bold">{b.bulan}</td>
                  <td className="p-3">{b.jumlah_guru}</td>
                  <td className="p-3 text-right">{formatRupiah(b.total_pendapatan)}</td>
                  <td className="p-3 text-right text-red-600">{formatRupiah(b.total_potongan)}</td>
                  <td className="p-3 text-right font-bold text-green-700 bg-green-50">{formatRupiah(b.total_diterima)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

