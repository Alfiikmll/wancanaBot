import pool from "../databases/database.js";
import { AI_CONFIG } from "./aiConfig.js";
import { initAiTables } from "./chatMemory.js";

const cfg = AI_CONFIG.autoJoin;

const modeCache = new Map(); // chatId -> "tag" | "auto"
const states = new Map(); // chatId -> { sinceBot, lastBotAt, autoTimes }

// ---------------------------------------------------------
// Mode per grup: "tag" (hanya kalau diminta) / "auto" (nimbrung)
// ---------------------------------------------------------

export async function getChatMode(chatId) {
  if (modeCache.has(chatId)) {
    return modeCache.get(chatId);
  }

  let mode = cfg.defaultMode;

  try {
    await initAiTables();

    const [rows] = await pool.query(
      "SELECT mode FROM ai_chat_settings WHERE chat_id = ?",
      [chatId],
    );

    if (rows[0]?.mode) {
      mode = rows[0].mode;
    }
  } catch (error) {
    console.error("Gagal membaca mode AI:", error.message);
  }

  modeCache.set(chatId, mode);

  return mode;
}

export async function setChatMode(chatId, mode) {
  modeCache.set(chatId, mode);

  try {
    await initAiTables();

    await pool.query(
      `INSERT INTO ai_chat_settings (chat_id, mode)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE mode = VALUES(mode)`,
      [chatId, mode],
    );
  } catch (error) {
    console.error("Gagal menyimpan mode AI:", error.message);
  }
}

// ---------------------------------------------------------
// Keputusan nimbrung
// ---------------------------------------------------------

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const triggerRegex = cfg.triggerWords.length
  ? new RegExp(
      `(?<![\\p{L}\\p{N}])(?:${cfg.triggerWords
        .map(escapeRegex)
        .join("|")})(?![\\p{L}\\p{N}])`,
      "iu",
    )
  : null;

function getState(chatId) {
  if (!states.has(chatId)) {
    states.set(chatId, {
      sinceBot: cfg.minMessagesBetween,
      lastBotAt: 0,
      autoTimes: [],
    });
  }

  return states.get(chatId);
}

/** Panggil setiap kali bot membalas (karena di-tag) agar tidak langsung nimbrung lagi. */
export function markBotSpoke(chatId) {
  const state = getState(chatId);

  state.lastBotAt = Date.now();
  state.sinceBot = 0;
}

/**
 * Putuskan apakah bot ikut nimbrung ke pesan ini.
 * Panggil untuk SETIAP pesan grup biasa (bukan perintah) saat mode "auto".
 */
export function decideAutoJoin(chatId, text) {
  const state = getState(chatId);
  const now = Date.now();

  state.sinceBot += 1;

  if (text.length < cfg.minTextLength) {
    return { join: false, reason: "terlalu pendek" };
  }

  // Hanya emoji / simbol
  if (!/[\p{L}\p{N}]/u.test(text)) {
    return { join: false, reason: "tanpa teks" };
  }

  if (now - state.lastBotAt < cfg.cooldownSeconds * 1000) {
    return { join: false, reason: "cooldown" };
  }

  state.autoTimes = state.autoTimes.filter((t) => now - t < 60 * 60 * 1000);

  if (state.autoTimes.length >= cfg.maxPerHour) {
    return { join: false, reason: "batas per jam" };
  }

  const triggered = triggerRegex ? triggerRegex.test(text) : false;

  if (!triggered && state.sinceBot < cfg.minMessagesBetween) {
    return { join: false, reason: "belum cukup pesan baru" };
  }

  const chance = triggered
    ? cfg.triggerChance
    : text.includes("?")
      ? cfg.questionChance
      : cfg.baseChance;

  if (Math.random() >= chance) {
    return { join: false, reason: "gagal roll" };
  }

  // Langsung "booking" supaya pesan berikutnya tidak ikut memicu bersamaan
  state.lastBotAt = now;
  state.sinceBot = 0;
  state.autoTimes.push(now);

  return { join: true, triggered };
}