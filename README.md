# MealMate – Your Daily Meal Reminder 🥗⏰

**MealMate** adalah aplikasi web modern, minimalis, dan aesthetic untuk membantu pengguna menjaga pola makan secara teratur setiap hari dengan pengingat waktu makan cerdas, alarm suara Text-to-Speech (TTS) berbahasa Indonesia, nada chime lonceng lembut, dan notifikasi browser.

---

## ✨ Fitur Utama

1. **Konsep & Desain Aesthetic Modern**
   - Kombinasi palet warna lembut: Soft Cream (`#F9F6EE`), Putih Bersih, Hijau Sage (`#55856F`), dan Sentuhan Warm Orange/Peach (`#E76F51`).
   - Tampilan responsif optimal di desktop, tablet, maupun smartphone.
   - Kartu rounded corners, bayangan halus (*soft ambient shadows*), dan transisi animasi mikro yang nyaman di mata.
   - Dukungan **Mode Terang (Light)** dan **Mode Gelap (Sage Night)**.

2. **Dashboard Interaktif & Real-time**
   - **Sapaan Dinamis Berdasarkan Waktu**: Pagi, Siang, Sore, dan Malam disertai pesan motivasi kesehatan.
   - **Jam Digital Real-time**: Menampilkan jam, menit, dan detik secara langsung beserta hari & tanggal berbahasa Indonesia.
   - **Countdown Timer**: Menghitung mundur waktu secara live menuju jadwal makan berikutnya.
   - **Progres Harian**: Menampilkan progress bar dan persentase jadwal makan yang telah diselesaikan hari ini.
   - **Status Jadwal**: Indikator jelas status *"Belum Waktunya"*, *"Saatnya Makan!"* (berkedip halus), *"Sudah Selesai"*, atau *"Ditunda (Snooze)"*.

3. **4 Kategori Jadwal Makan Standar (Dapat Diedit Sepenuhnya)**
   - 🌅 **Sarapan Pagi**: 07.00
   - ☀️ **Makan Siang**: 12.00
   - 🌇 **Makan Sore / Malam**: 16.00
   - 🌙 **Camilan Malam**: 20.00
   - Pengguna bebas mengubah jam, nama, ikon, deskripsi, serta menambah jadwal makan baru.

4. **Fitur Alarm Suara & Text-to-Speech (SpeechSynthesis API)**
   - Saat waktu makan tiba, pop-up dialog alarm muncul dengan animasi piring dan gelombang suara.
   - Memainkan nada lonceng lembut (*meditation chime synthesizer* berbasis Web Audio API tanpa file audio eksternal yang berat).
   - Membacakan kalimat pengingat dalam **Bahasa Indonesia** menggunakan **SpeechSynthesis API** browser, seperti:
     - *"Ayo, sudah waktunya sarapan! Berikan energi terbaik untuk tubuhmu hari ini."*
     - *"Jangan lupa makan siang, ya! Istirahat sejenak dan nikmati santap siangmu."*
     - *"Yuk, waktunya makan sore! Jaga kesehatan lambung dengan makan teratur."*
     - *"Sudah waktunya ngemil malam. Jangan sampai lupa, pilih camilan yang sehat ya!"*
   - Opsi tombol:
     - 🍽️ **Sudah Makan**: Menandai selesai, menghentikan suara, dan mencatat riwayat.
     - ⏰ **Ingatkan 10 Menit Lagi**: Menunda alarm (Snooze) selama 10 menit.
     - 🔕 **Matikan Alarm**: Menghentikan suara seketika.
   - Pencegahan alarm berbunyi ganda dalam 1 hari/menit yang sama (*anti-duplicate logic*).
   - Pengaturan volume, opsi suara, dan tombol uji coba suara langsung.

5. **Notifikasi Browser (Web Notification API)**
   - Memberikan notifikasi sistem pop-up ke layar desktop/smartphone.
   - Dilengkapi panduan agar pengguna menyematkan tab (*Pin Tab*) sehingga browser tidak menidurkan proses di latar belakang.

6. **Riwayat Makan & Analitik Visual**
   - Statistik kepatuhan: Streak harian disiplin makan (🔥), total jadwal terselesaikan, dan rata-rata kepatuhan 7 hari terakhir.
   - Grafik batang visual 7 hari terakhir menunjukkan capaian harian.
   - Daftar riwayat pencatatan waktu makan dengan jam dijadwalkan vs jam penyelesaian aktual.

7. **Pengaturan Lengkap & Penyimpanan Lokal (LocalStorage)**
   - Pengaturan saklar suara alarm & nada chime.
   - Slider pengaturan volume suara.
   - Pemilihan suara (*Voice selection*) dari browser.
   - Pengaturan izin notifikasi browser & tombol uji coba.
   - Kustomisasi kalimat pengingat per jadwal makan.
   - Opsi reset data ke setelan awal default.

---

## 🛠️ Arsitektur & Teknologi

- **HTML5**: Struktur semantik dengan modal dialog modern dan SVG icons.
- **CSS3**: Variabel CSS kustom, Flexbox, CSS Grid, animasi micro-interaction, dan mode gelap.
- **JavaScript Vanilla**:
  - `storage.js`: Manajemen persistensi `LocalStorage` untuk jadwal, riwayat, dan preferensi.
  - `audio.js`: Sintesis nada lonceng `Web Audio API` & pembacaan `SpeechSynthesis API`.
  - `notifications.js`: Integrasi `Web Notification API`.
  - `app.js`: Pengendali utama (*clock ticker*, *schedule watcher*, *event delegation*, *countdown updater*).
- **Zero Backend / Zero Paid API**: Dapat dijalankan 100% offline di peramban apa pun.

---

## 🚀 Cara Menjalankan Secara Lokal

Cukup buka file `index.html` langsung di peramban web modern Anda (Google Chrome, Microsoft Edge, Safari, Firefox, atau Brave).

Atau jalankan menggunakan local server sederhana:
```bash
# Menggunakan Python
python -m http.server 8080

# Atau menggunakan Node.js npx
npx serve .
```
Buka browser di `http://localhost:8080`.

---

## 🌐 Deploy ke Netlify atau Vercel

Proyek ini telah dilengkapi file konfigurasi `netlify.toml` dan `vercel.json` sehingga dapat langsung di-deploy:

### Deploy ke Netlify
1. Buka [Netlify](https://www.netlify.com/).
2. Drag and drop folder proyek ini ke dashboard Netlify, atau hubungkan repository Git Anda.
3. Build command: *(kosongkan)*, Publish directory: `.`

### Deploy ke Vercel
1. Buka [Vercel](https://vercel.com/).
2. Impor direktori atau repo Git proyek ini.
3. Framework Preset: **Other**, Build command: *(kosongkan)*, Output directory: `.`.
4. Klik **Deploy**.
