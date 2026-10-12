import pool from "../databases/database.js";
import { askGemini } from "./aiChat.js";
import { AI_CONFIG } from "./aiConfig.js";
import {
  formatTranscript,
  getRecentMessages,
  initAiTables,
  rememberMessage,
} from "./chatMemory.js";
import { boostAutoJoin, markBotSpoke } from "./autoJoin.js";

const cfg = AI_CONFIG.icebreaker;

const startedAt = Date.now();
const states = new Map(); // chatId -> state
let timer = null;
let running = false;

function getState(chatId) {
  if (!states.has(chatId)) {
    states.set(chatId, {
      // Grup dianggap "terakhir ramai" saat bot dinyalakan
      lastActivity: startedAt,
      // Bot tidak membuka topik lagi kalau opener sebelumnya belum ada yang membalas
      humanSinceOpener: true,
      day: "",
      countToday: 0,
    });
  }

  return states.get(chatId);
}

/** Panggil setiap ada pesan masuk dari anggota grup. */
export function touchChatActivity(chatId) {
  if (!chatId?.endsWith("@g.us")) {
    return;
  }

  const state = getState(chatId);

  state.lastActivity = Date.now();
  state.humanSinceOpener = true;
}

function currentHour() {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: cfg.timeZone,
  }).format(new Date());

  return Number(hour);
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: cfg.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isQuietHour() {
  const start = cfg.quietHoursStart;
  const end = cfg.quietHoursEnd;

  if (start === end) {
    return false;
  }

  const hour = currentHour();

  return start > end
    ? hour >= start || hour < end
    : hour >= start && hour < end;
}

async function createOpener(chatId) {
  const history = await getRecentMessages(
    chatId,
    AI_CONFIG.memory.autoContextMessages,
  );

  const idea =
    cfg.topicIdeas[Math.floor(Math.random() * cfg.topicIdeas.length)];

  const prompt =
    `[Riwayat chat terakhir]\n${formatTranscript(history) || "(belum ada obrolan)"}\n\n` +
    `Grup sudah sepi cukup lama. Buka topik obrolan baru.` +
    (idea ? ` Ide topik (boleh diabaikan kalau tidak cocok): ${idea}.` : "");

    return askGemini(prompt, { mode: "icebreaker", chatId });
}

async function openTopic(sock, chatId, state) {
  // "Booking" dulu supaya pengecekan berikutnya tidak tumpang tindih
  const today = todayKey();

  if (state.day !== today) {
    state.day = today;
    state.countToday = 0;
  }

  state.countToday += 1;
  state.lastActivity = Date.now();
  state.humanSinceOpener = false;

  let sent = false;

  try {
    const text = await createOpener(chatId);

    if (text) {
      await sock.sendMessage(chatId, { text });
      await rememberMessage(chatId, "model", "Wancana", text);

      markBotSpoke(chatId);
      boostAutoJoin(chatId, cfg.afterOpenerMinutes);

      sent = true;
    }
  } catch (error) {
    console.error("Gagal membuka topik:", error.message);
  }

  if (!sent) {
    // Gagal: jangan hitung, coba lagi setelah sepi lagi
    state.countToday -= 1;
    state.humanSinceOpener = true;
  }

  return sent;
}

/**
 * Cek semua grup mode "auto" dan buka topik di yang sepi.
 * Diekspor supaya bisa dites.
 */
export async function checkIdleChats(sock) {
  if (!cfg.enabled || running || isQuietHour()) {
    return;
  }

  running = true;

  try {
    let chatIds = [];

    try {
      await initAiTables();

      const [rows] = await pool.query(
        "SELECT chat_id FROM ai_chat_settings WHERE mode = 'auto'",
      );

      chatIds = rows
        .map((row) => row.chat_id)
        .filter((id) => id.endsWith("@g.us"));
    } catch (error) {
      console.error("Gagal membaca daftar grup auto:", error.message);
      return;
    }

    const idleMs = cfg.idleMinutes * 60 * 1000;
    const today = todayKey();

    for (const chatId of chatIds) {
      const state = getState(chatId);

      if (state.day !== today) {
        state.day = today;
        state.countToday = 0;
      }

      if (Date.now() - state.lastActivity < idleMs) continue;
      if (!state.humanSinceOpener) continue;
      if (state.countToday >= cfg.maxPerDay) continue;

      await openTopic(sock, chatId, state);
    }
  } finally {
    running = false;
  }
}

export function stopIcebreaker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** Mulai pengecek berkala. Aman dipanggil ulang saat koneksi tersambung kembali. */
export function startIcebreaker(sock) {
  stopIcebreaker();

  if (!cfg.enabled) {
    return;
  }

  timer = setInterval(
    () => {
      checkIdleChats(sock).catch((error) =>
        console.error("Icebreaker error:", error),
      );
    },
    cfg.checkEveryMinutes * 60 * 1000,
  );
}