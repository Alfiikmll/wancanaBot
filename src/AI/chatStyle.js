import pool from "../databases/database.js";
import { STYLES } from "./aiFeatures.js";

const cache = new Map(); // chatId -> nama gaya
let tablePromise = null;

function initTable() {
  if (!tablePromise) {
    tablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS ai_chat_styles (
          chat_id VARCHAR(100) PRIMARY KEY,
          style VARCHAR(20) NOT NULL DEFAULT 'default',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `)
      .catch((error) => {
        tablePromise = null;
        throw error;
      });
  }

  return tablePromise;
}

export async function getChatStyle(chatId) {
  if (!chatId) {
    return "default";
  }

  if (cache.has(chatId)) {
    return cache.get(chatId);
  }

  let style = "default";

  try {
    await initTable();

    const [rows] = await pool.query(
      "SELECT style FROM ai_chat_styles WHERE chat_id = ?",
      [chatId],
    );

    if (rows[0]?.style && STYLES[rows[0].style]) {
      style = rows[0].style;
    }
  } catch (error) {
    console.error("Gagal membaca gaya bicara:", error.message);
  }

  cache.set(chatId, style);

  return style;
}

export async function setChatStyle(chatId, style) {
  cache.set(chatId, style);

  try {
    await initTable();

    await pool.query(
      `INSERT INTO ai_chat_styles (chat_id, style)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE style = VALUES(style)`,
      [chatId, style],
    );
  } catch (error) {
    console.error("Gagal menyimpan gaya bicara:", error.message);
  }
}

// Daftar admin bot di .env: BOT_ADMINS=628123456789,628987654321
// Kalau kosong, semua orang boleh mengubah gaya.
function isBotAdmin(userId) {
  const admins = (process.env.BOT_ADMINS || "")
    .split(",")
    .map((number) => number.replace(/\D/g, ""))
    .filter(Boolean);

  if (admins.length === 0) {
    return true;
  }

  return admins.includes(String(userId).split("@")[0]);
}

/**
 * Tangani perintah /aigaya. Mengembalikan true kalau pesan ini perintah /aigaya.
 */
export async function handleStyleCommand(sock, chatId, userId, text) {
  if (text !== "/aigaya" && !text.startsWith("/aigaya ")) {
    return false;
  }

  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(chatId, {
      text: "⚠️ Perintah ini hanya untuk grup.",
    });

    return true;
  }

  const argument = text.replace("/aigaya", "").trim().toLowerCase();

  if (!argument) {
    const current = await getChatStyle(chatId);

    const list = Object.entries(STYLES)
      .map(([name, style]) => `• ${name} → ${style.description}`)
      .join("\n");

    await sock.sendMessage(chatId, {
      text:
        `🎭 *Gaya bicara grup ini: ${current.toUpperCase()}*\n\n` +
        `${list}\n\n` +
        "Ubah: /aigaya santai",
    });

    return true;
  }

  if (!STYLES[argument]) {
    await sock.sendMessage(chatId, {
      text:
        `❌ Gaya "${argument}" tidak ada.\n\n` +
        `Pilihan: ${Object.keys(STYLES).join(", ")}`,
    });

    return true;
  }

  if (!isBotAdmin(userId)) {
    await sock.sendMessage(chatId, {
      text: "⛔ Hanya wancana dev yang bisa mengubah gaya bicara.",
    });

    return true;
  }

  await setChatStyle(chatId, argument);

  await sock.sendMessage(chatId, {
    text:
      `🎭 Gaya bicara diubah ke *${argument.toUpperCase()}* (${STYLES[argument].description}).\n\n` +
      "Tips: ketik /aireset supaya obrolan lama dengan gaya sebelumnya tidak ikut memengaruhi.",
  });

  return true;
}