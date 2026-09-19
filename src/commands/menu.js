import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const menuCaption = `
🎣 *WANCANA BOT*
━━━━━━━━━━━━━━━━━━
Selamat datang di dunia *Fishing Wancana*! 🌊

Pancing ikan, kumpulkan Gold, cari joran langka,
gunakan item, ikut Gacha, dan ikut lelang ikan!

━━━━━━━━━━━━━━━━━━
🎣 *1. FITUR MEMANCING*
━━━━━━━━━━━━━━━━━━

/mancing
Memancing dan mendapatkan ikan, EXP, serta Gold.

/inventory
Melihat semua ikan yang kamu miliki.

/profile
Melihat profil, Level, EXP, Gold, Coin,
dan joran yang sedang digunakan.

━━━━━━━━━━━━━━━━━━
💰 *2. MENJUAL IKAN*
━━━━━━━━━━━━━━━━━━

/jualikan
Melihat cara menjual ikan.

/jualikan <nomor>
Menjual satu ikan berdasarkan nomor inventory.

/jualikan semua
Menjual seluruh ikan yang tidak sedang dilelang.

━━━━━━━━━━━━━━━━━━
🎣 *3. JORAN*
━━━━━━━━━━━━━━━━━━

/joran
Melihat koleksi joran yang kamu miliki.

/toko
Melihat joran yang tersedia di toko.

/belirod <id>
Membeli joran menggunakan Gold.

Contoh:
/belirod bamboo

/pilihjoran <id>
Menggunakan joran yang sudah kamu miliki.

Contoh:
/pilihjoran bamboo

💡 Setiap joran memiliki statistik dan skill.
Skill memiliki peluang tertentu untuk aktif saat memancing.

━━━━━━━━━━━━━━━━━━
🎒 *4. ITEM & BUFF*
━━━━━━━━━━━━━━━━━━

/item
Melihat semua item yang kamu miliki dan buff aktif.

/pakaiitem <id_item>
Menggunakan item.

Contoh:
/pakaiitem ayam_geprekin
/pakaiitem cincin_ambarawa

💍 Cincin Ambarawa
Gold Boost +10% selama 5 menit.

🍗 Ayam Geprekin
Luck +50% selama 30 detik.

━━━━━━━━━━━━━━━━━━
💰 *5. GOLD & COIN*
━━━━━━━━━━━━━━━━━━

Gold didapatkan dari aktivitas memancing.

💱 *Kurs penukaran:*
100 Gold = 1 Coin
1.000 Gold = 10 Coin

/tukarcoin <jumlah_coin>
Menukar Gold menjadi Coin.

Contoh:
/tukarcoin 10

━━━━━━━━━━━━━━━━━━
🎰 *6. GACHA*
━━━━━━━━━━━━━━━━━━

/gacha
Melakukan Gacha 1 kali.
Biaya: 1 Coin.

/gacha 10
Melakukan Gacha 10 kali.
Biaya: 9 Coin.

🎣 Gacha dapat memberikan joran Secret/Mythical.
🎒 Gacha juga memiliki item hadiah dan 5 jenis ampas.

━━━━━━━━━━━━━━━━━━
🔨 *7. LELANG IKAN*
━━━━━━━━━━━━━━━━━━

/lelang
Melihat bantuan sistem lelang.

/lelang lihat
Melihat semua lelang aktif.

/lelang jual <nomor> <harga>
Melelangkan ikan dari inventory.

Contoh:
/lelang jual 1 500

/lelang bid <id> <harga>
Menawar ikan pada lelang.

Contoh:
/lelang bid 1 700

📌 Aturan utama:
⏱️ Durasi awal 1 menit.
🔥 Setiap bid valid +30 detik.
♾️ Tidak ada batas maksimum waktu.
🏆 Bid tertinggi menang.
↩️ Tanpa bid, ikan tetap kembali/tersedia untuk pemilik.

━━━━━━━━━━━━━━━━━━
🏆 *8. PEMAIN*
━━━━━━━━━━━━━━━━━━

/daftar <nama>
Mendaftarkan pemain baru.

/leaderboard
Melihat leaderboard pemain.

/menu
Menampilkan menu ini lagi.

━━━━━━━━━━━━━━━━━━
🤖 *9. AI CHAT*
━━━━━━━━━━━━━━━━━━

Mention/panggil *Wancana Bot* di chat untuk bertanya ke AI.



━━━━━━━━━━━━━━━━━━
🚧 *10. TEBAK GAMBAR*
━━━━━━━━━━━━━━━━━━

Fitur Tebak Gambar sedang dalam pengembangan.
Database untuk sistem pertanyaan, jawaban, skor,
dan game aktif sudah disiapkan.

━━━━━━━━━━━━━━━━━━
📌 *CARA MAIN UNTUK PEMULA*
━━━━━━━━━━━━━━━━━━

1️⃣ Daftar:
/daftar NamaKamu

2️⃣ Mancing:
/mancing

3️⃣ Cek hasil:
/inventory
/profile

4️⃣ Kumpulkan Gold.

5️⃣ Beli joran:
/toko
/belirod bamboo

6️⃣ Pakai joran:
/joran
/pilihjoran bamboo

7️⃣ Gunakan item:
/item
/pakaiitem <id_item>

8️⃣ Tukarkan Gold:
/tukarcoin 10

9️⃣ Gacha:
/gacha
/gacha 10

🔟 Ikut atau buka lelang:
/lelang
/lelang lihat

🎯 *Tujuanmu:*
Dapatkan ikan langka, joran Secret/Mythical,
item khusus, Gold sebanyak mungkin,
dan jadilah pemancing terbaik di Wancana!

━━━━━━━━━━━━━━━━━━
🌊 *SELAMAT MEMANCING!*
━━━━━━━━━━━━━━━━━━
`.trim();

export function getMenuImagePath() {
  return path.join(
    __dirname,
    "../../assets/wancanaBanner.jfif",
  );
}
