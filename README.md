````markdown
# IDP Competency Telegram Bot

Telegram bot untuk menampilkan informasi kompetensi berdasarkan jabatan, nomenklatur, dan jenis kompetensi dengan sumber data dari file Excel `IDP.xlsx`.

Bot ini dirancang untuk memudahkan pengguna menelusuri kompetensi Teknis, Manajerial, dan Sosial Kultural melalui menu bertingkat di Telegram.

## Fitur

- Menu bertingkat berbasis inline keyboard
- Pilihan jabatan:
  - Pelaksana/AR/PK/Juru Sita
  - Kasi
- Pilihan nomenklatur untuk jabatan Pelaksana
- Pengambilan data kompetensi dari file Excel:
  - Sheet `Teknis`
  - Sheet `Manajerial`
  - Sheet `Sosial Kultural`
- Penyesuaian level otomatis:
  - Pelaksana → Level 1
  - Kasi → Level 2
- Session sederhana untuk menyimpan pilihan user
- Aman untuk teks panjang dan karakter khusus Markdown Telegram
- Siap dijalankan di lokal maupun di VPS Ubuntu dengan **PM2**

---

## Alur Bot

### 1. Pilih Jabatan
User memulai dengan perintah:

/start
````

Bot akan menampilkan menu:

* Pelaksana/AR/PK/Juru Sita
* Kasi

### 2. Pilih Nomenklatur

Jika user memilih **Pelaksana/AR/PK/Juru Sita**, bot akan menampilkan pilihan:

* Penelaah Teknis Kebijakan
* Pengolah Data dan Informasi
* Pengadministrasi Perkantoran
* Account Representative
* Juru Sita Keuangan Negara
* Penelaah Keberatan

### 3. Pilih Jenis Kompetensi

Setelah itu user memilih salah satu:

* Teknis
* Manajerial
* Sosial Kultural

### 4. Pilih Nama Kompetensi

Nama kompetensi diambil dari Excel berdasarkan sheet yang relevan.

### 5. Tampilkan Hasil

Bot menampilkan detail kompetensi sesuai pilihan user.

---

## Struktur Data Excel

File Excel yang digunakan:

```text
data/IDP.xlsx
```

### Sheet `Teknis`

Header yang dibaca:

* `Nomenklatur`
* `KOMPETENSI TEKNIS`
* `Level`
* `INDIKATOR KOMPETENSI TEKNIS`

### Sheet `Manajerial`

Header yang dibaca:

* `Kompetensi`
* `Level`
* `Indikator Perilaku`

### Sheet `Sosial Kultural`

Header yang dibaca:

* `Kompetensi`
* `Level`
* `Indikator Perilaku`

---

## Aturan Level

### Manajerial dan Sosial Kultural

* Jika user memilih **Pelaksana/AR/PK/Juru Sita**, bot menggunakan **Level 1**
* Jika user memilih **Kasi**, bot menggunakan **Level 2**

### Teknis

* Diambil berdasarkan **Nomenklatur** yang dipilih sebelumnya
* Nilai **Level** dan **Indikator Kompetensi Teknis** ditampilkan langsung dari sheet `Teknis`

---

## Catatan Implementasi

* Nilai Excel dibersihkan menggunakan `trim()` agar data tetap cocok walaupun ada spasi tambahan
* Callback Telegram dibuat pendek agar tidak melebihi batas `callback_data`
* Teks hasil dipecah jika terlalu panjang agar aman dikirim ke Telegram
* Saat ini **Teknis untuk jabatan Kasi** belum tersedia jika belum ada data yang sesuai pada sheet `Teknis`

---

## Tech Stack

* **Node.js**
* **Telegraf**
* **xlsx**
* **dotenv**
* **PM2** untuk deployment di VPS

---

## Struktur Folder

```text
bot-idp/
├── data/
│   └── IDP.xlsx
├── src/
│   ├── index.js
│   ├── excel.js
│   ├── session.js
│   └── utils.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/username/idp-competency-telegram-bot.git
cd idp-competency-telegram-bot
```

### 2. Install dependency

```bash
npm install
```

### 3. Buat file environment

Buat file `.env` di root project:

```env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
```

### 4. Tambahkan file Excel

Pastikan file Excel berada di lokasi berikut:

```text
data/IDP.xlsx
```

---

## Menjalankan Bot Secara Lokal

```bash
node src/index.js
```

Jika berhasil, terminal akan menampilkan:

```text
Bot berjalan...
```

Lalu buka bot di Telegram dan kirim:

```bash
/start
```

---

## Menjalankan dengan PM2

PM2 digunakan agar bot tetap aktif di server.

### Install PM2

```bash
npm install -g pm2
```

### Jalankan bot

```bash
pm2 start src/index.js --name bot-idp
```

### Cek status

```bash
pm2 list
```

### Lihat log

```bash
pm2 logs bot-idp
```

### Simpan konfigurasi PM2

```bash
pm2 save
pm2 startup
```

Ikuti perintah tambahan yang ditampilkan PM2, lalu jalankan lagi:

```bash
pm2 save
```

---

## Deployment di VPS Ubuntu

### 1. Login ke VPS

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Update server

```bash
apt update && apt upgrade -y
```

### 3. Install Node.js LTS

```bash
apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
```

### 4. Verifikasi instalasi

```bash
node -v
npm -v
```

### 5. Upload project ke VPS

Bisa menggunakan:

* `scp`
* WinSCP
* Git clone

Contoh dengan `scp`:

```bash
scp -r "D:\bot-idp" root@YOUR_SERVER_IP:/root/
```

### 6. Install dependency di server

```bash
cd /root/bot-idp
npm install
```

### 7. Buat `.env`

```bash
nano .env
```

Isi:

```env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
```

### 8. Jalankan dengan PM2

```bash
pm2 start src/index.js --name bot-idp
pm2 save
pm2 startup
```

---

## Contoh `.gitignore`

```gitignore
node_modules
.env
```

---

## Contoh `.env.example`

```env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
```

---

## Troubleshooting

### Bot tidak merespons `/start`

Periksa:

* token bot benar
* proses Node.js berjalan
* log PM2 tidak menunjukkan error

### Excel tidak terbaca

Periksa:

* file berada di `data/IDP.xlsx`
* nama sheet sesuai:

  * `Teknis`
  * `Manajerial`
  * `Sosial Kultural`
* header Excel sesuai dengan yang digunakan di kode

### Kompetensi tidak muncul

Periksa:

* data nomenklatur memang ada di sheet `Teknis`
* tidak ada perbedaan penulisan
* file Excel terbaru sudah ter-upload

### Bot mati setelah terminal ditutup

Jalankan bot menggunakan **PM2**, bukan hanya `node src/index.js`

---

## Pengembangan Selanjutnya

Beberapa pengembangan yang bisa ditambahkan:

* Tombol **Menu Utama** di setiap hasil
* Tombol **Kembali** yang lebih lengkap
* Dukungan **Kompetensi Teknis untuk Kasi**
* Penyimpanan session menggunakan Redis atau database
* Mode **webhook**
* Integrasi admin panel untuk update data tanpa edit kode
* Validasi file Excel otomatis saat startup

---

## Keamanan

* Jangan commit file `.env` ke repository
* Jangan membagikan token bot Telegram
* Jangan membagikan root password VPS
* Disarankan membuat user non-root untuk deployment production

---

## Dependencies

Install manual:

```bash
npm install telegraf xlsx dotenv
```

---

## Lisensi

Project ini dapat digunakan untuk kebutuhan internal, pengembangan pribadi, atau disesuaikan dengan kebijakan organisasi Anda.
