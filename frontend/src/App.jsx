import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import LZString from 'lz-string';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import defaultLogoUrl from './assets/logo.png';
import './darkmode.css';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
  const icon = type === 'error' ? 'fa-times-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-fade-in-up`}>
      <i className={`fas ${icon} text-lg`}></i>
      <span className="font-medium">{String(message)}</span>
    </div>
  );
};
const Dashboard = ({
  users = [],
  attendance = {},
  selectedDate,
  setSelectedDate
}) => {
  // =========================================================
  // DATA PENGGUNA
  // =========================================================

  const siswa = users.filter(
    u => String(u.peran || '').toLowerCase() === 'siswa'
  );

  const guru = users.filter(
    u => String(u.peran || '').toLowerCase() === 'guru'
  );

  const tendik = users.filter(
    u => {
      const peran = String(u.peran || '').toLowerCase();
      return (
        peran === 'tenaga kependidikan' ||
        peran === 'staff'
      );
    }
  );

  const totalSiswa = siswa.length;
  const totalGuru = guru.length;
  const totalTendik = tendik.length;
  const totalSemua = totalSiswa + totalGuru + totalTendik;

  // =========================================================
  // JENIS KELAMIN SISWA
  // =========================================================

  const lakiLaki = siswa.filter(
    u => String(u.jk || '').toUpperCase() === 'L'
  ).length;

  const perempuan = siswa.filter(
    u => String(u.jk || '').toUpperCase() === 'P'
  ).length;

  // =========================================================
  // KELAS
  // KELAS BAWAH = 1,2,3
  // KELAS ATAS  = 4,5,6
  // =========================================================

  const getNomorKelas = (kelas) => {
    const match = String(kelas || '').match(/Kelas\s*(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  const jumlahKelas = {
    1: siswa.filter(u => getNomorKelas(u.kelas) === 1).length,
    2: siswa.filter(u => getNomorKelas(u.kelas) === 2).length,
    3: siswa.filter(u => getNomorKelas(u.kelas) === 3).length,
    4: siswa.filter(u => getNomorKelas(u.kelas) === 4).length,
    5: siswa.filter(u => getNomorKelas(u.kelas) === 5).length,
    6: siswa.filter(u => getNomorKelas(u.kelas) === 6).length
  };

  const kelasBawah =
    jumlahKelas[1] +
    jumlahKelas[2] +
    jumlahKelas[3];

  const kelasAtas =
    jumlahKelas[4] +
    jumlahKelas[5] +
    jumlahKelas[6];

  // =========================================================
  // ABSENSI TANGGAL TERPILIH
  // =========================================================

  const dataTanggal = attendance[selectedDate] || {};

  const semuaPengguna = [...siswa, ...guru, ...tendik];

  const getStatus = (user) => {
    return dataTanggal[user.id] || null;
  };

  const sudahAbsen = semuaPengguna.filter(
    user => {
      const status = getStatus(user);
      return ['Hadir', 'Izin', 'Sakit', 'Alpha'].includes(status);
    }
  ).length;

  const belumAbsen = Math.max(
    totalSemua - sudahAbsen,
    0
  );

  const jumlahHadir = semuaPengguna.filter(
    user => getStatus(user) === 'Hadir'
  ).length;

  const jumlahIzin = semuaPengguna.filter(
    user => getStatus(user) === 'Izin'
  ).length;

  const jumlahSakit = semuaPengguna.filter(
    user => getStatus(user) === 'Sakit'
  ).length;

  const jumlahAlpha = semuaPengguna.filter(
    user => getStatus(user) === 'Alpha'
  ).length;

  const persentaseLengkap =
    totalSemua > 0
      ? Math.round((sudahAbsen / totalSemua) * 100)
      : 0;

  const formatTanggal = (date) => {
    if (!date) return '-';

    const [tahun, bulan, hari] = date.split('-');

    const namaBulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];

    return `${Number(hari)} ${namaBulan[Number(bulan) - 1]} ${tahun}`;
  };

  // =========================================================
  // DONUT SVG
  // =========================================================

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress =
    circumference - (persentaseLengkap / 100) * circumference;

  // =========================================================
  // CARD
  // =========================================================

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    iconBg,
    iconColor,
    valueColor
  }) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <i
            className={`fas ${icon} text-2xl ${iconColor}`}
          ></i>
        </div>

        <div className="min-w-0">
          <div
            className={`text-sm font-bold uppercase tracking-wide ${valueColor}`}
          >
            {title}
          </div>

          <div className="text-3xl font-bold text-slate-800 mt-1">
            {value}
          </div>

          <div className="text-xs text-slate-500 mt-1">
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );

  const ProgressCard = ({
    icon,
    title,
    value,
    subtitle,
    percent,
    iconBg,
    iconColor,
    barColor
  }) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center`}
        >
          <i
            className={`fas ${icon} text-2xl ${iconColor}`}
          ></i>
        </div>

        <div className="flex-1">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-700">
            {title}
          </div>

          <div className="text-3xl font-bold text-slate-800 mt-1">
            {value}
          </div>

          <div className="text-xs text-slate-500 mt-1">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{
            width: `${Math.min(percent, 100)}%`
          }}
        ></div>
      </div>
    </div>
  );

  const statusData = [
    {
      label: 'Hadir',
      value: jumlahHadir,
      bg: 'bg-green-500'
    },
    {
      label: 'Izin',
      value: jumlahIzin,
      bg: 'bg-blue-500'
    },
    {
      label: 'Sakit',
      value: jumlahSakit,
      bg: 'bg-yellow-400'
    },
    {
      label: 'Alpha',
      value: jumlahAlpha,
      bg: 'bg-red-500'
    }
  ];

  const maxStatus = Math.max(
    jumlahHadir,
    jumlahIzin,
    jumlahSakit,
    jumlahAlpha,
    1
  );

return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">

        {/* =====================================================
            HEADER DASHBOARD
        ====================================================== */}

        <div className="max-w-[1600px] mx-auto">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                <div>
                    <h1 className="
                        text-2xl md:text-3xl
                        font-bold
                        text-slate-800 dark:text-slate-100
                    ">
                        Dashboard Absensi
                    </h1>

                    <p className="
                        text-sm
                        text-slate-500 dark:text-slate-400
                        mt-1
                    ">
                        Ringkasan data absensi tanggal{' '}

                        <span className="
                            font-semibold
                            text-slate-700 dark:text-slate-200
                        ">
                            {formatTanggal(selectedDate)}
                        </span>
                    </p>
                </div>


                {/* =========================
                    DATE PICKER
                ========================== */}

                <div className="
                    bg-white dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    rounded-2xl
                    px-4 py-3
                    shadow-sm
                ">

                    <label className="
                        block
                        text-xs
                        font-semibold
                        text-slate-500 dark:text-slate-400
                        mb-1
                    ">
                        Tanggal Absensi
                    </label>

                    <div className="flex items-center gap-2">

                        <i className="
                            fas fa-calendar-alt
                            text-indigo-500
                        "></i>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="
                                border-0
                                outline-none
                                text-sm
                                font-semibold
                                text-slate-700 dark:text-slate-200
                                bg-transparent
                                cursor-pointer
                            "
                        />

                    </div>

                </div>

            </div>  
      {/* =====================================================
            ROW 1 - TOTAL SISWA GURU TENDIK SELURUHNYA
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">

          <StatCard
            icon="fa-user-graduate"
            title="Total Siswa"
            value={totalSiswa}
            subtitle={`Dari ${totalSiswa} siswa terdaftar`}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            valueColor="text-blue-600"
          />

          <StatCard
            icon="fa-chalkboard-teacher"
            title="Total Guru"
            value={totalGuru}
            subtitle={`Dari ${totalGuru} guru terdaftar`}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            valueColor="text-green-600"
          />

          <StatCard
            icon="fa-briefcase"
            title="Total Tendik"
            value={totalTendik}
            subtitle={`Dari ${totalTendik} tendik terdaftar`}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            valueColor="text-purple-600"
          />

          <StatCard
            icon="fa-users"
            title="Total Seluruhnya"
            value={totalSemua}
            subtitle="Siswa, Guru dan Tendik"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            valueColor="text-orange-500"
          />

        </div>

        {/* =====================================================
            ROW 2
        ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          <div className="lg:col-span-1 space-y-4">

            <ProgressCard
              icon="fa-male"
              title="Laki-laki"
              value={lakiLaki}
              subtitle={
                totalSiswa
                  ? `${((lakiLaki / totalSiswa) * 100).toFixed(1)}% dari total siswa`
                  : '0% dari total siswa'
              }
              percent={
                totalSiswa
                  ? (lakiLaki / totalSiswa) * 100
                  : 0
              }
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              barColor="bg-blue-500"
            />

            <ProgressCard
              icon="fa-female"
              title="Perempuan"
              value={perempuan}
              subtitle={
                totalSiswa
                  ? `${((perempuan / totalSiswa) * 100).toFixed(1)}% dari total siswa`
                  : '0% dari total siswa'
              }
              percent={
                totalSiswa
                  ? (perempuan / totalSiswa) * 100
                  : 0
              }
              iconBg="bg-pink-50"
              iconColor="text-pink-500"
              barColor="bg-pink-500"
            />

          </div>

          <div className="lg:col-span-1 space-y-4">

            <ProgressCard
              icon="fa-school"
              title="Kelas Bawah (1 • 2 • 3)"
              value={kelasBawah}
              subtitle={
                totalSiswa
                  ? `${((kelasBawah / totalSiswa) * 100).toFixed(1)}% dari total siswa`
                  : '0% dari total siswa'
              }
              percent={
                totalSiswa
                  ? (kelasBawah / totalSiswa) * 100
                  : 0
              }
              iconBg="bg-green-50"
              iconColor="text-green-600"
              barColor="bg-green-500"
            />

            <ProgressCard
              icon="fa-graduation-cap"
              title="Kelas Atas (4 • 5 • 6)"
              value={kelasAtas}
              subtitle={
                totalSiswa
                  ? `${((kelasAtas / totalSiswa) * 100).toFixed(1)}% dari total siswa`
                  : '0% dari total siswa'
              }
              percent={
                totalSiswa
                  ? (kelasAtas / totalSiswa) * 100
                  : 0
              }
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              barColor="bg-orange-500"
            />

          </div>

          {/* ===================================================
              KELENGKAPAN ABSENSI
          ==================================================== */}

           <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">

             <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
               Kelengkapan Absensi
             </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6">

              <div className="relative w-44 h-44 flex-shrink-0">

                <svg
                  viewBox="0 0 180 180"
                  className="w-full h-full -rotate-90"
                >
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                  />

                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    className="transition-all duration-700"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-slate-800">
                    {persentaseLengkap}%
                  </div>

                  <div className="text-sm text-slate-500">
                    Lengkap
                  </div>
                </div>

              </div>

              <div className="flex-1 w-full">

                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="font-semibold text-slate-700">
                      Sudah Absen
                    </span>
                  </div>

                  <span className="text-xl font-bold text-slate-800">
                    {sudahAbsen}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="font-semibold text-slate-700">
                      Belum Absen
                    </span>
                  </div>

                  <span className="text-xl font-bold text-slate-800">
                    {belumAbsen}
                  </span>
                </div>

              </div>

            </div>

            <div className="mt-4 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs rounded-xl px-4 py-3">
              <i className="fas fa-info-circle mr-2"></i>
              Persentase dihitung dari seluruh pengguna
              (Siswa, Guru, Tendik).
            </div>

          </div>

        </div>

        {/* =====================================================
            ROW 3 - SISWA PER KELAS + REKAP ABSENSI
        ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* SISWA PER KELAS */}

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Siswa Per Kelas
              </h2>

              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total {totalSiswa} siswa
              </span>

            </div>

            <div className="space-y-4">

              {[1, 2, 3, 4, 5, 6].map(kelas => {

  const siswaKelas = siswa.filter(
    u => getNomorKelas(u.kelas) === kelas
  );

  const jumlah = siswaKelas.length;

  const jumlahLaki = siswaKelas.filter(
    u => String(u.jk || '').toUpperCase() === 'L'
  ).length;

  const jumlahPerempuan = siswaKelas.filter(
    u => String(u.jk || '').toUpperCase() === 'P'
  ).length;

  const persen =
    totalSiswa > 0
      ? (jumlah / totalSiswa) * 100
      : 0;

  return (
    <div key={kelas}>

      {/* Nama kelas + total */}
      <div className="flex justify-between items-center mb-1">

        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Kelas {kelas}
        </span>

        <span className="font-bold text-slate-800 dark:text-slate-100">
          {jumlah}
        </span>

      </div>

      {/* Laki-laki & perempuan */}
      <div className="flex items-center gap-4 mb-2 text-xs">

        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
          <i className="fas fa-male"></i>
          Laki-laki:
          <strong>{jumlahLaki}</strong>
        </span>

        <span className="flex items-center gap-1 text-pink-500 dark:text-pink-400 font-medium">
          <i className="fas fa-female"></i>
          Perempuan:
          <strong>{jumlahPerempuan}</strong>
        </span>

      </div>

      {/* Grafik */}
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">

        <div
          className={`h-full rounded-full transition-all duration-700 ${
            kelas <= 3
              ? 'bg-green-500'
              : 'bg-orange-500'
          }`}
          style={{
            width: `${persen}%`
          }}
        ></div>

      </div>

    </div>
  );
})}

            </div>

            <div className="mt-5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs rounded-xl px-4 py-3">
              <i className="fas fa-info-circle mr-2"></i>
              Grafik ini hanya menampilkan data siswa.
            </div>

          </div>

          {/* REKAP KEHADIRAN */}

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Rekap Kehadiran
              </h2>

              <span className="text-xs text-slate-500 dark:text-slate-400">
                Semua pengguna
              </span>

            </div>

            <div className="space-y-5">

              {statusData.map(item => {

                const persen =
                  totalSemua > 0
                    ? (item.value / totalSemua) * 100
                    : 0;

                const barWidth =
                  maxStatus > 0
                    ? (item.value / maxStatus) * 100
                    : 0;

                return (
                  <div key={item.label}>

                    <div className="flex items-center gap-3">

                      <div className="w-14 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {item.label}
                      </div>

                      <div className="flex-1">

                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">

                          <div
                            className={`h-full ${item.bg} rounded-full transition-all duration-700`}
                            style={{
                              width: `${barWidth}%`
                            }}
                          ></div>

                        </div>

                      </div>

                      <div className="w-28 text-right text-sm font-bold text-slate-800 dark:text-slate-100">
                        {item.value}{' '}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          ({persen.toFixed(1)}%)
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="bg-green-50 dark:bg-green-950/40 rounded-xl p-3">
                <div className="text-xs text-green-700 dark:text-green-300">
                  Sudah Absen
                </div>
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  {sudahAbsen}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3">
                <div className="text-xs text-red-700 dark:text-red-300">
                  Belum Absen
                </div>
                <div className="text-xl font-bold text-red-700 dark:text-red-300">
                  {belumAbsen}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
export default function App() {
const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const dataLoadedRef = useRef(false);
const fileInputRef = useRef(null);
const backupInputRef = useRef(null);
const ttdInputRef = useRef(null);

  const getLocalData = (key, defaultVal) => {
      try {
          const saved = localStorage.getItem(key);
          if (saved && saved !== 'undefined' && saved !== 'null') {
              const parsed = JSON.parse(saved);
              if (Array.isArray(defaultVal) && !Array.isArray(parsed)) return defaultVal;
              if (!Array.isArray(defaultVal) && typeof defaultVal === 'object' && typeof parsed !== 'object') return defaultVal;
              return parsed;
          }
      } catch(e) {}
      return defaultVal;
  };
  
  const [users, setUsers] = useState([]); 
  const [attendance, setAttendance] = useState({}); 
  const [holidays, setHolidays] = useState([]); 
  
  const [pdfConfig, setPdfConfig] = useState({
      title1: "DAFTAR HADIR SISWA",
      title2: "REKAPITULASI ABSENSI BULANAN",
      ttdTempatTanggal: "Tunggul Pawenang, 23 April 2026", 
      ttdJabatan: "Kepala / Wali Kelas",
      ttdNama: "_________________________",
      ttdNip: "",
       ttdImage: null,
       ttdImageRatio: null,
       ttdImageSize: 72
  });
  
  const [appSettings, setAppSettings] = useState({
      appName: "Sistem Absensi"
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
const [selectedClass, setSelectedClass] = useState('Semua');
const [selectedPeran, setSelectedPeran] = useState('Semua');
const [selectedUsers, setSelectedUsers] = useState([]);
const [selectedDataUsers, setSelectedDataUsers] = useState([]);
const [selectedHolidayYear, setSelectedHolidayYear] = useState(new Date().getFullYear());
const [newHolidayDate, setNewHolidayDate] = useState('');
const [newHolidayName, setNewHolidayName] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState({});
  const [scanImage, setScanImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const selectedDateRef = useRef(selectedDate);
  const handleMarkAttendanceRef = useRef(null);
  const scanCooldownRef = useRef(0);
  const [userRole, setUserRole] = useState(() => {
      const saved = localStorage.getItem('absensi_userRole');
      return saved === 'admin' || saved === 'client' ? saved : null;
  });
  const [adminPassword, setAdminPassword] = useState(() => (appSettings && appSettings.adminPassword) || 'admin123');
  const [clientPassword, setClientPassword] = useState(() => (appSettings && appSettings.clientPassword) || 'client123');
  const [loginPassword, setLoginPassword] = useState({ admin: '', client: '' });
  const [loginError, setLoginError] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');

  const handleLogin = async (role) => {
      const inputPassword = loginPassword[role] || '';
      
      try {
          // Ganti port 3000 dengan port backend Anda jika berbeda
          const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role, password: inputPassword })
          });

          const data = await response.json();

          if (response.ok && data.success) {
              setUserRole(role);
              localStorage.setItem('absensi_userRole', role);
              setLoginError('');
              // Kosongkan form setelah berhasil
              setLoginPassword({ admin: '', client: '' }); 
          } else {
              setLoginError(data.message || 'Password salah. Coba lagi.');
          }
      } catch (error) {
          console.error("Error login:", error);
          setLoginError('Gagal terhubung ke server. Periksa koneksi backend.');
      }
  };

  const handleLogout = () => {
      setUserRole(null);
      localStorage.removeItem('absensi_userRole');
      setLoginPassword({ admin: '', client: '' });
      setLoginError('');
  };

  const updatePassword = (role, newPassword) => {
      if (role === 'admin') {
          setAdminPassword(newPassword);
          const newSettings = { ...(appSettings || {}), adminPassword: newPassword };
          setAppSettings(newSettings);
          saveToBackend({ appSettings: newSettings });
      } else {
          setClientPassword(newPassword);
          const newSettings = { ...(appSettings || {}), clientPassword: newPassword };
          setAppSettings(newSettings);
          saveToBackend({ appSettings: newSettings });
      }
      showToastMessage('Password berhasil diperbarui.', 'success');
  };

const handleMarkAttendance = async (id, status) => {
    const currentDate = selectedDateRef.current;
    let isSuccess = false;

    setAttendance(prev => {
        const prevData = prev || {};
        const todayData = prevData[currentDate] || {};
        
        const newData = {
            ...prevData,
            [currentDate]: {
                ...todayData,
                [id]: status
            }
        };
        
        // Simpan otomatis ke backend/database
        saveToBackend({ attendance: newData });
        isSuccess = true;
        return newData;
    });

    return isSuccess;
  };

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
      handleMarkAttendanceRef.current = handleMarkAttendance;
  });

  useEffect(() => {
      if (appSettings && appSettings.adminPassword) setAdminPassword(appSettings.adminPassword);
      if (appSettings && appSettings.clientPassword) setClientPassword(appSettings.clientPassword);
  }, [appSettings]);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeHolidays = Array.isArray(holidays) ? holidays : [];
  const safeAttendance = (attendance && typeof attendance === 'object' && !Array.isArray(attendance)) ? attendance : {};

  const dataRef = useRef({ users: safeUsers, attendance: safeAttendance, holidays: safeHolidays, pdfConfig, appSettings });
  useEffect(() => {
    dataRef.current = { users: safeUsers, attendance: safeAttendance, holidays: safeHolidays, pdfConfig, appSettings };
  }, [safeUsers, safeAttendance, safeHolidays, pdfConfig, appSettings]);

  useEffect(() => {
    if (!showScannerModal) stopCamera();
  }, [showScannerModal]);

  const loadFromBackend = async () => {
    if (dataLoadedRef.current) return null;

    try {
        const res = await fetch('/api/data');

        if (!res.ok) {
            throw new Error('Backend unavailable');
        }

        const data = await res.json();

        const loadedUsers = Array.isArray(data.users)
            ? data.users
            : [];

        const loadedAttendance =
            data.attendance &&
            typeof data.attendance === 'object' &&
            !Array.isArray(data.attendance)
                ? data.attendance
                : {};

        const loadedHolidays = Array.isArray(data.holidays)
            ? data.holidays
            : [];

        const loadedPdfConfig =
            data.pdfConfig && typeof data.pdfConfig === 'object'
                ? data.pdfConfig
                : pdfConfig;

        const loadedAppSettings =
            data.appSettings && typeof data.appSettings === 'object'
                ? data.appSettings
                : appSettings;

        // PENTING:
        // Isi dataRef sebelum proses lain melakukan penyimpanan.
        dataRef.current = {
            users: loadedUsers,
            attendance: loadedAttendance,
            holidays: loadedHolidays,
            pdfConfig: loadedPdfConfig,
            appSettings: loadedAppSettings
        };

        setUsers(loadedUsers);
        setAttendance(loadedAttendance);
        setHolidays(loadedHolidays);
        setAppSettings(loadedAppSettings);

        setPdfConfig(prev => ({
            ...(prev || {}),
            ...loadedPdfConfig
        }));

        dataLoadedRef.current = true;

        console.log('✅ Data backend berhasil dimuat:', {
            users: loadedUsers.length,
            attendanceDates: Object.keys(loadedAttendance).length,
            holidays: loadedHolidays.length
        });

        return data;

    } catch (err) {
        console.warn(
            'Backend tidak tersedia, menggunakan localStorage...',
            err
        );

        const lsUsers = getLocalData('absensi_users', []);
        const lsAttendance = getLocalData('absensi_attendance', {});
        const lsHolidays = getLocalData('absensi_holidays', []);
        const lsPdfConfig = getLocalData(
            'absensi_pdfConfig',
            pdfConfig
        );
        const lsAppSettings = getLocalData(
            'absensi_appSettings',
            appSettings
        );

        dataRef.current = {
            users: lsUsers,
            attendance: lsAttendance,
            holidays: lsHolidays,
            pdfConfig: lsPdfConfig,
            appSettings: lsAppSettings
        };

        setUsers(lsUsers);
        setAttendance(lsAttendance);
        setHolidays(lsHolidays);
        setPdfConfig(lsPdfConfig);
        setAppSettings(lsAppSettings);

        dataLoadedRef.current = true;

        return null;

    } finally {
        setIsLoadingData(false);
    }
};

  useEffect(() => {
    const initializeApp = async () => {
        const data = await loadFromBackend();

        if (data) {
            await fetchPublicHolidays();
        }
    };

    initializeApp();
}, []);

  const [showRecapModal, setShowRecapModal] = useState(false);
  const [recapType, setRecapType] = useState('month');
  const [exportCols, setExportCols] = useState({ nomorInduk: true, kelas: true, peran: false, jk: true });
  const [recapSearchQuery, setRecapSearchQuery] = useState('');
  const [recapSortByClass, setRecapSortByClass] = useState(false);
  const [recapSelectedClasses, setRecapSelectedClasses] = useState([]);
  const [recapSelectedRoles, setRecapSelectedRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [direktoriSearchQuery, setDirektoriSearchQuery] = useState('');
  const [direktoriSortByClass, setDirektoriSortByClass] = useState(false);
  const [showBulkMonthModal, setShowBulkMonthModal] = useState(false);
  const [bulkMonthStatus, setBulkMonthStatus] = useState('Hadir');
  const [confirmAction, setConfirmAction] = useState(null);

  const [recapMonth, setRecapMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bulkMonthDate, setBulkMonthDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showUserModal, setShowUserModal] = useState(false);
const [showBulkEditModal, setShowBulkEditModal] = useState(false);
const [bulkEditField, setBulkEditField] = useState('peran');
const [bulkEditValue, setBulkEditValue] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ nama: '', peran: 'Siswa', nomorInduk: '', kelas: '', jk: 'L' });

  const getFirstDayOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };
  const getLastDayOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  };
  const [recapStartDate, setRecapStartDate] = useState(getFirstDayOfMonth());
  const [recapEndDate, setRecapEndDate] = useState(getLastDayOfMonth());

  const showToastMessage = (message, type = 'success') => setToast({ message: String(message), type });

  const saveToBackend = (newData) => {
    // Jangan menyimpan sebelum data awal dari backend selesai dimuat.
    if (!dataLoadedRef.current) {
        console.warn(
            '⏳ Penyimpanan ditunda: data backend belum selesai dimuat.'
        );
        return;
    }

    const currentData = dataRef.current;

    const nextUsers =
        newData.users !== undefined
            ? newData.users
            : (currentData.users || []);

    const nextAttendance =
        newData.attendance !== undefined
            ? newData.attendance
            : (currentData.attendance || {});

    const nextHolidays =
        newData.holidays !== undefined
            ? newData.holidays
            : (currentData.holidays || []);

    const nextPdfConfig =
        newData.pdfConfig !== undefined
            ? { ...newData.pdfConfig }
            : { ...(currentData.pdfConfig || {}) };

    const nextAppSettings =
        newData.appSettings !== undefined
            ? newData.appSettings
            : (currentData.appSettings || {});

    nextPdfConfig.ttdImage = null;
    nextPdfConfig.ttdImageRatio = null;

    // Update dataRef terlebih dahulu agar data terbaru tidak hilang.
    dataRef.current = {
        users: nextUsers,
        attendance: nextAttendance,
        holidays: nextHolidays,
        pdfConfig: nextPdfConfig,
        appSettings: nextAppSettings
    };

    const payload = {
        users: nextUsers,
        attendance: nextAttendance,
        holidays: nextHolidays,
        pdfConfig: nextPdfConfig,
        appSettings: nextAppSettings
    };

    return fetch('/api/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            console.log('✅ Data berhasil disimpan ke backend.');
        })
        .catch(err => {
            console.warn(
                '⚠️ Penyimpanan latar belakang tertunda:',
                err
            );
            showToastMessage('Gagal menyimpan data ke backend. Periksa koneksi/server.', 'error');
            throw err;
        });
  };

  const generateQrForUser = async (user) => {
    const data = JSON.stringify({
      id: user.id,
      nomorInduk: user.nomorInduk,
      nama: user.nama,
      kelas: user.kelas,
      peran: user.peran,
      jk: user.jk
    });
    try {
      const url = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
      return url;
    } catch (e) {
      console.error('QR generation failed:', e);
      return null;
    }
  };

  const handleOpenCardModal = async () => {
    const urls = {};
    for (const user of safeUsers) {
      urls[user.id] = await generateQrForUser(user);
    }
    setQrCodeDataUrls(urls);
    setShowCardModal(true);
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setScannedResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
      }
      setCameraActive(true);
      const tick = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data) {
            const now = Date.now();
            if (now - scanCooldownRef.current < 2000) {
                // Cooldown aktif, hindari scan duplikat
            } else {
                console.log('[Scanner] QR decoded:', code.data);
                try {
                  const userData = JSON.parse(code.data);
                  const currentUsers = dataRef.current.users || [];
                  console.log('[Scanner] Current users count:', currentUsers.length);
                  console.log('[Scanner] QR payload:', userData);
                  const matchedUser = currentUsers.find(u => u.id === userData.id || String(u.nomorInduk) === String(userData.nomorInduk));
                  console.log('[Scanner] Matched user:', matchedUser ? matchedUser.nama : 'null');
                  if (matchedUser) {
                    scanCooldownRef.current = now;
                    setScannedResult(matchedUser);
                    const currentDate = selectedDateRef.current;
                    console.log('[Scanner] Marking attendance for date:', currentDate, 'user:', matchedUser.id);
                    if (handleMarkAttendanceRef.current) {
                      const saved = await handleMarkAttendanceRef.current(matchedUser.id, 'Hadir');
                      if (saved) {
                        showToastMessage(`QR dikenali: ${matchedUser.nama} berhasil diabsen sebagai Hadir`, 'success');
                      } else {
                        showToastMessage('Gagal menyimpan kehadiran. Coba lagi.', 'error');
                      }
                    } else {
                      showToastMessage('Gagal menyimpan kehadiran. Coba lagi.', 'error');
                    }
                    //stopCamera();
                    //return;
                  } else {
                    console.warn('[Scanner] No match found for QR data:', userData);
                  }
                } catch (err) {
                  console.error('[Scanner] JSON parse error:', err);
                }
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan.');
    }
  };

  const handleScanQrImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setScanImage(event.target.result);
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          const now = Date.now();
          if (now - scanCooldownRef.current < 2000) {
              // Cooldown aktif, hindari scan duplikat
          } else {
              console.log('[Scanner] Image QR decoded:', code.data);
              try {
                const userData = JSON.parse(code.data);
                const currentUsers = dataRef.current.users || [];
                console.log('[Scanner] Image scan - current users count:', currentUsers.length);
                console.log('[Scanner] Image scan - QR payload:', userData);
                const matchedUser = currentUsers.find(u => u.id === userData.id || String(u.nomorInduk) === String(userData.nomorInduk));
                console.log('[Scanner] Image scan - matched user:', matchedUser ? matchedUser.nama : 'null');
                if (matchedUser) {
                  scanCooldownRef.current = now;
                  setScannedResult(matchedUser);
                  if (handleMarkAttendanceRef.current) {
                    const saved = await handleMarkAttendanceRef.current(matchedUser.id, 'Hadir');
                    if (saved) {
                      showToastMessage(`QR dikenali: ${matchedUser.nama} berhasil diabsen sebagai Hadir`, 'success');
                    } else {
                      showToastMessage('Gagal menyimpan kehadiran. Coba lagi.', 'error');
                    }
                  } else {
                    showToastMessage('Gagal menyimpan kehadiran. Coba lagi.', 'error');
                  }
                } else {
                  showToastMessage("Data QR tidak ditemukan di sistem.", 'error');
                }
              } catch (err) {
                console.error('[Scanner] Image scan - JSON parse error:', err);
                showToastMessage("Format QR tidak valid.", 'error');
              }
          }
        } else {
          showToastMessage("Tidak dapat membaca QR code. Pastikan gambar jelas.", 'error');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePrintCards = () => {
    window.print();
  };

  const fetchPublicHolidays = async (year) => {
    const targetYear = year || new Date().getFullYear();
    try {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${targetYear}/ID`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const formattedHolidays = data.map(h => ({ date: h.date, name: h.localName, type: 'auto' }));
          setHolidays(prev => {
            const sp = Array.isArray(prev) ? prev : Object.values(prev || {});
            const manualHolidays = sp.filter(p => p && p.type === 'manual');
            const autoDates = new Set(manualHolidays.map(m => m.date));
            const newAuto = formattedHolidays.filter(h => !autoDates.has(h.date));
            const merged = [...manualHolidays, ...newAuto];
            saveToBackend({ holidays: merged });
            return merged;
          });
        }
      }
    } catch (error) {}
  };

  const formatDateIndo = (dateString) => {
    if (!dateString) return '-';
    try {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (e) {
        return String(dateString);
    }
  };

  const isHoliday = (dateString) => {
    if (!dateString) return { isHoliday: false, name: '' };
    const day = new Date(dateString).getDay();
    if (day === 0) return { isHoliday: true, name: 'Hari Minggu' }; 
    const holiday = safeHolidays.find(h => h && h.date === dateString);
    if (holiday) return { isHoliday: true, name: String(holiday.name || 'Libur') };
    return { isHoliday: false, name: '' };
  };

  const handleBackupData = () => {
    const dataToBackup = { users: safeUsers, attendance: safeAttendance, holidays: safeHolidays, pdfConfig, appSettings };
    const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Absensi_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMessage("Data berhasil dicadangkan.", "success");
  };

  const handleRestoreData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.users && Array.isArray(parsed.users)) setUsers(parsed.users);
        if (parsed.attendance && typeof parsed.attendance === 'object') setAttendance(parsed.attendance);
        if (parsed.holidays && Array.isArray(parsed.holidays)) setHolidays(parsed.holidays);
        if (parsed.pdfConfig && typeof parsed.pdfConfig === 'object') setPdfConfig(parsed.pdfConfig);
        if (parsed.appSettings && typeof parsed.appSettings === 'object') setAppSettings(parsed.appSettings);
        saveToBackend(parsed);
        showToastMessage("Data berhasil dipulihkan.", "success");
      } catch(err) {
        showToastMessage("File backup tidak valid.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTtdUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const originalRatio = img.width / img.height;
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 400; 
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const compressedDataUrl = canvas.toDataURL('image/png'); 
               const newPdfConfig = {...(pdfConfig || {}), ttdImage: compressedDataUrl, ttdImageRatio: originalRatio};
               setPdfConfig(newPdfConfig);
               saveToBackend({ pdfConfig: newPdfConfig });
               showToastMessage("Tanda tangan terpasang.", "success");
          };
          img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const handlePdfConfigChange = (key, value) => {
      const newPdfConfig = {...(pdfConfig || {}), [key]: value};
      setPdfConfig(newPdfConfig);
      saveToBackend({ pdfConfig: newPdfConfig });
  };

  const renderAbsensi = () => {
    const holidayInfo = isHoliday(selectedDate);
    const availableClasses = ['Semua', ...new Set(safeUsers.map(u => String(u?.kelas || '')).filter(k => k && k !== '-'))].sort();
    
    const filteredUsers = safeUsers.filter(u => {
        if (!u) return false;
        const matchClass = selectedClass === 'Semua' || String(u.kelas || '').toLowerCase() === String(selectedClass).toLowerCase();
        const matchPeran = selectedPeran === 'Semua' || String(u.peran || '').toLowerCase() === String(selectedPeran).toLowerCase();
        const matchSearch = !searchQuery.trim() || String(u.nama || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) || String(u.nomorInduk || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
        return matchClass && matchPeran && matchSearch;
    });

    const isClient = userRole === 'client';
    const isAdmin = userRole === 'admin';

    const handleMarkAttendance = async (userId, status) => {
        const currentAttendance = dataRef.current.attendance || {};
        const currentDate = selectedDateRef.current;
        const newAttendance = {
            ...currentAttendance,
            [currentDate]: { ...(currentAttendance[currentDate] || {}), [userId]: status }
        };
        setAttendance(newAttendance);
        try {
            await saveToBackend({ attendance: newAttendance });
            return true;
        } catch (err) {
            console.error('Gagal menyimpan kehadiran:', err);
            return false;
        }
    };

    const handleBulkMarkAttendance = (status) => {
        if (selectedUsers.length === 0) return;
        const newDateData = { ...(safeAttendance[selectedDate] || {}) };
        selectedUsers.forEach(userId => { newDateData[userId] = status; });
        const newAttendance = { ...safeAttendance, [selectedDate]: newDateData };
        setAttendance(newAttendance);
        saveToBackend({ attendance: newAttendance });
        showToastMessage(`Berhasil menandai ${selectedUsers.length} data sebagai ${status}`, 'success');
        setSelectedUsers([]);
    };

    const executeBulkMonthAttendance = () => {
        const targetUsers = selectedUsers.length > 0 ? filteredUsers.filter(u => selectedUsers.includes(u.id)) : filteredUsers;
        if (targetUsers.length === 0) { showToastMessage("Tidak ada data untuk diabsen.", "error"); return; }
        if (!bulkMonthDate) { showToastMessage("Pilih bulan terlebih dahulu.", "error"); return; }
        
        let year, month;
        if (bulkMonthDate.includes('-')) {
            const parts = bulkMonthDate.split('-');
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
        } else {
            const d = new Date(bulkMonthDate);
            year = d.getFullYear();
            month = d.getMonth() + 1;
        }

        if (isNaN(year) || isNaN(month)) {
            showToastMessage("Format bulan tidak valid.", "error");
            return;
        }

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        
        const nextAttendance = { ...safeAttendance };
        let curr = new Date(start);
        curr.setHours(12, 0, 0, 0); 
        const endD = new Date(end);
        endD.setHours(12, 0, 0, 0);

        while (curr <= endD) {
            const yyyy = curr.getFullYear();
            const mm = String(curr.getMonth() + 1).padStart(2, '0');
            const dd = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            if (!isHoliday(dateStr).isHoliday) {
                if (!nextAttendance[dateStr]) nextAttendance[dateStr] = {};
                targetUsers.forEach(u => { nextAttendance[dateStr][u.id] = bulkMonthStatus; });
            }
            curr.setDate(curr.getDate() + 1);
        }

        setAttendance(nextAttendance);
        saveToBackend({ attendance: nextAttendance });
        setShowBulkMonthModal(false);
        setSelectedUsers([]);
        showToastMessage(`Berhasil mengisi ${bulkMonthStatus} 1 bulan penuh.`, 'success');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Hadir': return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-emerald-600/30 dark:ring-emerald-500/30 ring-inset ring-1 font-bold';
            case 'Izin': return 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 ring-sky-600/30 dark:ring-sky-500/30 ring-inset ring-1 font-bold';
            case 'Sakit': return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 ring-amber-600/30 dark:ring-amber-500/30 ring-inset ring-1 font-bold';
            case 'Alpha': return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 ring-rose-600/30 dark:ring-rose-500/30 ring-inset ring-1 font-bold';
            default: return 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 font-medium';
        }
    };

    const getBulkButtonColor = (status) => {
        switch (status) {
            case 'Hadir': return 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 text-white';
            case 'Izin': return 'bg-gradient-to-r from-sky-500 to-sky-600 shadow-sky-500/30 text-white';
            case 'Sakit': return 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/30 text-white';
            case 'Alpha': return 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30 text-white';
            default: return 'bg-slate-600 text-white';
        }
    };

    const getRangeData = () => {
        let start, end, filenameTitle;
        if (recapType === 'month') {
            const [year, month] = recapMonth.split('-');
            start = new Date(year, parseInt(month) - 1, 1);
            end = new Date(year, parseInt(month), 0); 
            filenameTitle = `Bulan_${recapMonth}`;
        } else {
            start = new Date(recapStartDate);
            end = new Date(recapEndDate);
            filenameTitle = `${recapStartDate}_sd_${recapEndDate}`;
        }
        start.setHours(12, 0, 0, 0); end.setHours(12, 0, 0, 0);
        if (start > end) return null;

        const dateRange = [];
        let curr = new Date(start);
        while (curr <= end) {
            const yyyy = curr.getFullYear();
            const mm = String(curr.getMonth() + 1).padStart(2, '0');
            const dd = String(curr.getDate()).padStart(2, '0');
            dateRange.push(`${yyyy}-${mm}-${dd}`);
            curr.setDate(curr.getDate() + 1);
        }
        return { dateRange, filenameTitle };
    };

    const getRecapUsers = () => {
        let users = [...filteredUsers];
        if (recapSearchQuery.trim()) {
            const q = recapSearchQuery.trim().toLowerCase();
            users = users.filter(u => String(u.nama || '').toLowerCase().includes(q) || String(u.nomorInduk || '').toLowerCase().includes(q));
        }
        if (recapSelectedClasses.length > 0) {
            users = users.filter(u => recapSelectedClasses.includes(String(u.kelas || '')));
        }
        if (recapSelectedRoles.length > 0) {
            users = users.filter(u => recapSelectedRoles.includes(String(u.peran || '')));
        }
        if (recapSortByClass) {
            users.sort((a, b) => {
                const ka = String(a.kelas || '').toLowerCase();
                const kb = String(b.kelas || '').toLowerCase();
                if (ka < kb) return -1;
                if (ka > kb) return 1;
                return String(a.nama || '').localeCompare(String(b.nama || ''));
            });
        }
        return users;
    };

    const executeDownloadExcel = () => {
        if (!XLSX) {
            showToastMessage("Library Excel (SheetJS) belum termuat.", 'error');
            return;
        }
        if (!safeUsers.length) { showToastMessage("Belum ada data.", 'error'); return; }
        const rangeData = getRangeData();
        if (!rangeData) { showToastMessage("Rentang tanggal tidak valid.", 'error'); return; }
        const { dateRange, filenameTitle } = rangeData;
        const holidayNames = {};
        const colOffset = 2 + (exportCols.nomorInduk?1:0) + (exportCols.kelas?1:0) + (exportCols.peran?1:0) + (exportCols.jk?1:0);

        dateRange.forEach((date, i) => {
            const hol = isHoliday(date);
            if (hol.isHoliday) {
                let shortName = String(hol.name||'').toUpperCase().replace(/HARI /g, '').replace(/\s+/g, '');
                if (shortName.includes('MINGGU')) shortName = 'MINGGU'; 
                holidayNames[colOffset + i] = shortName;
            }
        });

        const isGuruMode = String(selectedClass).toLowerCase() === 'guru' || String(selectedPeran).toLowerCase() === 'guru';
        const dataToExport = [];
        dataToExport.push([isGuruMode ? "DAFTAR HADIR GURU" : String(pdfConfig?.title1 || "")]);
        dataToExport.push([String(pdfConfig?.title2 || "")]);
        
        let subtitleText = isGuruMode ? "Guru" : `Kelas : ${selectedClass} | Peran : ${selectedPeran}`;
        if(selectedClass==='Semua' && selectedPeran==='Semua') subtitleText = `Semua Kelas & Peran`;
        if (recapSelectedClasses.length > 0 || recapSelectedRoles.length > 0) {
            const parts = [];
            if (recapSelectedClasses.length > 0) parts.push(`Kelas : ${recapSelectedClasses.join(', ')}`);
            if (recapSelectedRoles.length > 0) parts.push(`Peran : ${recapSelectedRoles.join(', ')}`);
            subtitleText = parts.join(' | ');
        } else if(selectedClass==='Semua' && selectedPeran==='Semua') {
            subtitleText = `Semua Kelas & Peran`;
        }
        dataToExport.push([subtitleText]);
        dataToExport.push([recapType === 'month' ? `Bulan : ${recapMonth}` : `Waktu : ${recapStartDate} s.d ${recapEndDate}`]);
        dataToExport.push([]); 

        const header = ["No", "Nama"];
        if (exportCols.jk) header.push("L/P");
        if (exportCols.nomorInduk) header.push("Nomor Induk/NIP/NUPTK");
        if (exportCols.kelas) header.push("Kelas");
        if (exportCols.peran) header.push("Peran");
        header.push(...dateRange.map(d => d.split('-')[2]), "H", "I", "S", "A");
        dataToExport.push(header);

        const recapUsers = getRecapUsers();
        recapUsers.forEach((user, index) => {
            let hadir = 0, izin = 0, sakit = 0, alpha = 0;
            const row = [index + 1, String(user.nama || '')];
            if (exportCols.jk) row.push(String(user.jk || 'L'));
            if (exportCols.nomorInduk) row.push(String(user.nomorInduk || ''));
            if (exportCols.kelas) row.push((String(user.peran).toLowerCase()==='guru'||String(user.peran).toLowerCase()==='staff') ? '-' : String(user.kelas || ''));
            if (exportCols.peran) row.push(String(user.peran || ''));

            dateRange.forEach((date, dateIdx) => {
                const colIdx = colOffset + dateIdx;
                if (holidayNames[colIdx]) {
                    const textStr = holidayNames[colIdx];
                    const pos = index % (textStr.length + 3);
                    row.push(pos >= 1 && pos <= textStr.length ? textStr[pos - 1] : '');
                } else {
                    const st = (safeAttendance[date] || {})[user.id];
                    row.push(st === 'Hadir' ? '✓' : st === 'Izin' ? 'I' : st === 'Sakit' ? 'S' : st === 'Alpha' ? 'A' : '');
                    if(st==='Hadir') hadir++; else if(st==='Izin') izin++; else if(st==='Sakit') sakit++; else if(st==='Alpha') alpha++;
                }
            });
            row.push(hadir, izin, sakit, alpha);
            dataToExport.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap");
        XLSX.writeFile(wb, `Rekap_Absen_${filenameTitle}.xlsx`);
        setShowRecapModal(false); 
        showToastMessage("Excel berhasil diunduh.", 'success');
    };

    const executeDownloadPdf = () => {
        if (!jsPDF) {
            showToastMessage("Library PDF (jsPDF) belum termuat.", 'error');
            return;
        }
        if (!safeUsers.length) { showToastMessage("Belum ada data.", 'error'); return; }
        const rangeData = getRangeData();
        if (!rangeData) { showToastMessage("Rentang tanggal tidak valid.", 'error'); return; }
        const { dateRange, filenameTitle } = rangeData;

        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const isGuruMode = String(selectedClass).toLowerCase() === 'guru' || String(selectedPeran).toLowerCase() === 'guru';

        doc.setFontSize(14); doc.setFont("helvetica", "bold");
        doc.text(isGuruMode ? "DAFTAR HADIR GURU" : String(pdfConfig?.title1 || ""), pageWidth / 2, 12, { align: 'center' });
        doc.setFontSize(11); doc.text(String(pdfConfig?.title2 || ""), pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        
        let pdfSubtitle = isGuruMode ? "Guru" : `Kelas : ${selectedClass} | Peran : ${selectedPeran}`;
        if(selectedClass==='Semua' && selectedPeran==='Semua') pdfSubtitle = `Semua Kelas & Peran`;
        if (recapSelectedClasses.length > 0 || recapSelectedRoles.length > 0) {
            const parts = [];
            if (recapSelectedClasses.length > 0) parts.push(`Kelas : ${recapSelectedClasses.join(', ')}`);
            if (recapSelectedRoles.length > 0) parts.push(`Peran : ${recapSelectedRoles.join(', ')}`);
            pdfSubtitle = parts.join(' | ');
        } else if(selectedClass==='Semua' && selectedPeran==='Semua') {
            pdfSubtitle = `Semua Kelas & Peran`;
        }
        doc.text(pdfSubtitle, 10, 26);
        doc.text(recapType === 'month' ? `Bulan  : ${recapMonth}` : `Waktu  : ${recapStartDate} s.d ${recapEndDate}`, 10, 31);

        const colOffset = 2 + (exportCols.nomorInduk?1:0) + (exportCols.kelas?1:0) + (exportCols.peran?1:0) + (exportCols.jk?1:0);
        const holidayNames = {};
        dateRange.forEach((d, i) => {
            const hol = isHoliday(d);
            if (hol.isHoliday) {
                let shortName = String(hol.name||'').toUpperCase().replace(/HARI /g, '').replace(/\s+/g, '');
                if (shortName.includes('MINGGU')) shortName = 'MINGGU'; 
                holidayNames[colOffset + i] = shortName;
            }
        });

        const head = [["No", "Nama"]];
        if (exportCols.jk) head[0].push("L/P");
        if (exportCols.nomorInduk) head[0].push("Induk/NIP");
        if (exportCols.kelas) head[0].push("Kelas");
        if (exportCols.peran) head[0].push("Peran");
        head[0].push(...dateRange.map(d => d.split('-')[2]), "H", "I", "S", "A");

        const body = [];
        const recapUsers = getRecapUsers();
        recapUsers.forEach((user, index) => {
            let hadir = 0, izin = 0, sakit = 0, alpha = 0;
            const row = [index + 1, String(user.nama || '')];
            if (exportCols.jk) row.push(String(user.jk || 'L'));
            if (exportCols.nomorInduk) row.push(String(user.nomorInduk || ''));
            if (exportCols.kelas) row.push((String(user.peran).toLowerCase()==='guru'||String(user.peran).toLowerCase()==='staff') ? '-' : String(user.kelas || ''));
            if (exportCols.peran) row.push(String(user.peran || ''));

            dateRange.forEach(date => {
                if (isHoliday(date).isHoliday) row.push('__HOLIDAY__');
                else {
                    const st = (safeAttendance[date] || {})[user.id];
                    row.push(st === 'Hadir' ? '__HADIR__' : st === 'Izin' ? 'I' : st === 'Sakit' ? 'S' : st === 'Alpha' ? 'A' : '');
                    if(st==='Hadir') hadir++; else if(st==='Izin') izin++; else if(st==='Sakit') sakit++; else if(st==='Alpha') alpha++;
                }
            });
            row.push(hadir, izin, sakit, alpha);
            body.push(row);
        });

        let usedWidth = 8 + (exportCols.jk?7:0) + (exportCols.nomorInduk?15:0) + (exportCols.kelas?10:0) + (exportCols.peran?10:0) + (dateRange.length * 4.2) + 24;
        const colStyles = { 0: { halign: 'center', cellWidth: 8 }, 1: { halign: 'left', cellWidth: Math.max(277 - usedWidth, 25) } };
        let cIdx = 2;
        if(exportCols.jk) colStyles[cIdx++]={halign:'center',cellWidth:7};
        if(exportCols.nomorInduk) colStyles[cIdx++]={halign:'center',cellWidth:15};
        if(exportCols.kelas) colStyles[cIdx++]={halign:'center',cellWidth:10};
        if(exportCols.peran) colStyles[cIdx++]={halign:'center',cellWidth:10};
        dateRange.forEach(()=>colStyles[cIdx++]={halign:'center',cellWidth:4.2});
        colStyles[cIdx++]={halign:'center',cellWidth:6,fontStyle:'bold'}; colStyles[cIdx++]={halign:'center',cellWidth:6,fontStyle:'bold'};
        colStyles[cIdx++]={halign:'center',cellWidth:6,fontStyle:'bold'}; colStyles[cIdx++]={halign:'center',cellWidth:6,fontStyle:'bold'};

        let drawnHolidays = {};
        autoTable(doc, {
            startY: 36, margin: { left: 10, right: 10 }, head: head, body: body, theme: 'grid',
            styles: { fontSize: 7.5, halign: 'center', cellPadding: 0.8, textColor: [40,40,40], lineColor: [200,200,200], lineWidth: 0.1 },
            headStyles: { fillColor: [248, 250, 252], textColor: [15,23,42], fontStyle: 'bold' },
            columnStyles: colStyles,
            didParseCell: (data) => {
                if (data.section === 'body') {
                    if (data.cell.raw === '__HADIR__') data.cell.text = '';
                    else if (data.cell.raw === '__HOLIDAY__') { data.cell.text = ''; data.cell.styles.fillColor = [241, 245, 249]; }
                }
            },
            willDrawCell: (data) => {
                if (data.section === 'body' && data.cell.raw === '__HOLIDAY__') {
                    if (!drawnHolidays[data.column.index]) drawnHolidays[data.column.index] = { x: data.cell.x + data.cell.width / 2, startY: data.cell.y, endY: data.cell.y + data.cell.height };
                    else drawnHolidays[data.column.index].endY = data.cell.y + data.cell.height;
                }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.cell.raw === '__HADIR__') {
                    const cx = data.cell.x + data.cell.width / 2, cy = data.cell.y + data.cell.height / 2;
                    doc.setDrawColor(34, 197, 94); doc.setLineWidth(0.5);
                    doc.line(cx - 1.2, cy + 0.5, cx - 0.2, cy + 1.5); doc.line(cx - 0.2, cy + 1.5, cx + 1.5, cy - 1.5);
                }
            },
            didDrawPage: () => {
                doc.setFontSize(7); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold");
                Object.keys(drawnHolidays).forEach(colIndex => {
                    const info = drawnHolidays[colIndex], textStr = holidayNames[colIndex];
                    const spacing = (info.endY - info.startY) / (textStr.length + 1);
                    for (let i = 0; i < textStr.length; i++) doc.text(textStr[i], info.x, info.startY + spacing * (i + 1), { align: 'center', baseline: 'middle' });
                });
                drawnHolidays = {};
            }
        });

        const ttdX = pageWidth - 70, ttdY = (doc.autoTable?.previous?.finalY || doc.lastAutoTable?.finalY || 36) + 12;
        doc.setFontSize(10); doc.setTextColor(0,0,0);
        doc.text(String(pdfConfig?.ttdTempatTanggal || ""), ttdX, ttdY);
        doc.text("Mengetahui,", ttdX, ttdY + 5);
        doc.text(String(pdfConfig?.ttdJabatan || ""), ttdX, ttdY + 10);
        if (pdfConfig?.ttdImage) {
            try {
                const ttdWidth = pdfConfig.ttdImageSize || 72;
                doc.addImage(pdfConfig.ttdImage, 'PNG', ttdX - 18, ttdY - 4, ttdWidth, ttdWidth / (pdfConfig.ttdImageRatio || 1.5));
            } catch(e){ console.error('Gagal menambahkan gambar TTD ke PDF:', e); }
        }
        doc.setFont("helvetica", "bold");
        doc.text(String(pdfConfig?.ttdNama || ""), ttdX, ttdY + 28);
        doc.setFont("helvetica", "normal");
        if (pdfConfig?.ttdNip) doc.text(`NIP. ${pdfConfig.ttdNip}`, ttdX, ttdY + 33);

        doc.save(`Rekap_Absen_${filenameTitle}.pdf`);
        setShowRecapModal(false); 
        showToastMessage("PDF berhasil diunduh.", 'success');
    };

    return (
      <div className="space-y-6 relative">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
              <div className="text-left">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight text-left">Pencatatan Kehadiran</h2>
                  <p className="text-slate-700 text-sm mt-1 text-left">Atur filter di bawah untuk memuat daftar peserta.</p>
              </div>
              
               <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                   <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 shadow-sm grow xl:grow-0">
                       <div className="flex items-center gap-2 px-3 border-r border-slate-300/50">
                           <i className="fas fa-search text-indigo-500"></i>
                           <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama / induk..." className="bg-transparent border-none focus:ring-0 text-slate-700 font-semibold outline-none cursor-pointer w-full text-sm" />
                       </div>
                       <div className="flex items-center gap-2 px-3 border-r border-slate-300/50">
                           <i className="fas fa-user-tag text-indigo-500"></i>
                           <select value={selectedPeran} onChange={(e) => setSelectedPeran(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-700 font-semibold outline-none cursor-pointer w-full">
                               <option value="Semua">Semua Peran</option><option value="Siswa">Siswa</option><option value="Guru">Guru</option><option value="Staff">Staff</option>
                           </select>
                       </div>
                       <div className="flex items-center gap-2 px-3 border-r border-slate-300/50">
                           <i className="fas fa-filter text-indigo-500"></i>
                           <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-700 font-semibold outline-none cursor-pointer w-full">
                               {availableClasses.map(c => <option key={c} value={c}>{c === 'Semua' ? 'Semua Kelas' : (!String(c).toLowerCase().includes('kelas') ? `Kelas ${c}` : c)}</option>)}
                           </select>
                       </div>
                       <div className="flex items-center gap-2 px-3">
                           <i className="fas fa-calendar text-indigo-500"></i>
                           <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-700 font-semibold outline-none cursor-pointer w-full" />
                       </div>
                   </div>

                    <div className="flex gap-2 w-full xl:w-auto justify-end">
                        {isAdmin && (
                             <button onClick={() => setShowBulkMonthModal(true)} className="flex-1 xl:flex-none items-center justify-center gap-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 px-5 py-2.5 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-sm font-semibold text-sm">
                                <i className="fas fa-calendar-check"></i> <span>Isi Sebulan</span>
                            </button>
                        )}
                        <button onClick={() => setShowScannerModal(true)} className="flex-1 xl:flex-none items-center justify-center gap-2 bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 px-5 py-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all shadow-sm font-semibold text-sm">
                            <i className="fas fa-qrcode"></i> <span>Scan QR</span>
                        </button>
                        {isAdmin && (
                            <button onClick={() => setShowRecapModal(true)} className="flex-1 xl:flex-none items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 font-semibold text-sm">
                                <i className="fas fa-download"></i> <span>Unduh Rekap</span>
                            </button>
                        )}
                    </div>
              </div>
          </div>

           {holidayInfo.isHoliday && (
               <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/50 border border-sky-100 dark:border-sky-800 p-5 rounded-3xl flex items-center gap-4 shadow-sm animate-fade-in-up">
                   <div className="bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                       <i className="fas fa-calendar-star text-2xl"></i>
                   </div>
                   <div>
                       <h3 className="font-bold text-sky-900 dark:text-sky-200 tracking-tight text-left">Hari Libur Nasional / Terjadwal</h3>
                       <p className="text-sky-700 dark:text-sky-300 text-sm mt-0.5 text-left">Tanggal <b>{formatDateIndo(selectedDate)}</b> ditandai sebagai libur: <strong>{holidayInfo.name}</strong></p>
                   </div>
               </div>
           )}

           {isAdmin && selectedUsers.length > 0 && !holidayInfo.isHoliday && (
              <div className="bg-slate-900 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up sticky top-24 z-20 mx-2">
                  <div className="flex items-center gap-3 text-white px-2">
                      <div className="bg-indigo-500/20 text-indigo-300 w-8 h-8 rounded-full flex items-center justify-center font-bold">{selectedUsers.length}</div>
                      <span className="font-medium text-sm tracking-wide">Data Terpilih</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-400 mr-2">Aksi Massal:</span>
                      {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(opt => (
                          <button key={`bulk-${opt}`} onClick={() => handleBulkMarkAttendance(opt)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-sm ${getBulkButtonColor(opt)}`}>
                              {opt}
                          </button>
                      ))}
                  </div>
              </div>
          )}

           {safeUsers.length === 0 ? (
               <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                   <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                       <i className="fas fa-users-slash text-4xl text-slate-300 dark:text-slate-600"></i>
                   </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Sistem Masih Kosong</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm">Silakan unggah data Siswa dan Guru melalui menu Direktori terlebih dahulu.</p>
                    {isAdmin && (
                        <button onClick={() => setActiveTab('data')} className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                            Masuk ke Direktori <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    )}
               </div>
           ) : filteredUsers.length === 0 ? (
               <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-5">
                       <i className="fas fa-search text-3xl text-slate-300 dark:text-slate-600"></i>
                   </div>
                   <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Data Tidak Ditemukan</h3>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">Tidak ada entri yang cocok dengan filter kelas/peran Anda.</p>
               </div>
           ) : (
               <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                   <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {isAdmin && (
                                        <th className="p-5 w-16 text-center">
                                            <input type="checkbox" disabled={holidayInfo.isHoliday} checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                                onChange={(e) => setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : [])}
                                                className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all" />
                                        </th>
                                    )}
                                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">Identitas Lengkap</th>
                                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider w-32">Kelas</th>
                                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider w-32">Peran</th>
                                    {isAdmin && (
                                        <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center w-[340px]">Tandai Kehadiran</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredUsers.map(user => {
                                    const status = (safeAttendance[selectedDate] || {})[user.id] || 'Belum diisi';
                                    const isSelected = selectedUsers.includes(user.id);
                                    return (
                                        <tr key={user.id} className={`transition-all duration-200 ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50'}`}>
                                            {isAdmin && (
                                                <td className="p-5 text-center">
                                                    <input type="checkbox" disabled={holidayInfo.isHoliday} checked={isSelected}
                                                        onChange={(e) => {
                                                            if(e.target.checked) setSelectedUsers(p => [...p, user.id]);
                                                            else setSelectedUsers(p => p.filter(id => id !== user.id));
                                                        }} className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all" />
                                                </td>
                                            )}
                                            <td className="p-5 text-left" {...(isAdmin ? { onClick: () => !holidayInfo.isHoliday && document.getElementById(`chk-${user.id}`).click() } : {})}>
                                               <div className="font-bold text-slate-800 dark:text-slate-100 text-[15px] cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left">
                                                   {String(user.nama || '')} 
                                                   <span className="inline-flex ml-2 items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full w-5 h-5 text-[10px] font-bold">
                                                       {String(user.jk || 'L')}
                                                   </span>
                                               </div>
                                               <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium tracking-wide text-left">ID: {String(user.nomorInduk || '-')}</div>
                                           </td>
                                           <td className="p-5 text-left">
                                               <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{(String(user.peran || '').toLowerCase() === 'guru' || String(user.peran || '').toLowerCase() === 'staff') ? '-' : String(user.kelas || '-')}</span>
                                           </td>
                                           <td className="p-5 text-left">
                                               <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-block border ${String(user.peran).toLowerCase() === 'guru' ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'}`}>{String(user.peran || '-')}</span>
                                           </td>
                                            {isAdmin ? (
                                                <td className="p-5">
                                                    <div className="flex justify-center gap-1.5 bg-slate-100/50 dark:bg-slate-700/50 p-1 rounded-xl">
                                                        {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(opt => (
                                                            <button key={opt} onClick={(e) => { e.stopPropagation(); handleMarkAttendance(user.id, opt); }} disabled={holidayInfo.isHoliday}
                                                                className={`flex-1 py-2 rounded-lg text-sm transition-all duration-200 ${status === opt ? getStatusStyle(opt) : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium'}`}>
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            ) : (
                                                <td className="p-5 text-center">
                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-block ${getStatusStyle(status)}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                            )}
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
              </div>
          )}

           {isAdmin && showBulkMonthModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
                   <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-fade-in-up my-auto border border-slate-100 dark:border-slate-700 text-left">
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                               <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"><i className="fas fa-calendar-check"></i></div>
                               Isi Sebulan
                           </h3>
                           <button onClick={() => setShowBulkMonthModal(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 flex items-center justify-center transition-all"><i className="fas fa-times text-base"></i></button>
                       </div>
                       <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed text-left">Otomatis mengisi absensi pada seluruh hari kerja dalam 1 bulan penuh. Sistem akan <strong>melewati hari minggu dan libur</strong>.</p>
                       
                       <div className="space-y-5 mb-8">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pilih Bulan</label>
                               <input type="month" value={bulkMonthDate} onChange={e => setBulkMonthDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 dark:text-slate-200" />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status Kehadiran</label>
                               <select value={bulkMonthStatus} onChange={(e) => setBulkMonthStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                                   <option value="Hadir">Hadir</option>
                                   <option value="Izin">Izin</option>
                                   <option value="Sakit">Sakit</option>
                                   <option value="Alpha">Alpha</option>
                               </select>
                           </div>
                       </div>
                       
                       <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                           <button onClick={() => setShowBulkMonthModal(false)} className="px-5 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Batal</button>
                           <button onClick={executeBulkMonthAttendance} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all">Eksekusi Otomatis</button>
                       </div>
                   </div>
              </div>
          )}

           {isAdmin && showRecapModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
                   <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-4xl p-8 animate-fade-in-up my-auto border border-slate-100 dark:border-slate-700 text-left">
                       <div className="flex justify-between items-center mb-8">
                           <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                               <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"><i className="fas fa-print"></i></div>
                               Cetak Rekap Absensi
                           </h3>
                           <button onClick={() => setShowRecapModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 flex items-center justify-center transition-all"><i className="fas fa-times text-lg"></i></button>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                           <div className="lg:col-span-2 space-y-8">
                               <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
                                   <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4"><i className="far fa-calendar-alt text-indigo-500"></i> 1. Rentang Waktu</h4>
                                   <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 shadow-sm">
                                       <button onClick={() => setRecapType('month')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${recapType==='month'?'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 shadow-sm':'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Bulanan</button>
                                       <button onClick={() => setRecapType('range')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${recapType==='range'?'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 shadow-sm':'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Kustom</button>
                                   </div>
                                   {recapType === 'month' ? (
                                       <input type="month" value={recapMonth} onChange={e => setRecapMonth(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 dark:text-slate-200" />
                                   ) : (
                                       <div className="flex gap-3">
                                           <input type="date" value={recapStartDate} onChange={e => setRecapStartDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 dark:text-slate-200" />
                                           <input type="date" value={recapEndDate} onChange={e => setRecapEndDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 dark:text-slate-200" />
                                       </div>
                                   )}
                               </div>
                               
                                 <div>
                                     <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4"><i className="fas fa-columns text-indigo-500"></i> 2. Kolom Ekstra</h4>
                                     <div className="space-y-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                         {[ {id: 'jk', label: 'Tampilkan L/P (Jenis Kelamin)'}, {id: 'nomorInduk', label: 'Tampilkan Nomor Induk/NIP/NUPTK'}, {id: 'kelas', label: 'Tampilkan Kelas'}, {id: 'peran', label: 'Tampilkan Peran'} ].map(opt => (
                                             <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                                 <input type="checkbox" checked={exportCols[opt.id]} onChange={e => setExportCols(p => ({...p, [opt.id]: e.target.checked}))} className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                 <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">{opt.label}</span>
                                             </label>
                                         ))}
                                     </div>
                                 </div>

                                  <div>
                                      <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4"><i className="fas fa-school text-indigo-500"></i> 3. Pilih Kelas</h4>
                                      <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                          <div className="flex gap-2 mb-3">
                                              <button onClick={() => setRecapSelectedClasses(availableClasses.filter(c => c !== 'Semua'))} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all">Pilih Semua</button>
                                              <button onClick={() => setRecapSelectedClasses([])} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Kosongkan</button>
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                              {availableClasses.filter(c => c !== 'Semua').map(c => (
                                                  <label key={c} className="flex items-center gap-2 cursor-pointer group">
                                                      <input type="checkbox" checked={recapSelectedClasses.includes(c)} onChange={e => setRecapSelectedClasses(prev => e.target.checked ? [...prev, c] : prev.filter(x => x !== c))} className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">{c}</span>
                                                  </label>
                                              ))}
                                          </div>
                                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{recapSelectedClasses.length === 0 ? 'Semua kelas akan dicetak.' : `${recapSelectedClasses.length} kelas dipilih.`}</p>
                                      </div>
                                  </div>

                                  <div>
                                      <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4"><i className="fas fa-user-tag text-indigo-500"></i> 4. Pilih Peran</h4>
                                      <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                          <div className="flex gap-2 mb-3">
                                              <button onClick={() => setRecapSelectedRoles(['Siswa', 'Guru', 'Staff'])} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all">Pilih Semua</button>
                                              <button onClick={() => setRecapSelectedRoles([])} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Kosongkan</button>
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                              {['Siswa', 'Guru', 'Staff'].map(r => (
                                                  <label key={r} className="flex items-center gap-2 cursor-pointer group">
                                                      <input type="checkbox" checked={recapSelectedRoles.includes(r)} onChange={e => setRecapSelectedRoles(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))} className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">{r}</span>
                                                  </label>
                                              ))}
                                          </div>
                                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{recapSelectedRoles.length === 0 ? 'Semua peran akan dicetak.' : `${recapSelectedRoles.length} peran dipilih.`}</p>
                                      </div>
                                  </div>

                                  <div>
                                      <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4"><i className="fas fa-search text-indigo-500"></i> 5. Pencarian & Pengurutan</h4>
                                    <div className="space-y-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cari Siswa (Nama / Nomor Induk)</label>
                                            <input type="text" value={recapSearchQuery} onChange={e => setRecapSearchQuery(e.target.value)} placeholder="Ketik nama atau nomor induk..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" />
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{getRecapUsers().length} dari {filteredUsers.length} data cocok.</p>
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={recapSortByClass} onChange={e => setRecapSortByClass(e.target.checked)} className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">Urutkan per Kelas (A-Z), lalu per Nama</span>
                                        </label>
                                    </div>
                                </div>
                           </div>
                           
                              <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-7 rounded-2xl">
                                  <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-5 border-b border-slate-200 dark:border-slate-700 pb-4"><i className="fas fa-file-signature text-indigo-500"></i> 6. Format Surat PDF</h4>
                               
                               <div className="space-y-4">
                                   <div className="grid grid-cols-1 gap-4">
                                       <div>
                                           <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Kop Utama / Judul</label>
                                           <input type="text" value={pdfConfig?.title1 || ""} onChange={e => handlePdfConfigChange('title1', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" />
                                       </div>
                                       <div>
                                           <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sub Judul Laporan</label>
                                           <input type="text" value={pdfConfig?.title2 || ""} onChange={e => handlePdfConfigChange('title2', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" />
                                       </div>
                                   </div>
                                   
                                   <div>
                                       <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tempat & Tanggal Surat</label>
                                       <input type="text" value={pdfConfig?.ttdTempatTanggal || ""} onChange={e => handlePdfConfigChange('ttdTempatTanggal', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" placeholder="Tunggul Pawenang, 20 April 2026" />
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-4">
                                       <div>
                                           <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Jabatan Penandatangan</label>
                                           <input type="text" value={pdfConfig?.ttdJabatan || ""} onChange={e => handlePdfConfigChange('ttdJabatan', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" placeholder="Kepala Madrasah" />
                                       </div>
                                       <div>
                                           <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama Penandatangan</label>
                                           <input type="text" value={pdfConfig?.ttdNama || ""} onChange={e => handlePdfConfigChange('ttdNama', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" placeholder="Nama..." />
                                       </div>
                                   </div>
                                   
                                   <div>
                                       <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">NIP (Opsional)</label>
                                       <input type="text" value={pdfConfig?.ttdNip || ""} onChange={e => handlePdfConfigChange('ttdNip', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" />
                                   </div>
                                   
                                    <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Stempel / TTD (PNG Transparan)</label>
                                        <input type="file" accept="image/png" className="hidden" ref={ttdInputRef} onChange={handleTtdUpload} />
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => ttdInputRef.current.click()} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-2 transition-all">
                                                <i className="fas fa-upload text-indigo-500"></i> Upload Foto TTD
                                            </button>
                                            {pdfConfig?.ttdImage && <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-xl font-bold border border-emerald-100 dark:border-emerald-800"><i className="fas fa-check-circle"></i> Terpasang <button onClick={() => handlePdfConfigChange('ttdImage', null)} className="ml-2 text-rose-500"><i className="fas fa-times"></i></button></div>}
                                        </div>
                                        {pdfConfig?.ttdImage && (
                                        <div className="mt-4">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ukuran Lebar Stempel (mm)</label>
                                            <input type="number" min="30" max="200" step="1" value={pdfConfig?.ttdImageSize || 72} onChange={e => handlePdfConfigChange('ttdImageSize', parseInt(e.target.value) || 72)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-200" />
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Lebar 72mm (default), tinggi menyesuaikan otomatis.</p>
                                        </div>
                                        )}
                                    </div>
                               </div>
                           </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-8 border-t border-slate-100 dark:border-slate-700">
                           <button onClick={() => setShowRecapModal(false)} className="py-3 px-6 rounded-xl text-slate-600 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all mr-auto">Batal</button>
                           <button onClick={executeDownloadExcel} className="py-3 px-6 rounded-xl font-bold bg-[#107c41] hover:bg-[#0c5c30] text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-green-600/20">
                               <i className="fas fa-file-excel text-lg"></i> Excel
                           </button>
                           <button onClick={executeDownloadPdf} className="py-3 px-6 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20">
                               <i className="fas fa-file-pdf text-lg"></i> PDF
                           </button>
                       </div>
                  </div>
              </div>
          )}
      </div>
    );
  };

  const renderSettings = () => {
    const addManualHoliday = (e) => {
        e.preventDefault();
        if (!newHolidayDate || !newHolidayName) return;
        const currentHolidays = Array.isArray(holidays) ? holidays : [];
        if (currentHolidays.some(h => h && h.date === newHolidayDate)) {
            showToastMessage("Tanggal libur sudah ada.", 'error');
            return;
        }
        const newHolidays = [...safeHolidays, { date: newHolidayDate, name: newHolidayName, type: 'manual' }].filter(Boolean);
        setHolidays(newHolidays);
        saveToBackend({ holidays: newHolidays });
        setNewHolidayDate('');
        setNewHolidayName('');
        showToastMessage("Hari libur berhasil ditambahkan.", 'success');
    };

    const refreshHolidays = () => {
        fetchPublicHolidays(selectedHolidayYear);
        showToastMessage(`Menyinkronkan libur nasional tahun ${selectedHolidayYear}...`, 'success');
    };

    const exportHolidaysToCsv = () => {
        if (!validHolidays.length) return showToastMessage("Tidak ada data libur.", 'error');
        const headers = ['Tanggal', 'Nama', 'Tipe'];
        const rows = validHolidays.map(h => [h.date, `"${String(h.name || '').replace(/"/g, '""')}"`, h.type === 'auto' ? 'Nasional' : 'Manual']);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daftar_Libur_${selectedHolidayYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToastMessage("CSV berhasil diunduh.", 'success');
    };

    const importHolidaysFromGoogleSheets = async (e) => {
        const url = e.target.value.trim();
        if (!url) return;
        try {
            const csvUrl = url.replace(/\/edit.*$/, '/export?format=csv');
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Gagal mengambil data');
            const text = await response.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) throw new Error('File kosong');
            const newHolidays = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length >= 2) {
                    const date = cols[0].trim();
                    const name = cols[1].replace(/^"|"$/g, '').trim();
                    if (date && name) {
                        newHolidays.push({ date, name, type: 'manual' });
                    }
                }
            }
            if (!newHolidays.length) throw new Error('Tidak ada data valid');
            const merged = [...safeHolidays.filter(h => h.type === 'auto'), ...newHolidays];
            const unique = merged.filter((v, i, a) => a.findIndex(t => t.date === v.date) === i);
            setHolidays(unique);
            saveToBackend({ holidays: unique });
            showToastMessage(`${newHolidays.length} data libur berhasil diimpor.`, 'success');
        } catch (err) {
            showToastMessage("Gagal impor. Pastikan URL spreadsheet benar dan dipublikasikan.", 'error');
        }
        e.target.value = '';
    };

    const validHolidays = safeHolidays.filter(h => h && typeof h === 'object' && h.date);

    return (
        <div className="space-y-6 text-left max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><i className="fas fa-lock text-indigo-500"></i> Keamanan - Ganti Password</h3>
                {passwordChangeMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-bold">
                        {passwordChangeMessage}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password Admin Baru</label>
                        <input 
                            type="password" 
                            value={newAdminPassword} 
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Password admin baru" 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                        <button onClick={() => { if (newAdminPassword.trim()) { updatePassword('admin', newAdminPassword.trim()); setNewAdminPassword(''); } }} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl transition-all text-sm">
                            Simpan Password Admin
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password Client Baru</label>
                        <input 
                            type="password" 
                            value={newClientPassword} 
                            onChange={(e) => setNewClientPassword(e.target.value)}
                            placeholder="Password client baru" 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                        <button onClick={() => { if (newClientPassword.trim()) { updatePassword('client', newClientPassword.trim()); setNewClientPassword(''); } }} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all text-sm">
                            Simpan Password Client
                        </button>
                    </div>
                </div>
               </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><i className="fas fa-calendar-day text-indigo-500"></i> Tambah Hari Libur</h3>
                        <form onSubmit={addManualHoliday} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tanggal Libur</label>
                                <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Keterangan</label>
                                <input type="text" placeholder="Contoh: Libur Semester" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2">
                                <i className="fas fa-plus"></i> Simpan Libur
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><i className="fas fa-sync-alt text-indigo-500"></i> Sinkronisasi Libur</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tahun Libur Nasional</label>
                                <input type="number" value={selectedHolidayYear} onChange={e => setSelectedHolidayYear(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button onClick={refreshHolidays} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2">
                                <i className="fas fa-cloud-download-alt"></i> Ambil Libur Nasional
                            </button>
                            <button onClick={exportHolidaysToCsv} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                <i className="fas fa-file-csv"></i> Export CSV
                            </button>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Import dari Google Sheets</label>
                                <input type="url" placeholder="https://docs.google.com/spreadsheets/d/..." onChange={importHolidaysFromGoogleSheets} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs" />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Tempel URL spreadsheet yang sudah dipublikasikan.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><i className="fas fa-cog text-indigo-500"></i> Tampilan Aplikasi</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama Institusi / Aplikasi</label>
                                <input type="text" value={(appSettings && appSettings.appName) || ''} onChange={(e) => {
                                    const newSettings = { ...(appSettings || {}), appName: e.target.value };
                                    setAppSettings(newSettings);
                                    saveToBackend({ appSettings: newSettings });
                                }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Sistem Absensi" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-full p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
    <i className="fas fa-calendar-alt text-indigo-500"></i>
    Daftar Hari Libur Nasional & Manual
</h3>
                            <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold">Total: {validHolidays.length} Hari</span>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 max-h-[500px] pr-2 space-y-3">
                            {validHolidays.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-medium">Belum ada data hari libur.</div>
                            ) : (
                                <div className="space-y-3">
                                    {[...validHolidays].sort((a,b)=> new Date(a.date)-new Date(b.date)).map(h => (
                                        <div key={h.date} className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 flex justify-between items-center transition-all">
                                            <div className="flex items-start gap-4">
                                                 <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${h.type === 'auto' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                                                    <i className="fas fa-calendar-day text-lg"></i>
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-800 dark:text-slate-100 text-[15px]">
    {formatDateIndo(h.date)}
</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
    {String(h.name || '-')}
</p>
                                                    <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full inline-block mt-1.5 ${h.type === 'auto' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50' : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50'}`}>
                                                        {h.type === 'auto' ? 'Nasional (API)' : 'Manual'}
                                                    </span>
                                                </div>
                                            </div>
                                            {h.type === 'manual' && (
                                                <button onClick={() => {
                                                    const nh = validHolidays.filter(x => x && x.date !== h.date);
                                                    setHolidays(nh);
                                                    saveToBackend({holidays: nh});
                                                    showToastMessage("Hari libur dihapus.", "success");
                                                 }} className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-600 dark:hover:text-rose-300 flex items-center justify-center transition-all" title="Hapus Libur">
                                                    <i className="fas fa-trash text-sm"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Cadangkan & Pulihkan Sistem</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Amankan seluruh data absensi dan pegawai ke format file JSON.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleBackupData} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                        <i className="fas fa-download"></i> Backup JSON
                    </button>
                    <input type="file" accept=".json" className="hidden" ref={backupInputRef} onChange={handleRestoreData} />
                    <button onClick={() => backupInputRef.current.click()} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                        <i className="fas fa-upload"></i> Restore JSON
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900">
        {!userRole ? (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl p-8 w-full max-w-md text-center border border-slate-100 dark:border-slate-700">

                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-3xl flex items-center justify-center mx-auto">
    <img
        src={defaultLogoUrl}
        alt="Logo"
        className="w-16 h-16 object-contain"
    />
</div>

                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                        Sistem Absensi
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Masuk dengan password untuk melanjutkan.
                    </p>

                    {loginError && (
                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-bold">
                            {loginError}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password Admin</label>
                            <input 
                                type="password" 
                                value={loginPassword.admin} 
                                onChange={(e) => setLoginPassword(p => ({...p, admin: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin('admin')}
                                placeholder="Masukkan password admin" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                        </div>
                        <button onClick={() => handleLogin('admin')} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-2xl font-bold text-base shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2">
                            <i className="fas fa-user-cog"></i> Masuk sebagai Admin
                        </button>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>
                        
                        <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password Client</label>
                            <input 
                                type="password" 
                                value={loginPassword.client} 
                                onChange={(e) => setLoginPassword(p => ({...p, client: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin('client')}
                                placeholder="Masukkan password client" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" 
                            />
                        </div>
                        <button onClick={() => handleLogin('client')} className="w-full bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-2xl font-bold text-base hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all flex items-center justify-center gap-2">
                            <i className="fas fa-user"></i> Masuk sebagai Client
                        </button>
                    </div>
                    
                </div>
            </div>
        ) : (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900">
        <header className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-700/80 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 pb-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                              <img src={defaultLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
    {String((appSettings && appSettings.appName) || "Sistem Absensi")}
</h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${userRole === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            <i className={`fas ${userRole === 'admin' ? 'fa-user-cog' : 'fa-user'} mr-1`}></i>
                            {userRole === 'admin' ? 'Admin' : 'Client'}
                        </span>

                        {/* Tombol Dark / Light Mode */}
<button
    onClick={() => setDarkMode(!darkMode)}
    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200
               dark:bg-slate-700 dark:hover:bg-slate-600
               text-slate-600 dark:text-yellow-300
               flex items-center justify-center transition-all"
    title={darkMode ? 'Light Mode' : 'Dark Mode'}
>
    <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
</button>

{/* Tombol Keluar */}
<button
    onClick={handleLogout}
    className="text-xs bg-slate-100 hover:bg-slate-200
               dark:bg-slate-700 dark:hover:bg-slate-600
               text-slate-600 dark:text-slate-200
               px-3 py-2 rounded-xl font-bold transition-all
               flex items-center gap-1"
>
    <i className="fas fa-sign-out-alt"></i> Keluar
</button>
                    </div>
                    
                    <nav className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto no-scrollbar shadow-inner">
                        {[
 { id: 'dashboard', icon: 'fa-home', label: 'Dashboard' },                            
{ id: 'absensi', icon: 'fa-clipboard-check', label: 'Absensi' },
                            ...(userRole === 'admin' ? [
                                { id: 'data', icon: 'fa-address-book', label: 'Direktori' },
                                { id: 'settings', icon: 'fa-sliders-h', label: 'Sistem' },
                            ] : []),
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-2 py-2 px-5 rounded-xl font-bold text-[13px] transition-all duration-300 whitespace-nowrap ${
                                    activeTab === tab.id
    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                }`}>
                                <i className={`fas ${tab.icon} text-sm ${activeTab===tab.id?'opacity-100':'opacity-60'}`}></i> {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            {isLoadingData ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-bold text-lg">Memuat data dari server...</p>
                </div>
            ) : (
                <>
{activeTab === 'dashboard' && (
  <Dashboard
    users={users}
    attendance={attendance}
    selectedDate={selectedDate}
    setSelectedDate={setSelectedDate}
  />
)}
                    {activeTab === 'absensi' && renderAbsensi()}
                    {activeTab === 'data' && userRole === 'admin' && (
                <div className="space-y-6 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 text-3xl"><i className="fas fa-users"></i></div>
                            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{safeUsers.length}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Total Data Terdaftar</p>
                       <button onClick={() => {
                                setEditingUserId(null);
                                setUserForm({ nama: '', peran: 'Siswa', nomorInduk: '', kelas: '', jk: 'L' });
                                setShowUserModal(true);
                            }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl hover:bg-indigo-700 transition-all text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2">
                                <i className="fas fa-user-plus"></i> Tambah Manual
                            </button>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950/50 rounded-2xl flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 text-3xl"><i className="fas fa-qrcode"></i></div>
                            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Kartu Pelajar</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 text-sm">Generate QR Code untuk setiap siswa sebagai kartu pelajar.</p>
                            <button onClick={handleOpenCardModal} disabled={safeUsers.length === 0} className="bg-violet-600 text-white px-5 py-2.5 rounded-2xl hover:bg-violet-700 transition-all text-sm font-bold shadow-md shadow-violet-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <i className="fas fa-id-card"></i> Lihat Kartu Pelajar
                            </button>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2"><i className="fas fa-file-excel text-emerald-600 dark:text-emerald-400"></i> Upload Data Massal</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Unggah file Excel dari EMIS/Simpatika atau gunakan template kami. Sistem otomatis memilah kolom.</p>
                            </div>
                            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                    try {
                                        const data = new Uint8Array(evt.target.result);
                                        const workbook = XLSX.read(data, { type: 'array' });
                                        let allNewUsersRaw = [];
                                        workbook.SheetNames.forEach(sheetName => {
                                            const worksheet = workbook.Sheets[sheetName];
                                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                                        if (jsonData.length > 0) {
                                            const sheetUsers = jsonData.map((row, index) => {
                                                const keys = Object.keys(row);
                                                const cleanKeys = keys.map(k => String(k).trim().toLowerCase());
                                                const namaIdx = cleanKeys.findIndex(k => k.includes('nama lengkap') || k.includes('nama siswa') || k === 'nama');
                                                const kelasIdx = cleanKeys.findIndex(k => k.includes('tingkat - rombel') || k.includes('rombel') || k.includes('kelas'));
                                                const noIdx = cleanKeys.findIndex(k => k === 'nisn' || k === 'nik' || k.includes('induk') || k.includes('nip') || k.includes('nuptk'));
                                                const jkIdx = cleanKeys.findIndex(k => k === 'jenis kelamin' || k === 'jk' || k.includes('l/p'));
                                                const peranIdx = cleanKeys.findIndex(k => k.includes('peran') || k.includes('status pegawai') || k.includes('jenis ptk'));

                                                const namaKey = namaIdx >= 0 ? keys[namaIdx] : keys[1];
                                                const kelasKey = kelasIdx >= 0 ? keys[kelasIdx] : null;
                                                const noKey = noIdx >= 0 ? keys[noIdx] : keys[2];
                                                const jkKey = jkIdx >= 0 ? keys[jkIdx] : null;
                                                const peranKey = peranIdx >= 0 ? keys[peranIdx] : null;

                                                let peranValue = 'Siswa';
                                                if (peranKey && row[peranKey]) {
                                                    const p = String(row[peranKey]).toLowerCase();
                                                    if(p.includes('guru')) peranValue = 'Guru';
                                                    else if(p.includes('staff') || p.includes('staf')) peranValue = 'Staff';
                                                }
                                                let jkValue = 'L';
                                                if (jkKey && row[jkKey]) {
                                                    const j = String(row[jkKey]).toLowerCase().trim();
                                                    if(j.startsWith('p') || j === 'perempuan') jkValue = 'P';
                                                    else if (j.startsWith('l') || j === 'laki-laki') jkValue = 'L';
                                                }
                                                let kelasValue = row[kelasKey] ? String(row[kelasKey]).trim() : sheetName;
                                                if (peranValue === 'Guru' || peranValue === 'Staff') kelasValue = '-';

                                                return {
                                                    id: `usr_${Date.now()}_${sheetName.replace(/\s+/g, '')}_${index}`,
                                                    nama: row[namaKey] ? String(row[namaKey]).trim() : 'Tanpa Nama',
                                                    jk: jkValue,
                                                    peran: peranValue,
                                                    nomorInduk: row[noKey] ? String(row[noKey]).replace(/^'/, '').trim() : '-',
                                                    kelas: kelasValue 
                                                };
                                            });
                                            allNewUsersRaw = [...allNewUsersRaw, ...sheetUsers];
                                        }
                                    });
                                    if(allNewUsersRaw.length === 0) return showToastMessage("File Excel kosong atau format tidak sesuai", 'error');

                                    let addedCount = 0;
                                    let duplicateCount = 0;
                                    const newUsers = [];
                                    const existingNames = new Set(safeUsers.map(u => String(u.nama || '').toLowerCase().trim()));

                                    allNewUsersRaw.forEach(newUser => {
                                        const nameKey = String(newUser.nama || '').toLowerCase().trim();
                                        if (!existingNames.has(nameKey) && nameKey !== 'tanpa nama' && nameKey !== '') {
                                            newUsers.push(newUser);
                                            existingNames.add(nameKey); 
                                            addedCount++;
                                        } else {
                                            duplicateCount++;
                                        }
                                    });

                                    if (addedCount === 0) {
                                        if (duplicateCount > 0) return showToastMessage(`Gagal! ${duplicateCount} nama sudah ada di sistem (Duplikat).`, 'error');
                                        return;
                                    }

                                    const combinedUsers = [...safeUsers, ...newUsers];
                                    setUsers(combinedUsers); 
                                    saveToBackend({ users: combinedUsers });
                                    showToastMessage(`Berhasil memuat ${addedCount} data baru.`, 'success');
                                } catch (err) {
                                    console.error(err);
                                    showToastMessage("Gagal memproses file Excel.", 'error');
                                }
                            };
                                reader.onerror = () => showToastMessage("Gagal membaca file.", 'error');
                                reader.readAsArrayBuffer(file);
                                e.target.value = '';
                            }} />
                            <div className="flex gap-3">
                                <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-bold border-2 border-dashed border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                                    <i className="fas fa-upload"></i> Pilih File Excel
                                </button>
                                <button onClick={() => {
                                    const templateData = [["Nama", "Peran", "Nomor Induk/NIP/NUPTK", "Kelas"], ["Budi Santoso", "Siswa", "10111", "10-A"], ["Ahmad Dahlan", "Guru", "NIP1234567", "-"]];
                                    const ws = XLSX.utils.aoa_to_sheet(templateData);
                                    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template");
                                    XLSX.writeFile(wb, "Template_Absensi.xlsx");
                                }} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-4 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm">
                                    Template
                                </button>
                            </div>
                        </div>
                    </div>

                    {selectedDataUsers.length > 0 && (
                        <div className="bg-slate-900 p-4 rounded-3xl text-white flex items-center justify-between">
                            <span className="font-semibold text-sm ml-2">{selectedDataUsers.length} Data Terpilih</span>
                            <div className="flex gap-2">
                                <button onClick={() => setShowBulkEditModal(true)} className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold">Edit Massal</button>
                                <button onClick={() => {
                                    setConfirmAction({
                                        title: 'Hapus Massal',
                                        message: `Yakin ingin menghapus ${selectedDataUsers.length} data terpilih?`,
                                        onConfirm: () => {
                                            const newUsers = safeUsers.filter(u => !selectedDataUsers.includes(u.id));
                                            setUsers(newUsers);
                                            saveToBackend({ users: newUsers });
                                            setSelectedDataUsers([]);
                                            setConfirmAction(null);
                                            showToastMessage("Data terpilih dihapus.", "success");
                                        }
                                    });
                                }} className="bg-rose-600 px-4 py-2 rounded-xl text-sm font-bold">Hapus</button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="font-bold text-slate-700 dark:text-slate-200">Daftar Pegawai & Siswa</span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">{safeUsers.length} total</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative grow sm:grow-0">
                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs"></i>
                                    <input type="text" value={direktoriSearchQuery} onChange={e => setDirektoriSearchQuery(e.target.value)} placeholder="Cari nama / induk..." className="w-full sm:w-56 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all whitespace-nowrap">
                                    <input type="checkbox" checked={direktoriSortByClass} onChange={e => setDirektoriSortByClass(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                    Urut Kelas
                                </label>
                                <button onClick={() => {
                                    setConfirmAction({
                                        title: 'Hapus Semua',
                                        message: 'Yakin ingin menghapus seluruh data?',
                                        onConfirm: () => {
                                            setUsers([]); setAttendance({});
                                            saveToBackend({ users: [], attendance: {} });
                                            setConfirmAction(null);
                                            showToastMessage("Semua data dihapus.", "success");
                                        }
                                    });
                                }} className="text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 whitespace-nowrap">Hapus Semua</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 text-xs uppercase">
                                    <tr>
                                        <th className="p-4 w-12 text-center"><input type="checkbox" checked={safeUsers.length > 0 && selectedDataUsers.length === safeUsers.length} onChange={(e) => setSelectedDataUsers(e.target.checked ? safeUsers.map(u => u.id) : [])} /></th>
                                        <th className="p-4">No</th>
                                        <th className="p-4">Nama Lengkap</th>
                                        <th className="p-4">Kelas</th>
                                        <th className="p-4">Peran</th>
                                        <th className="p-4">Nomor Induk / NIP</th>
                                        <th className="p-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {(() => {
                                        let list = [...safeUsers];
                                        if (direktoriSearchQuery.trim()) {
                                            const q = direktoriSearchQuery.trim().toLowerCase();
                                            list = list.filter(u => String(u.nama || '').toLowerCase().includes(q) || String(u.nomorInduk || '').toLowerCase().includes(q));
                                        }
                                        if (direktoriSortByClass) {
                                            list.sort((a, b) => {
                                                const ka = String(a.kelas || '').toLowerCase();
                                                const kb = String(b.kelas || '').toLowerCase();
                                                if (ka < kb) return -1;
                                                if (ka > kb) return 1;
                                                return String(a.nama || '').localeCompare(String(b.nama || ''));
                                            });
                                        }
                                        return list.map((u, i) => (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-4 text-center"><input type="checkbox" checked={selectedDataUsers.includes(u.id)} onChange={(e) => setSelectedDataUsers(e.target.checked ? [...selectedDataUsers, u.id] : selectedDataUsers.filter(id => id !== u.id))} /></td>
                                                <td className="p-4 text-slate-500 dark:text-slate-400">{i + 1}</td>
                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{u.nama} ({u.jk})</td>
                                                <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">{u.kelas}</td>
                                                <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">{u.peran}</span></td>
                                                <td className="p-4 text-slate-500 dark:text-slate-400">{u.nomorInduk}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => { setEditingUserId(u.id); setUserForm({...u}); setShowUserModal(true); }} className="text-amber-500 dark:text-amber-400 p-2"><i className="fas fa-edit"></i></button>
                                                    <button onClick={() => {
                                                        setConfirmAction({
                                                            title: 'Hapus Data',
                                                            message: `Hapus ${u.nama}?`,
                                                            onConfirm: () => {
                                                                const newUsers = safeUsers.filter(x => x.id !== u.id);
                                                                setUsers(newUsers);
                                                                saveToBackend({ users: newUsers });
                                                                setConfirmAction(null);
                                                                showToastMessage("Data dihapus.", "success");
                                                            }
                                                        });
                                                    }} className="text-rose-500 dark:text-rose-400 p-2"><i className="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'settings' && userRole === 'admin' && renderSettings()}
                </>
            )}
        </main>

        {showUserModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-fade-in-up text-left">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{editingUserId ? 'Edit Data' : 'Tambah Data Manual'}</h3>
                        <button onClick={() => setShowUserModal(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center"><i className="fas fa-times"></i></button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const trimmedName = String(userForm.nama || '').trim();
                        if (!trimmedName) return showToastMessage("Nama wajib diisi!", "error");
                        let newUsers = [...safeUsers];
                        if (editingUserId) {
                            newUsers = newUsers.map(u => u.id === editingUserId ? { ...userForm, nama: trimmedName, id: editingUserId } : u);
                            showToastMessage("Data diperbarui.", "success");
                        } else {
                            newUsers.push({ ...userForm, nama: trimmedName, id: `usr_${Date.now()}_manual` });
                            showToastMessage("Data ditambahkan.", "success");
                        }
                        setUsers(newUsers);
                        saveToBackend({ users: newUsers });
                        setShowUserModal(false);
                    }} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama Lengkap *</label>
                            <input type="text" value={userForm.nama} onChange={e => setUserForm({...userForm, nama: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Jenis Kelamin</label>
                                <select value={userForm.jk || 'L'} onChange={e => setUserForm({...userForm, jk: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                                    <option value="L">Laki-laki (L)</option><option value="P">Perempuan (P)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Peran</label>
                                <select value={userForm.peran} onChange={e => setUserForm({...userForm, peran: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                                    <option value="Siswa">Siswa</option><option value="Guru">Guru</option><option value="Staff">Staff</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Kelas</label>
                                <input type="text" value={userForm.kelas} onChange={e => setUserForm({...userForm, kelas: e.target.value})} placeholder="Contoh: 10-A" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">No Induk / NIP</label>
                                <input type="text" value={userForm.nomorInduk} onChange={e => setUserForm({...userForm, nomorInduk: e.target.value})} placeholder="Nomor Induk" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">Batal</button>
                            <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/20">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {showBulkEditModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-fade-in-up text-left">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Edit Massal</h3>
                        <button onClick={() => setShowBulkEditModal(false)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center"><i className="fas fa-times"></i></button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Mengubah <b>{selectedDataUsers.length} data</b> terpilih secara bersamaan.</p>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pilih Atribut</label>
                            <select value={bulkEditField} onChange={e => setBulkEditField(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                                <option value="peran">Peran</option><option value="kelas">Kelas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nilai Baru</label>
                            {bulkEditField === 'peran' ? (
                                <select value={bulkEditValue} onChange={e => setBulkEditValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold cursor-pointer text-slate-700 dark:text-slate-200">
                                    <option value="Siswa">Siswa</option><option value="Guru">Guru</option><option value="Staff">Staff</option>
                                </select>
                            ) : (
                                <input type="text" value={bulkEditValue} onChange={e => setBulkEditValue(e.target.value)} placeholder="Masukkan kelas baru" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 font-semibold text-slate-700 dark:text-slate-200" />
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowBulkEditModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">Batal</button>
                        <button onClick={() => {
                            const newUsers = safeUsers.map(u => selectedDataUsers.includes(u.id) ? { ...u, [bulkEditField]: bulkEditValue } : u);
                            setUsers(newUsers);
                            saveToBackend({ users: newUsers });
                            setShowBulkMonthModal(false);
                            setShowBulkEditModal(false);
                            setSelectedDataUsers([]);
                            showToastMessage("Perubahan massal berhasil.", "success");
                        }} className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/20">Terapkan</button>
                    </div>
                </div>
            </div>
        )}

        {confirmAction && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-sm p-6 animate-fade-in-up text-left">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg"><i className="fas fa-exclamation-triangle"></i></div>
                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{String(confirmAction.title || "")}</h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">{String(confirmAction.message || "")}</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setConfirmAction(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Batal</button>
                        <button onClick={confirmAction.onConfirm} className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20">Ya, Hapus</button>
                    </div>
                </div>
            </div>
        )}

        {showCardModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4 overflow-y-auto">
                <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-5xl p-8 animate-fade-in-up my-auto border border-slate-100 dark:border-slate-700 text-left print:shadow-none print:border-0">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"><i className="fas fa-id-card text-xl"></i></div>
                            Kartu Pelajar
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={handlePrintCards} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md print:hidden">
                                <i className="fas fa-print"></i> Cetak
                            </button>
                            <button onClick={() => setShowCardModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 flex items-center justify-center transition-all print:hidden"><i className="fas fa-times text-lg"></i></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {safeUsers.map(user => {
                            const qrUrl = qrCodeDataUrls[user.id];
                            return (
                                <div key={user.id} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all print:break-inside-avoid">
                                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-3 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden shrink-0">
                                            <img src={defaultLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-white font-extrabold text-sm tracking-tight">{String((appSettings && appSettings.appName) || "Sistem Absensi")}</p>
                                            <p className="text-indigo-200 text-[10px] font-medium">Kartu Pelajar / ID Card</p>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col items-center">
                                        <div className="bg-white border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-3 mb-4">
                                            {qrUrl ? (
                                                <img src={qrUrl} alt="QR Code" className="w-36 h-36 object-contain" />
                                            ) : (
                                                <div className="w-36 h-36 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs">Memuat QR...</div>
                                            )}
                                        </div>
                                        <div className="text-center space-y-1.5 w-full">
                                            <p className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight">{String(user.nama || '-')}</p>
                                            <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold">
                                                <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg">{String(user.nomorInduk || '-')}</span>
                                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">{String(user.kelas || '-')}</span>
                                                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg">{String(user.jk || 'L')}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mt-2">{String(user.peran || '-')}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 px-5 py-2.5 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center">ID: {String(user.id || '-')}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {showScannerModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-lg p-8 animate-fade-in-up my-auto border border-slate-100 dark:border-slate-700 text-left">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"><i className="fas fa-qrcode"></i></div>
                            Scan QR Kartu Pelajar
                        </h3>
                        <button onClick={() => { setShowScannerModal(false); setScanImage(null); setScannedResult(null); stopCamera(); }} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 flex items-center justify-center transition-all"><i className="fas fa-times text-base"></i></button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-left">Arahkan kamera ke QR Code kartu pelajar untuk melakukan absensi otomatis. Hasil scan akan menandai siswa sebagai <b>Hadir</b> pada tanggal yang dipilih.</p>
                    <div className="space-y-4">
                        <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video">
                            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                            <canvas ref={canvasRef} className="hidden" />
                            {!cameraActive && !cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <i className="fas fa-camera text-4xl mb-3 text-slate-400"></i>
                                    <p className="text-sm font-bold text-slate-300">Kamera belum aktif</p>
                                </div>
                            )}
                            {cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                    <i className="fas fa-exclamation-triangle text-4xl mb-3 text-rose-400"></i>
                                    <p className="text-sm font-bold text-rose-300 text-center">{cameraError}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {!cameraActive ? (
                                <button onClick={startCamera} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2">
                                    <i className="fas fa-play"></i> Mulai Scan
                                </button>
                            ) : (
                                <button onClick={stopCamera} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md flex items-center justify-center gap-2">
                                    <i className="fas fa-stop"></i> Berhenti
                                </button>
                            )}
                            <button onClick={() => scannerFileInputRef.current.click()} className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm flex items-center gap-2">
                                <i className="fas fa-image"></i> Upload Gambar
                            </button>
                            <input type="file" accept="image/*" className="hidden" ref={scannerFileInputRef} onChange={handleScanQrImage} />
                        </div>
                        {scannedResult && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0"><i className="fas fa-check"></i></div>
                                <div>
                                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Scan Berhasil!</p>
                                    <p className="text-emerald-600 dark:text-emerald-400 text-xs">{String(scannedResult.nama || '')} - {String(scannedResult.nomorInduk || '')} - {String(scannedResult.kelas || '')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
         )}
         </div>
         )}
         {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
     </div>
   );
 }
