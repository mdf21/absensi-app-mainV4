# Aplikasi Absensi Madrasah

Aplikasi pencatatan kehadiran siswa, guru, dan staff secara real-time dengan dukungan ekspor Excel dan PDF.

## Fitur

- Pencatatan kehadiran harian (Hadir, Izin, Sakit, Alpha)
- Manajemen data peserta (Siswa, Guru, Staff)
- Impor data massal dari Excel (Simpatika/EMIS)
- Libur nasional otomatis + input manual
- Rekap bulanan/kustom dalam format Excel dan PDF
- Backup dan restore data JSON
- Konfigurasi kop surat dan tanda tangan digital
- Dukungan Docker untuk deployment

## Teknologi

- **Frontend**: React 18 + Vite 5, Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: JSON file (`backend/data/database.json`)
- **Deployment**: Docker & Docker Compose

## Struktur Proyek

```
absensi-app/
├── backend/
│   ├── server.js          # API server + serve static frontend
│   ├── package.json
│   └── data/              # Database JSON (dibuat otomatis)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Komponen utama aplikasi
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Dockerfile             # Multi-stage build
├── docker-compose.yml
└── .gitignore
```

## Cara Instalasi

### Opsi 1: Docker (Disarankan untuk Production)

**Prasyarat:**
- Docker Engine 20.10+
- Docker Compose 2.0+

**Langkah-langkah:**

```bash
# 1. Clone repository
git clone https://github.com/mdf21/absensi-app-mainV2.git
cd absensi-app-mainV2

# 2. Build dan jalankan container
docker-compose up -d --build

# 3. Cek status container
docker-compose ps

# 4. Akses aplikasi
# Buka browser: http://SERVER_IP_ANDA
```

**Perintah berguna:**

```bash
# Lihat log
docker-compose logs -f

# Restart aplikasi
docker-compose restart

# Stop aplikasi
docker-compose down

# Update aplikasi
git pull
docker-compose up -d --build
```

### Opsi 2: Manual (Untuk Development)

**Prasyarat:**
- Node.js 18+
- npm 9+

**Langkah-langkah:**

```bash
# 1. Clone repository
git clone https://github.com/mdf21/absensi-app-mainV2.git
cd absensi-app-mainV2

# 2. Install dependencies backend
cd backend
npm install --production

# 3. Build frontend
cd ../frontend
npm install
npm run build

# 4. Jalankan backend
cd ../backend
node server.js
```

Akses aplikasi di `http://localhost:5001`.

## Konfigurasi

### Environment Variables

| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `5001` | Port aplikasi |
| `GAS_URL` | - | URL Google Apps Script (opsional) |

### Volume Docker

Data aplikasi disimpan di volume Docker untuk persistensi:

```yaml
volumes:
  - ./backend/data:/app/data
```

Jangan menghapus folder `backend/data` kecuali ingin mereset seluruh data.

## Penggunaan

1. Buka aplikasi di browser
2. Masuk ke menu **Direktori** untuk menambah data peserta
3. Unggah Excel atau tambah manual
4. Masuk ke menu **Absensi** untuk pencatatan harian
5. Gunakan **Sistem** untuk:
   - Menambah libur manual
   - Mengatur kop surat dan tanda tangan
   - Backup/restore data
   - Mengganti nama/logo aplikasi

## Backup Data

### Manual
- Download: Menu **Sistem** → **Download Backup JSON**
- Restore: Menu **Sistem** → **Restore JSON Lokal**

### Otomatis
Backup folder `backend/data` secara berkala (disarankan minimal mingguan).

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| jika Port sudah dipakai | Ubah port di `docker-compose.yml`: `"5001:3000"` |
| Data hilang setelah restart | Pastikan volume `./backend/data` tetap ada |
| Frontend tidak muncul | Cek log Docker: `docker-compose logs` |
| Import Excel gagal | Pastikan format kolom: Nama, Peran, Nomor Induk, Kelas |

## Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m 'Add some feature'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buka Pull Request

## License

MIT
