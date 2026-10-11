import pool from "../databases/database.js";
import { AI_CONFIG } from "./aiConfig.js";

const cfg = AI_CONFIG.memory;

// chatId -> [{ role, name, text, ts }]
const cache = new Map();
const loading = new Map();
const insertCount = new Map();

let tablesPromise = null;

/**
 * Membuat tabel otomatis kalau belum ada,
 * jadi kamu tidak perlu import SQL manual.
 */
export function initAiTables() {
  if (!tablesPromise) {
    tablesPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_memory (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          chat_id VARCHAR(100) NOT NULL,
          role ENUM('user','model') NOT NULL,
          sender_name VARCHAR(100) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_chat_memory_chat_id (chat_id, id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_chat_settings (
          chat_id VARCHAR(100) PRIMARY KEY,
          mode ENUM('tag','auto') NOT NULL DEFAULT 'tag',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
    })().catch((error) => {
      tablesPromise = null; // coba lagi di pemanggilan berikutnya
      throw error;
    });
  }

  return tablesPromise;
}

function clip(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();

  return clean.length > cfg.maxCharsPerMessage
    ? `${clean.slice(0, cfg.maxCharsPerMessage)}…`
    : clean;
}

function cleanName(name) {
  return (
    String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 30) ||
    "Seseorang"
  );
}

async function ensureLoaded(chatId) {
  if (cache.has(chatId)) {
    return;
  }

  if (!loading.has(chatId)) {
    const task = (async () => {
      let messages = [];

      try {
        await initAiTables();

        const [rows] = await pool.query(
          `SELECT role, sender_name, content,
                  UNIX_TIMESTAMP(created_at) * 1000 AS ts
             FROM chat_memory
            WHERE chat_id = ?
            ORDER BY id DESC
            LIMIT ?`,
          [chatId, cfg.ramMessagesPerChat],
        );

        messages = rows.reverse().map((row) => ({
          role: row.role,
          name: row.sender_name,
          text: row.content,
          ts: Number(row.ts),
        }));
      } catch (error) {
        console.error("Gagal memuat memori chat:", error.message);
      }

      cache.set(chatId, messages);
    })().finally(() => loading.delete(chatId));

    loading.set(chatId, task);
  }

  await loading.get(chatId);
}

async function persistMessage(chatId, role, name, content) {
  try {
    await initAiTables();

    await pool.query(
      `INSERT INTO chat_memory (chat_id, role, sender_name, content)
       VALUES (?, ?, ?, ?)`,
      [chatId, role, name, content],
    );

    const count = (insertCount.get(chatId) || 0) + 1;
    insertCount.set(chatId, count);

    // Bersihkan pesan lama tiap 50 pesan baru
    if (count % 50 === 0) {
      await pool.query(
        `DELETE FROM chat_memory
          WHERE chat_id = ?
            AND id <= (
              SELECT id FROM (
                SELECT id FROM chat_memory
                 WHERE chat_id = ?
                 ORDER BY id DESC
                 LIMIT 1 OFFSET ?
              ) AS old_rows
            )`,
        [chatId, chatId, cfg.maxStoredPerChat],
      );
    }
  } catch (error) {
    console.error("Gagal menyimpan memori chat:", error.message);
  }
}

/**
 * Simpan satu pesan ke ingatan.
 * role: "user" (pesan orang) atau "model" (balasan bot).
 */
export async function rememberMessage(chatId, role, senderName, text) {
  const content = clip(text);

  if (!content) {
    return;
  }

  const name = role === "model" ? "Wancana" : cleanName(senderName);

  await ensureLoaded(chatId);

  const list = cache.get(chatId);

  list.push({ role, name, text: content, ts: Date.now() });

  if (list.length > cfg.ramMessagesPerChat) {
    list.splice(0, list.length - cfg.ramMessagesPerChat);
  }

  // Simpan ke database di belakang layar (tidak menunda balasan)
  void persistMessage(chatId, role, name, content);
}

export async function getRecentMessages(chatId, limit) {
  await ensureLoaded(chatId);

  const minTs = Date.now() - cfg.contextMaxAgeHours * 60 * 60 * 1000;

  return cache
    .get(chatId)
    .filter((message) => message.ts >= minTs)
    .slice(-limit);
}

export function formatTranscript(messages) {
  return messages
    .map((message) => `${message.name}: ${message.text}`)
    .join("\n");
}

export async function clearChatMemory(chatId) {
  cache.set(chatId, []);
  insertCount.delete(chatId);

  try {
    await initAiTables();
    await pool.query("DELETE FROM chat_memory WHERE chat_id = ?", [chatId]);
  } catch (error) {
    console.error("Gagal menghapus memori chat:", error.message);
  }
}