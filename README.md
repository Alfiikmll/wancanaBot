# 🎣 Wancana Bot

Wancana Bot adalah bot WhatsApp berbasis **Node.js + Baileys** yang menggabungkan **Fishing RPG**, sistem ekonomi, Gacha, joran dengan skill, item/buff, dan lelang ikan. Bot juga memiliki fitur **AI Chat menggunakan Google Gemini API**.

> Proyek ini dibuat untuk penggunaan lokal/pengembangan. Sebelum dipakai terus-menerus, lakukan pengujian dan sesuaikan konfigurasi database serta API.

---

## ✨ Fitur Utama

### 🎣 Fishing RPG
- `/mancing` — memancing ikan.
- Ikan memiliki rarity, berat, EXP, dan Gold.
- Hasil tangkapan masuk ke inventory.
- Fishing memiliki cooldown.
- Buff item dan skill joran dapat memengaruhi hasil memancing.

### 🎒 Inventory & Item
- `/inventory` — melihat ikan yang dimiliki.
- `/item` — melihat item yang dimiliki dan buff aktif.
- `/pakaiitem <id_item>` — menggunakan item.
- Sistem item mendukung beberapa tipe seperti `junk`, `food`, `boost`, dan `material`.

Item khusus yang saat ini tersedia:
- 💍 `cincin_ambarawa` — Gold Boost +10% selama 5 menit.
- 🍗 `ayam_geprekin` — Luck +50% selama 30 detik.
- 🩴 `junk_sandal`
- 🥫 `junk_kaleng`
- 🌿 `junk_rumputlaut`
- 🧦 `junk_kaoskaki`
- 🪨 `junk_batu`

### 🎣 Sistem Joran
- `/joran` — melihat koleksi joran.
- `/toko` — melihat joran yang tersedia di toko.
- `/belirod <id>` — membeli joran.
- `/pilihjoran <id>` — memakai joran.
- `wood` adalah joran starter gratis.
- Joran dapat memiliki skill dengan peluang aktivasi tertentu.
- Joran Secret/Mythical memiliki efek skill khusus.

### 🎰 Gacha
- `/gacha` — Gacha 1x.
- `/gacha 10` — Gacha 10x.
- Gacha menggunakan Coin.
- Gacha dapat memberikan joran dan item.
- Sistem Gacha juga memiliki 5 item ampas/junk.

### 💰 Gold & Coin
- Gold diperoleh dari aktivitas memancing.
- Gold dapat ditukar menjadi Coin.
- Kurs saat ini:
  - `100 Gold = 1 Coin`
  - `1.000 Gold = 10 Coin`
- `/tukarcoin <jumlah_coin>` — menukar Gold menjadi Coin.

### 🔨 Lelang Ikan
- `/lelang` — melihat bantuan/perintah lelang.
- `/lelang lihat` — melihat lelang aktif.
- `/lelang jual <nomor_ikan> <harga>` — membuka lelang.
- `/lelang bid <id_lelang> <harga>` — melakukan bid.

Aturan lelang saat ini:
- Durasi awal: **1 menit**.
- Setiap bid yang valid menambah **30 detik**.
- Tidak ada batas maksimum durasi.
- Bid tertinggi menjadi pemenang.
- Penjual tidak boleh melakukan bid pada ikannya sendiri.
- Saat bidder lama kalah ditawar, dana bid sebelumnya dikembalikan.
- Jika tidak ada bid sampai waktu habis, ikan tetap kembali/tersedia di inventory penjual.
- Ikan yang sedang dilelang tidak boleh dijual melalui `/jualikan` atau `/jualikan semua`.

### 🏆 Pemain
- `/daftar <nama>` — mendaftarkan pemain.
- `/profile` — melihat profil, level, EXP, Gold, Coin, dan joran aktif.
- `/leaderboard` — melihat leaderboard.
- `/menu` — membuka menu utama.

### 🤖 AI Chat
Wancana Bot dapat menjawab chat menggunakan Google Gemini API.

Di grup WhatsApp, AI hanya merespons ketika bot di-mention/dipanggil sesuai logika pada `src/bot.js`.

API key dibaca dari:

```env
GEMINI_API_KEY=isi_api_key_kamu
```

---

## 🚧 Tebak Gambar

Database versi terbaru sudah memiliki fondasi untuk fitur Tebak Gambar:

- `fishing_questions`
- `active_guess_games`
- `guess_answers`
- `guess_scores`

Namun fitur ini **belum aktif** pada versi proyek saat ini. File `src/commands/tebakGambar.js` masih kosong dan belum dihubungkan ke `src/bot.js`.

Jadi perintah Tebak Gambar sengaja belum dimasukkan sebagai command aktif agar menu dan dokumentasi tidak menyesatkan.

---



---

## 🧰 Teknologi

