import "dotenv/config";
import pool from "../databases/database.js";

// OPSIONAL: nama tetap untuk nomor tertentu (tidak bisa ditimpa nama profil).
// Format di .env: AI_MEMBERS=628111111111:Nandika,628222222222:Alifi
function parseFixedMembers() {
  const members = new Map();

  for (const entry of (process.env.AI_MEMBERS || "").split(",")) {
    const index = entry.indexOf(":");

    if (index === -1) {
      continue;
    }

    const number = entry.slice(0, index).replace(/\D/g, "");
    const name = entry.slice(index + 1).trim();

    if (number && name) {
      members.set(number, name);
    }
  }

  return members;
}

const fixed = parseFixedMembers();

// nomor -> nama yang dipelajari otomatis dari nama profil WhatsApp
const learned = new Map();

let loadPromise = null;

function loadMembers() {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ai_members (
            phone VARCHAR(30) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);

        const [rows] = await pool.query(
          "SELECT phone, name FROM ai_members",
        );

        for (const row of rows) {
          learned.set(row.phone, row.name);
        }
      } catch (error) {
        console.error("Gagal memuat daftar member:", error.message);
      }
    })();
  }

  return loadPromise;
}

async function saveMember(number, name) {
  try {
    await pool.query(
      `INSERT INTO ai_members (phone, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [number, name],
    );
  } catch (error) {
    console.error("Gagal menyimpan member:", error.message);
  }
}

// Apakah nama ini sudah dipakai NOMOR LAIN?
function isNameTakenByOther(name, number) {
  const lower = name.toLowerCase();

  for (const source of [fixed, learned]) {
    for (const [phone, other] of source) {
      if (phone !== number && other.toLowerCase() === lower) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Tentukan nama yang dilihat AI untuk pengirim pesan, berdasarkan NOMOR TELEPON.
 *
 * 1. Nomor ada di AI_MEMBERS (.env)  -> pakai nama itu (paling kuat).
 * 2. Nomor sudah pernah chat         -> pakai nama yang tersimpan.
 *    Nama otomatis ikut berubah kalau dia mengganti nama profil,
 *    KECUALI nama barunya sudah dipakai nomor lain (penyamaran).
 * 3. Nomor baru                      -> belajar dari nama profilnya.
 */
export async function resolveMemberName(userId, pushName) {
  await loadMembers();

  const number = String(userId || "")
    .split("@")[0]
    .replace(/\D/g, "");

  const fixedName = fixed.get(number);

  if (fixedName) {
    return fixedName;
  }

  const stored = learned.get(number);

  const display = String(pushName || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);

  if (!display) {
    return stored || "Seseorang";
  }

  if (isNameTakenByOther(display, number)) {
    return stored || `${display} (bukan yang asli)`;
  }

  if (stored !== display) {
    learned.set(number, display);
    void saveMember(number, display);
  }

  return display;
}