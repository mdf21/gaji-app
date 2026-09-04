import { useState, useEffect } from "react";

function App() {
  const [dataGaji, setDataGaji] = useState([]);
  const [formData, setFormData] = useState({
    nama: "",
    jam: "",
    gaji_pokok: "",
    jumlah_terima: "",
    status: "Belum",
  });

  // Ambil data (GET)
  const fetchData = async () => {
    const res = await fetch("/api/gaji");
    const data = await res.json();
    setDataGaji(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format ke Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Handle Input Form
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Simpan Data (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/gaji", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: formData.nama,
        jam: parseInt(formData.jam),
        gaji_pokok: parseInt(formData.gaji_pokok),
        jumlah_terima: parseInt(formData.jumlah_terima),
        status: formData.status,
      }),
    });
    setFormData({
      nama: "",
      jam: "",
      gaji_pokok: "",
      jumlah_terima: "",
      status: "Belum",
    });
    fetchData(); // Refresh tabel
  };

  // Hapus Data (DELETE)
  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus data ini?")) {
      await fetch(`/api/gaji/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">
          Sistem Aplikasi Penggajian Guru
        </h1>

        {/* Form Tambah Data */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Tambah Data Baru
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              name="nama"
              placeholder="Nama Guru"
              value={formData.nama}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="jam"
              placeholder="Jumlah Jam"
              value={formData.jam}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="gaji_pokok"
              placeholder="Gaji Pokok (Angka)"
              value={formData.gaji_pokok}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="jumlah_terima"
              placeholder="Total Terima Bersih"
              value={formData.jumlah_terima}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="Belum">Belum Sertifikasi</option>
              <option value="Sertifikasi">Sertifikasi</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold"
            >
              Simpan Data
            </button>
          </form>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-800 text-white text-sm uppercase">
              <tr>
                <th className="px-4 py-3">Nama Guru</th>
                <th className="px-4 py-3 text-center">Jam</th>
                <th className="px-4 py-3 text-right">Gaji Pokok</th>
                <th className="px-4 py-3 text-right">Total Terima</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataGaji.map((guru) => (
                <tr key={guru.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{guru.nama}</td>
                  <td className="px-4 py-3 text-center">{guru.jam}</td>
                  <td className="px-4 py-3 text-right">
                    {formatRupiah(guru.gaji_pokok)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    {formatRupiah(guru.jumlah_terima)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${guru.status === "Sertifikasi" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {guru.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(guru.id)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
