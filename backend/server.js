const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt'); // PENTING: Tambahkan ini

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// Inisialisasi Database
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
        users: [],
        attendance: {},
        holidays: [],
        pdfConfig: {},
        appSettings: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
}

// Fungsi Deep Merge (Bawaan Anda)
const deepMerge = (target, source) => {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]); // Pastikan target[key] tidak undefined
        } else {
            result[key] = source[key];
        }
    }
    return result;
};

// --- API BARU 1: LOGIN (Validasi Password di Server) ---
app.post('/api/login', async (req, res) => {
    const { role, password } = req.body;

    if (!role || (role !== 'admin' && role !== 'client')) {
        return res.status(400).json({ success: false, message: 'Role tidak valid' });
    }

    fs.readFile(DATA_FILE, 'utf8', async (err, dataRaw) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        
        let db;
        try { db = JSON.parse(dataRaw); } catch(e) { db = { appSettings: {} }; }

        // Ambil hash dari database (kosong jika belum ada)
        const storedHash = role === 'admin' 
            ? (db.appSettings?.adminPassword || '') 
            : (db.appSettings?.clientPassword || '');

        if (!storedHash) {
             return res.status(500).json({ success: false, message: 'Sistem belum dikonfigurasi (Password belum diatur/di-hash di database)' });
        }

        try {
            // Bandingkan password BCRYPT
            const isMatch = await bcrypt.compare(password, storedHash);
            if (isMatch) {
                res.json({ success: true, message: 'Login berhasil' });
            } else {
                res.status(401).json({ success: false, message: 'Password salah' });
            }
        } catch (compareError) {
             console.error("Bcrypt compare error:", compareError);
             res.status(500).json({ success: false, message: 'Kesalahan internal saat mencocokkan sandi' });
        }
    });
});

// --- REVISI API: GET DATA (Jangan kirim password ke Frontend!) ---
app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, dataRaw) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        try {
            let data = JSON.parse(dataRaw);
            
            // KEAMANAN KRITIS: Hapus password sebelum dikirim ke browser!
            if (data.appSettings) {
                delete data.appSettings.adminPassword;
                delete data.appSettings.clientPassword;
            }

            res.json(data);
        } catch (e) {
             res.status(500).json({ error: 'Data parsing error' });
        }
    });
});

// --- REVISI API: POST DATA (Tangkap perubahan password & Hash) ---
app.post('/api/data', async (req, res) => {
    let payload = req.body;
    if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }
    }

    fs.readFile(DATA_FILE, 'utf8', async (err, currentDataRaw) => {
        let currentData = {};
        if (!err && currentDataRaw) {
            try { currentData = JSON.parse(currentDataRaw); } catch(e) {}
        }

        // TANGKAP PERUBAHAN PASSWORD: Jika payload mencoba menyimpan password baru, hash terlebih dahulu!
        if (payload.appSettings) {
            try {
                if (payload.appSettings.adminPassword) {
                    payload.appSettings.adminPassword = await bcrypt.hash(payload.appSettings.adminPassword, 10);
                }
                if (payload.appSettings.clientPassword) {
                    payload.appSettings.clientPassword = await bcrypt.hash(payload.appSettings.clientPassword, 10);
                }
            } catch (hashError) {
                console.error("Gagal melakukan hash password baru:", hashError);
                return res.status(500).json({ error: 'Gagal mengenkripsi password baru' });
            }
        }

        // Gunakan fungsi deepMerge Anda untuk menggabungkan payload dengan data lama
        const mergedData = deepMerge(currentData, payload);

        fs.writeFile(DATA_FILE, JSON.stringify(mergedData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Gagal menyimpan data' });
            res.json({ success: true, message: 'Data berhasil disimpan' });
        });
    });
});
// --- TAMBAHKAN KODE INI UNTUK MENAMPILKAN FRONTEND ---
// Menyajikan file statis dari hasil build React (biasanya di folder frontend/dist)
const frontendPath = path.join(__dirname, './frontend/dist');
app.use(express.static(frontendPath));

// Menangkap semua URL yang tidak dikenali API dan mengarahkannya ke UI React
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
// -----------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
