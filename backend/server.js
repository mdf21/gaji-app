const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "data", "database.json");

app.use(cors());
app.use(express.json());

// Helper: Membaca database
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // Jika file tidak ada, kembalikan array kosong
    await fs.writeFile(DB_PATH, "[]");
    return [];
  }
}

// Helper: Menulis ke database
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// READ: Ambil semua data
app.get("/api/gaji", async (req, res) => {
  const data = await readDB();
  res.json(data);
});

// CREATE: Tambah data baru
app.post("/api/gaji", async (req, res) => {
  const data = await readDB();
  const newId = data.length > 0 ? Math.max(...data.map((d) => d.id)) + 1 : 1;
  const newData = { id: newId, ...req.body };
  data.push(newData);
  await writeDB(data);
  res.status(201).json(newData);
});

// UPDATE: Edit data
app.put("/api/gaji/:id", async (req, res) => {
  const data = await readDB();
  const index = data.findIndex((d) => d.id === parseInt(req.params.id));
  if (index !== -1) {
    data[index] = { ...data[index], ...req.body, id: parseInt(req.params.id) };
    await writeDB(data);
    res.json(data[index]);
  } else {
    res.status(404).json({ message: "Data tidak ditemukan" });
  }
});

// DELETE: Hapus data
app.delete("/api/gaji/:id", async (req, res) => {
  let data = await readDB();
  data = data.filter((d) => d.id !== parseInt(req.params.id));
  await writeDB(data);
  res.json({ message: "Data berhasil dihapus" });
});

app.listen(PORT, () => {
  console.log(`Backend Production ready on port ${PORT}`);
});
