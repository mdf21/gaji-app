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
const DB_GURU_PATH = path.join(__dirname, 'data', 'guru.json');
const DB_PERIODE_PATH = path.join(__dirname, 'data', 'periode.json');
const SECRET_KEY = 'rahasia_sekolah_mi_miftahul_huda'; // Dalam praktiknya, gunakan environment variable

app.use(cors());
app.use(express.json());

// --- Helper Functions ---
async function readDB(dbPath) {
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        await fs.writeFile(dbPath, '[]');
        return [];
    }
}
async function writeDB(dbPath, data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Perhitungan Gaji Otomatis
function calculateSalary(body) {
    const honorPerJam = parseInt(body.honor_per_jam) || 0;
    const kelebihanJam = parseInt(body.jumlah_kelebihan_jam) || 0;
    const gajiPokok = honorPerJam * kelebihanJam;
    const tunjanganKehadiran = parseInt(body.tunj_kehadiran) || 0;
    const jasaGantiGuru = parseInt(body.jasa_ganti_guru) || 0;
    
    const fieldsTunjangan = ['t_kamad', 't_bendahara', 't_kur', 't_kes', 't_sap', 't_pramuka', 't_uks', 't_10k', 't_kesenian', 't_keagamaan', 't_perpus', 't_operator', 't_dramband', 't_staff_tu', 't_wali_kls'];
    let totalTunjangan = 0;
    let processedFields = {};
    
    fieldsTunjangan.forEach(f => {
        processedFields[f] = parseInt(body[f]) || 0;
        totalTunjangan += processedFields[f];
    });

    const totalPendapatan = gajiPokok + tunjanganKehadiran + totalTunjangan + jasaGantiGuru;

    // Potongan
    const fieldsPotongan = ['p_koperasi', 'p_pinjaman', 'p_kas_sekolah', 'p_kehadiran', 'p_lainnya'];
    let totalPotongan = 0;
    let processedPotongan = {};

    fieldsPotongan.forEach(f => {
        processedPotongan[f] = parseInt(body[f]) || 0;
        totalPotongan += processedPotongan[f];
    });

    const jumlahTerima = totalPendapatan - totalPotongan;

    return {
        guru_id: body.guru_id,
        nama: body.nama,
        bulan: body.bulan,
        periode_id: body.periode_id,
        jumlah_jam: parseInt(body.jumlah_jam) || 0,
        jumlah_kelebihan_jam: kelebihanJam,
        honor_per_jam: honorPerJam,
        jumlah_gaji_pokok: gajiPokok,
        hadir: parseInt(body.hadir) || 0,
        tunj_kehadiran: tunjanganKehadiran,
        ...processedFields,
        jasa_ganti_guru: jasaGantiGuru,
        ...processedPotongan,
        total_pendapatan: totalPendapatan,
        total_potongan: totalPotongan,
        jumlah_terima: jumlahTerima,
        keterangan: body.keterangan || "",
        ket_potongan: body.ket_potongan || ""
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
async function initDefaultUser() {
    let users = await readDB(DB_USERS_PATH);
    if (users.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        users.push({ id: 1, username: 'admin', password: hashedPassword, role: 'ADMIN' });
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

    const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ token, username: user.username, role: user.role });
});

// --- MASTER DATA GURU ---
app.get('/api/guru', authenticateToken, async (req, res) => {
    const data = await readDB(DB_GURU_PATH);
    res.json(data);
});

app.post('/api/guru', authenticateToken, async (req, res) => {
    const data = await readDB(DB_GURU_PATH);
    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    const newData = { id: newId, ...req.body, status_aktif: req.body.status_aktif !== undefined ? req.body.status_aktif : true };
    data.push(newData);
    await writeDB(DB_GURU_PATH, data);
    res.status(201).json(newData);
});

app.put('/api/guru/:id', authenticateToken, async (req, res) => {
    let data = await readDB(DB_GURU_PATH);
    const index = data.findIndex(d => d.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Data tidak ditemukan' });
    
    data[index] = { ...data[index], ...req.body };
    await writeDB(DB_GURU_PATH, data);
    res.json(data[index]);
});

app.delete('/api/guru/:id', authenticateToken, async (req, res) => {
    let data = await readDB(DB_GURU_PATH);
    data = data.filter(d => d.id !== parseInt(req.params.id));
    await writeDB(DB_GURU_PATH, data);
    res.json({ message: "Data berhasil dihapus" });
});

// --- PERIODE PENGGAJIAN ---
app.get('/api/periode', authenticateToken, async (req, res) => {
    const data = await readDB(DB_PERIODE_PATH);
    res.json(data);
});

app.post('/api/periode', authenticateToken, async (req, res) => {
    const data = await readDB(DB_PERIODE_PATH);
    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    const newData = { id: newId, ...req.body, status: req.body.status || 'DRAFT' }; // DRAFT, DIPERIKSA, DIKUNCI
    data.push(newData);
    await writeDB(DB_PERIODE_PATH, data);
    res.status(201).json(newData);
});

app.put('/api/periode/:id', authenticateToken, async (req, res) => {
    let data = await readDB(DB_PERIODE_PATH);
    const index = data.findIndex(d => d.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Data tidak ditemukan' });
    
    data[index] = { ...data[index], ...req.body };
    await writeDB(DB_PERIODE_PATH, data);
    res.json(data[index]);
});

app.delete('/api/periode/:id', authenticateToken, async (req, res) => {
    let data = await readDB(DB_PERIODE_PATH);
    data = data.filter(d => d.id !== parseInt(req.params.id));
    await writeDB(DB_PERIODE_PATH, data);
    res.json({ message: "Data berhasil dihapus" });
});

// --- ROUTES CRUD GAJI (Dilindungi Auth) ---
app.get('/api/gaji', authenticateToken, async (req, res) => {
    const data = await readDB(DB_GAJI_PATH);
    const bulan = req.query.bulan;
    const periode_id = req.query.periode_id;
    
    let filteredData = data;
    if (bulan) {
        filteredData = filteredData.filter(d => d.bulan === bulan);
    }
    if (periode_id) {
        filteredData = filteredData.filter(d => d.periode_id === parseInt(periode_id));
    }
    res.json(filteredData);
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

app.put('/api/gaji/:id', authenticateToken, async (req, res) => {
    let data = await readDB(DB_GAJI_PATH);
    const index = data.findIndex(d => d.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Data tidak ditemukan' });
    
    const processedData = calculateSalary(req.body);
    data[index] = { ...data[index], ...processedData };
    await writeDB(DB_GAJI_PATH, data);
    res.json(data[index]);
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