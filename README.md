# Sistem Penggajian Guru

Aplikasi web untuk mengelola data penggajian guru secara sederhana dan efisien. Aplikasi ini memungkinkan admin untuk menambah, melihat, dan menghapus data gaji guru dalam satu antarmuka yang mudah digunakan.

## Fitur

- Tambah data gaji guru (nama, jumlah jam, gaji pokok, total terima, status)
- Tampilkan daftar gaji dalam tabel
- Hapus data gaji
- Format angka otomatis ke Rupiah (IDR)
- Data tersimpan secara permanen

## Teknologi

### Frontend
- React 18
- Vite
- Tailwind CSS
- Nginx (production)

### Backend
- Node.js
- Express
- CORS

### Deployment
- Docker
- Docker Compose
- Named Volume untuk database

## Struktur Proyek

```
gaji-app/
├── backend/
│   ├── data/
│   │   └── database.json
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── docker-compose.yml
```

## Menjalankan Aplikasi

### Dengan Docker (Disarankan untuk Produksi/Server)

1. Pastikan Docker dan Docker Compose sudah terinstal di server Ubuntu
2. Clone repositori ini ke server
3. Jalankan perintah berikut di direktori proyek:

```bash
docker compose up -d --build
```

4. Akses aplikasi melalui browser:
```
http://<ip-server-anda>
```

5. Untuk menghentikan aplikasi:
```bash
docker compose down
```

### Tanpa Docker (Development)

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Akses frontend di `http://localhost:5173` dan backend berjalan di `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/gaji` | Ambil semua data gaji |
| POST | `/api/gaji` | Tambah data gaji baru |
| PUT | `/api/gaji/:id` | Edit data gaji berdasarkan ID |
| DELETE | `/api/gaji/:id` | Hapus data gaji berdasarkan ID |

### Format Data (JSON)

```json
{
  "nama": "Budi Santoso",
  "jam": 40,
  "gaji_pokok": 5000000,
  "jumlah_terima": 4800000,
  "status": "Sertifikasi"
}
```

## Database

Aplikasi menggunakan file JSON sebagai database yang disimpan di volume Docker. Data akan tetap ada meskipun container di-restart atau di-deploy ulang.

File database: `backend/data/database.json`

## Troubleshooting

### Permission Error di Ubuntu

Jika terjadi error permission saat menulis ke database, pastikan:
1. Menggunakan named volume di `docker-compose.yml`
2. Backend berjalan sebagai user `node` (bukan root)
3. Direktori `backend/data` memiliki permission yang sesuai

### Port 80 Sudah Digunakan

Jika port 80 di server sudah dipakai oleh layanan lain (seperti Apache/Nginx), ubah mapping port di `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"
```

Kemudian akses melalui `http://<ip-server>:8080`.

## Kontribusi

Silakan buat pull request atau laporkan issue jika menemukan bug atau ingin menambahkan fitur.

## Lisensi

MIT License
