# 🇩🇪 Deutsch Lernen - Interaktive Quiz & Wortschatz Flashcards

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.0-F024B6?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Vanilla_Premium-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)

Aplikasi belajar bahasa Jerman interaktif modern dengan desain premium, interaksi dinamis, dan sistem evaluasi komprehensif untuk melatih tata bahasa (**Dativ**) serta memperkaya kosa kata (**Wortschatz**) dari level A1 hingga B2.

---

## ✨ Fitur Utama

### 1. 📝 Interaktive Quiz (Dativ & Tatabahasa)
* **Real-time Feedback**: Evaluasi instan untuk setiap jawaban yang dipilih.
* **Score & Progress Tracking**: Bar kemajuan visual yang responsif.
* **Review Jawaban Lengkap**: Penjelasan detail di akhir kuis untuk membantu memahami kesalahan tata bahasa.
* **Interactive Celebration**: Efek konfeti interaktif menggunakan `canvas-confetti` saat menyelesaikan kuis dengan sukses.

### 2. 🎴 Wortschatz Flashcards (A1 - B2)
* **Categorized Levels**: Pembagian kosa kata terstruktur dari tingkat dasar (A1) hingga menengah atas (B2).
* **Interactive Animations**: Transisi balik kartu 3D yang halus didukung oleh `framer-motion`.
* **Dynamic Article Coloring**: Pewarnaan otomatis artikel kata benda (der/die/das) untuk mempermudah ingatan visual.
* **Swipe & Navigation**: Navigasi cepat antar kartu kosakata dengan kontrol yang intuitif.

### 3. ✍️ Custom Vocabulary Creator
* **Add Custom Flashcards**: Tambahkan kosa kata baru secara manual melalui form input yang divalidasi.
* **Browser Persistence**: Data flashcard buatan sendiri tersimpan secara aman di dalam `localStorage` sehingga tidak akan hilang saat halaman direfresh.

### 4. 🎨 Premium Modern Design
* **Neo-Brutalist Aesthetic**: Tema modern beresolusi tinggi dengan kontras tajam, bayangan tebal, dan tipografi elegan.
* **Ultra-Responsive Layout**: Desain ramah perangkat seluler yang dioptimalkan khusus agar nyaman digunakan di smartphone maupun desktop.

---

## 🛠️ Teknologi & Pustaka

Aplikasi ini dibangun menggunakan ekosistem modern berkinerja tinggi:

- **React 19** – UI library deklaratif dan responsif.
- **Vite 8** – Bundler super cepat untuk pengembangan frontend modern.
- **Framer Motion 12** – Mesin animasi canggih untuk transisi kartu dan feedback visual yang mulus.
- **Lucide React** – Koleksi ikon vektor modern yang bersih dan minimalis.
- **Canvas Confetti** – Pustaka perayaan berbasis Canvas untuk meningkatkan user engagement.
- **Vanilla CSS (Premium Styles)** – Desain kustom yang dioptimalkan untuk performa tinggi tanpa dependensi CSS eksternal yang berat.

---

## 🚀 Memulai Pengembangan

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal di komputer Anda.

### Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) versi terbaru di sistem Anda.

### Instalasi Dependensi
```bash
npm install
```

### Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser Anda dan akses `http://localhost:5173` untuk melihat aplikasi berjalan secara interaktif.

### Build Produksi
Untuk mengompilasi dan mengoptimalkan aplikasi untuk peluncuran produksi:
```bash
npm run build
```
Hasil build yang optimal akan berada di direktori `/dist` dan siap di-deploy ke platform seperti Vercel, Netlify, atau GitHub Pages.

---

## 📁 Struktur Direktori Utama

```text
├── public/             # Aset statis & logo
├── src/
│   ├── components/     # Komponen modular UI (FlashcardViewer, Dashboard, dll.)
│   ├── data/           # Kumpulan data kosa kata dan soal kuis (A1 - B2)
│   ├── App.jsx         # Entry point aplikasi utama
│   ├── index.css       # Sistem desain CSS global & variabel tema
│   └── main.jsx        # File inisialisasi React
├── package.json        # Manifest proyek dan dependensi
└── vite.config.js      # Konfigurasi bundler Vite
```

---
*Dibuat dengan 💻 dan ❤️ untuk mendukung kemudahan belajar Bahasa Jerman yang menyenangkan.*

