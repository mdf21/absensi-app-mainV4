# Aplikasi Absensi Madrasah

Aplikasi pencatatan kehadiran siswa, guru, dan staff secara real-time dengan dukungan ekspor Excel dan PDF.

## Fitur

- Pencatatan kehadiran harian (Hadir, Izin, Sakit, Alpha)
- Manajemen data peserta (Siswa, Guru, Staff)
- Impor data massal dari Excel (Simpatika/EMIS)
- Libur nasional otomatis + input manual
- id card untuk scan kehadiran
- laogin untuk admin dan clayen/guru
- Rekap bulanan/kustom dalam format Excel dan PDF
- Backup dan restore data JSON
- Konfigurasi kop surat dan tanda tangan digital
- Dukungan Docker untuk deployment

## Teknologi

- **Frontend**: React 18 + Vite 5, Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: JSON file (`backend/data/database.json`)
- **Deployment**: Docker & Docker Compose


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

## Konfigurasi pasword

Berikut adalah cara mereset password Anda menjadi baru:
Cara 1: Menggunakan Script Reset Otomatis (Paling Mudah)
Masuk ke terminal Ubuntu Anda dan buat file script baru di folder backend:

```bash
  cd ~/absensi-app-mainV2/backend
   nano generate-hash.js
``` 

Salin dan tempel (paste) kode di bawah ini ke dalam file tersebut (ganti 'PasswordBaruAnda123' dengan password yang Anda inginkan):
JavaScript
```bash
 const bcrypt = require('bcrypt');
  async function makeHash() {
       const passwordBaru = 'PasswordBaruAnda123'; // Ganti dengan password pilihan Anda
       const hashed = await bcrypt.hash(passwordBaru, 10);
       console.log("----------------------------------------");
       console.log("Password Asli :", passwordBaru);
       console.log("Hash Baru     :", hashed);
       console.log("----------------------------------------");
  }

  makeHash();
   ``` 

Simpan file (Ctrl + O, lalu Enter, lalu Ctrl + X).
Jalankan script tersebut di terminal:

```bash
  node generate-hash.js
```   

Terminal akan menampilkan teks Hash Baru yang panjang (contoh: $2b$10$abcdef...). Salin (copy) teks hash tersebut.
Cara 2: Masukkan Hash Baru ke database.json
Buka file database Anda menggunakan nano:

```bash
  nano data/database.json
  ```  

Cari bagian adminPassword atau clientPassword, lalu ganti isi teks di dalam tanda kutip dengan Hash Baru yang baru saja Anda copy dari terminal tadi.
Contohnya akan menjadi seperti ini:
```bash
JSON
 "appSettings": {
       "adminPassword": "$2b$10$SalinanHashBaruAndaDisini...",
       "clientPassword": "$2b$10$SalinanHashBaruAndaDisini..."
  }
   ``` 

Simpan file database (Ctrl + O, lalu Enter, lalu Ctrl + X).
Restart kontainer Docker Anda agar perubahan terbaca:

```bash
  cd ~/absensi-app-mainV2
   docker-compose restart
   ``` 

Sekarang, Anda bisa login menggunakan password baru yang Anda tulis di dalam script (PasswordBaruAnda123)!

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