- Node.js
- JavaScript ES Modules
- `@whiskeysockets/baileys`
- MySQL
- `mysql2`
- `dotenv`
- `pino`
- `qrcode-terminal`
- Google Gemini API untuk AI Chat

---

## ⚙️ Instalasi

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
```

### 2. Install dependency

```bash
npm install
```

### 3. Siapkan MySQL

Pastikan MySQL berjalan di komputer/server kamu.

Database dump tersedia di:

```text
database.sql
```

Import file tersebut ke MySQL/HeidiSQL/phpMyAdmin.

Database yang digunakan proyek ini:

```text
wancana_bot
```

Konfigurasi koneksi saat ini berada di:

```text
src/databases/database.js
```

Default yang dipakai oleh project:

```text
Host     : 127.0.0.1
Port     : 3306
User     : root
Password : kosong
Database : wancana_bot
```

Sesuaikan `src/databases/database.js` jika konfigurasi MySQL kamu berbeda.

### 4. Siapkan API Gemini

Buat file `.env` di root project:

```env
GEMINI_API_KEY=API_KEY_KAMU
```

File `.env` sudah masuk `.gitignore`, jadi jangan di-upload ke GitHub.

### 5. Jalankan bot

```bash
npm start
```

Atau mode development:

```bash
npm run dev
```

### 6. Hubungkan WhatsApp

Saat bot meminta QR, QR akan ditampilkan di terminal.

Scan menggunakan WhatsApp pada perangkat yang akan menjadi akun bot.

Folder sesi akan tersimpan di:

```text
auth_info/
```

Folder tersebut sudah masuk `.gitignore` dan tidak boleh di-upload ke GitHub.

---

## 🔐 File yang Jangan Di-upload ke GitHub

Jangan upload:

```text
.env
auth_info/
node_modules/
```

Ketiganya sudah tercantum di `.gitignore`.

---





---

## 🗄️ Database

Database utama memiliki tabel untuk:

```text
players
player_inventory
player_rods
items
player_items
fish_species
auction_listings
auction_bids
fishing_questions
active_guess_games
guess_answers
guess_scores
```

Relasi foreign key digunakan untuk menjaga hubungan antara pemain, inventory, item, joran, auction, dan sistem Tebak Gambar.

---

## 🐟 Alur Bermain Pemain Baru

```text
/daftar NamaKamu
        ↓
/mancing
        ↓
/inventory
/profile
        ↓
/toko
        ↓
/belirod bamboo
        ↓
/joran
        ↓
/pilihjoran bamboo
        ↓
/mancing lagi
        ↓
/tukarcoin 10
        ↓
/gacha
```

Pemain kemudian dapat menggunakan sistem item dan mengikuti lelang ikan.

---

## 🔨 Alur Lelang

```text
/ inventory
     ↓
/lelang jual 1 500
     ↓
/lelang lihat
     ↓
/lelang bid 1 700
     ↓
/lelang bid 1 1000
     ↓
Timer selesai
     ↓
Pemenang menerima ikan
     ↓
Penjual menerima Gold
```

---

## 🤖 AI Mention di Grup

Wancana Bot tidak dirancang untuk menjawab setiap pesan grup secara otomatis.

Bot mengecek mention dan penyebutan bot pada `src/bot.js`, lalu meneruskan pertanyaan ke handler AI.

---

## 🛠️ Pengembangan Selanjutnya

Fitur yang dapat dikembangkan berikutnya antara lain:

- Tebak Gambar penuh dengan gambar, hint, timer, reward, dan score.
- Pengujian auction bid end-to-end yang lebih lengkap.
- Penyempurnaan notifikasi auction.
- Penyimpanan buff secara persisten.
- Sistem admin untuk mengelola soal/gambar Tebak Gambar.
- Leaderboard khusus Tebak Gambar.

---

## 📌 Catatan Pengembangan

Project menggunakan JavaScript ES Modules sehingga `package.json` memiliki:

```json
"type": "module"
```

Entry point bot:

```text
src/index.js
```

Router/handler command utama:

```text
src/bot.js
```

Sistem dipisahkan menjadi `commands`, `systems`, `handlers`, `AI`, dan `databases` agar fitur dapat dikembangkan secara modular.

---

## 📄 Lisensi

Saat ini project menggunakan lisensi yang tercantum pada `package.json` (`ISC`).

## Tebak Gambar - 8-bit Shadow

Setiap soal memiliki foto asli dan versi 8-bit shadow/pixelated. Saat game dimulai, bot hanya mengirim versi shadow. Foto asli baru dikirim setelah jawaban benar. Jawaban salah tidak membocorkan foto asli. Jika waktu 60 detik habis, bot mengirim pesan gagal tanpa menampilkan foto asli.

Kolom `fishing_questions.shadow_image_path` menyimpan path gambar shadow. Jalankan `migration_tebak_gambar_shadow.sql` pada database `wancana_bot` sebelum memakai fitur ini.
