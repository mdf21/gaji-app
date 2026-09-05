const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3000;
const DB_GAJI_PATH = path.join(__dirname, 'data', 'database.json');
const DB_USERS_PATH = path.join(__dirname, 'data', 'users.json');
const SECRET_KEY = 'rahasia_sekolah_mi_miftahul_huda'; // Dalam praktiknya, gunakan environment variable

app.use(cors());
app.use(express.json());

// --- Helper Functions ---
async function readDB(path) {
    try {
        const data = await fs.readFile(path, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        await fs.mkdir(path.dirname(path), { recursive: true });
        await fs.writeFile(path, '[]');
        return [];
    }
}
async function writeDB(path, data) {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
}

// Perhitungan Gaji Otomatis
function calculateSalary(body) {
    const honorPerJam = parseInt(body.honor_per_jam) || 0;
    const kelebihanJam = parseInt(body.jumlah_kelebihan_jam) || 0;
    const gajiPokok = honorPerJam * kelebihanJam;
    const tunjanganKehadiran = parseInt(body.tunj_kehadiran) || 0;
    
    const fields = ['t_kamad', 't_bendahara', 't_kur', 't_kes', 't_sap', 't_pramuka', 't_uks', 't_10k', 't_kesenian', 't_keagamaan', 't_perpus', 't_operator', 't_dramband', 't_staff_tu', 't_wali_kls', 'jasa_ganti_guru'];
    let totalTunjangan = 0;
    let processedFields = {};
    
    fields.forEach(f => {
        processedFields[f] = parseInt(body[f]) || 0;
        totalTunjangan += processedFields[f];
    });

    const jumlahTerima = gajiPokok + tunjanganKehadiran + totalTunjangan;

    return {
        nama: body.nama,
        bulan: body.bulan, // Menambahkan field BULAN (Format YYYY-MM)
        jumlah_jam: parseInt(body.jumlah_jam) || 0,
        jumlah_kelebihan_jam: kelebihanJam,
        honor_per_jam: honorPerJam,
        jumlah_gaji_pokok: gajiPokok,
        hadir: parseInt(body.hadir) || 0,
        tunj_kehadiran: tunjanganKehadiran,
        ...processedFields,
        jumlah_terima: jumlahTerima,
        keterangan: body.keterangan || ""
    };
}

// --- Middleware Autentikasi ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROUTES AUTHENTICATION ---
// Inisialisasi User Default (Admin) jika belum ada
async function initDefaultUser() {
    let users = await readDB(DB_USERS_PATH);
    if (users.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        users.push({ id: 1, username: 'admin', password: hashedPassword });
        await writeDB(DB_USERS_PATH, users);
    }
}
initDefaultUser();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readDB(DB_USERS_PATH);
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ message: 'User tidak ditemukan' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Password salah' });

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ token, username: user.username });
});

// --- ROUTES CRUD GAJI (Dilindungi Auth) ---
app.get('/api/gaji', authenticateToken, async (req, res) => {
    const data = await readDB(DB_GAJI_PATH);
    const bulan = req.query.bulan; // Filter bulan
    if (bulan) {
        return res.json(data.filter(d => d.bulan === bulan));
    }
    res.json(data);
});

app.post('/api/gaji', authenticateToken, async (req, res) => {
    if (!req.body.bulan) return res.status(400).json({ message: "Bulan harus diisi (YYYY-MM)" });
    const data = await readDB(DB_GAJI_PATH);
    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    const processedData = calculateSalary(req.body);
    const newData = { id: newId, ...processedData };
    data.push(newData);
    await writeDB(DB_GAJI_PATH, data);
    res.status(201).json(newData);
});

app.delete('/api/gaji/:id', authenticateToken, async (req, res) => {
    let data = await readDB(DB_GAJI_PATH);
    data = data.filter(d => d.id !== parseInt(req.params.id));
    await writeDB(DB_GAJI_PATH, data);
    res.json({ message: "Data berhasil dihapus" });
});

// --- ROUTES EXPORT (Dilindungi Auth) ---
// Ekspor Excel
app.get('/api/export/excel', authenticateToken, async (req, res) => {
    const data = await readDB(DB_GAJI_PATH);
    const bulan = req.query.bulan;
    const filteredData = bulan ? data.filter(d => d.bulan === bulan) : data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Gaji Guru');
    
    worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Bulan', key: 'bulan', width: 10 },
        { header: 'Nama', key: 'nama', width: 30 },
        { header: 'Gaji Pokok', key: 'gaji_pokok', width: 15 },
        { header: 'Jumlah Terima', key: 'jumlah_terima', width: 20 },
        { header: 'Keterangan', key: 'ket', width: 20 }
    ];

    filteredData.forEach((d, idx) => {
        worksheet.addRow({
            no: idx + 1, bulan: d.bulan, nama: d.nama,
            gaji_pokok: d.jumlah_gaji_pokok, jumlah_terima: d.jumlah_terima, ket: d.keterangan
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Gaji_Guru_${bulan||'Semua'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
});

// Ekspor PDF Sederhana
app.get('/api/export/pdf', authenticateToken, async (req, res) => {
    const data = await readDB(DB_GAJI_PATH);
    const bulan = req.query.bulan;
    const filteredData = bulan ? data.filter(d => d.bulan === bulan) : data;

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Gaji_Guru_${bulan||'Semua'}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text(`Laporan Gaji Guru - ${bulan || 'Semua Bulan'}`, { align: 'center' });
    doc.moveDown();

    filteredData.forEach((d, idx) => {
        doc.fontSize(10).text(`${idx + 1}. Nama: ${d.nama} | Gaji Pokok: Rp${d.jumlah_gaji_pokok} | Total Terima: Rp${d.jumlah_terima}`);
        doc.moveDown(0.5);
    });

    doc.end();
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});