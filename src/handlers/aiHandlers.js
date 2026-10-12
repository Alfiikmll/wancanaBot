import { askGemini } from "../AI/aiChat.js";
import { AI_CONFIG } from "../AI/aiConfig.js";
import {
  IMAGE_CONFIG,
  SEARCH_CONFIG,
  needsSearch,
  takeImageSlot,
  takeSearchSlot,
} from "../AI/aiFeatures.js";
import {
  formatTranscript,
  getRecentMessages,
  rememberMessage,
} from "../AI/chatMemory.js";
import { markBotSpoke } from "../AI/autoJoin.js";
import { getRequestContext } from "../AI/requestContext.js";

// Anggap "skip" kalau ada [SKIP] di mana pun dalam balasan,
// atau balasan cuma berisi kata SKIP.
const SKIP_PATTERN = /\[\s*skip\s*\]|^\s*skip\s*[.!]?\s*$/i;

const ERROR_TEXT =
  "Maaf tunggu sebentar kemungkinan ada masalah terhadap AI kami, HUBUNGI dev kami jika terjadi masalah.";

const IMAGE_ERRORS = {
  unsupported: "🖼️ Format gambarnya belum bisa dibaca. Coba kirim sebagai foto biasa (JPG/PNG).",
  too_big: "🖼️ Gambarnya terlalu besar. Coba kirim yang lebih kecil ya.",
  failed: "🖼️ Wancana gagal membuka gambarnya. Coba kirim ulang ya.",
};

async function generateReply(chatId, senderName, mode, options = {}) {
  const limit =
    mode === "auto"
      ? AI_CONFIG.memory.autoContextMessages
      : AI_CONFIG.memory.directContextMessages;

  const history = await getRecentMessages(chatId, limit);

  const instruction =
    mode === "auto"
      ? "Kamu ikut nimbrung. Komentari obrolan terakhir kalau pantas, atau balas [SKIP]."
      : `Sekarang balas pesan terakhir dari ${senderName}.` +
        (options.image
          ? " Pesan terakhir itu menyertakan sebuah gambar (terlampir)."
          : "");

  const prompt = `[Riwayat chat terbaru]\n${formatTranscript(history)}\n\n${instruction}`;

  // Cari info terbaru hanya kalau pesan terakhir memintanya
  let search = false;

  if (mode === "direct" && SEARCH_CONFIG.enabled) {
    const lastText = history[history.length - 1]?.text ?? "";

    search = needsSearch(lastText) && takeSearchSlot();
  }

  return askGemini(prompt, {
    mode,
    chatId,
    image: options.image ?? null,
    search,
  });
}

/**
 * Bot DIMINTA menjawab (di-tag, /ai, balas pesan bot, atau chat pribadi).
 * Tidak ada batas jumlah pertanyaan.
 * Pesan user sudah disimpan ke memori sebelum fungsi ini dipanggil.
 */
export async function handleAIMessage(sock, chatId, senderName) {
  const { userId, media } = getRequestContext();

  // Ada gambar yang menempel (dikirim bersama pesan atau yang di-reply)
  let image = null;

  if (media && IMAGE_CONFIG.enabled) {
    if (!takeImageSlot(userId)) {
      await sock.sendMessage(chatId, {
        text: `🖼️ Batas baca gambar kamu sudah habis (${IMAGE_CONFIG.maxPerUserPerHour} per jam). Coba lagi nanti ya.`,
      });

      return;
    }

    const result = await media.load();

    if (result.error) {
      await sock.sendMessage(chatId, {
        text: IMAGE_ERRORS[result.error] ?? IMAGE_ERRORS.failed,
      });

      return;
    }

    image = result.image;
  }

  const answer = await generateReply(chatId, senderName, "direct", { image });

  if (!answer) {
    await sock.sendMessage(chatId, { text: ERROR_TEXT });
    return;
  }

  await sock.sendMessage(chatId, { text: answer });
  await rememberMessage(chatId, "model", "Wancana", answer);

  markBotSpoke(chatId);
}

/**
 * Bot IKUT NIMBRUNG sendiri.
 * Kalau gagal / memilih [SKIP], bot diam saja (tanpa pesan error).
 */
export async function handleAutoJoin(sock, chatId, senderName) {
  const answer = await generateReply(chatId, senderName, "auto");

  if (!answer || SKIP_PATTERN.test(answer)) {
    return;
  }

  await sock.sendMessage(chatId, { text: answer });
  await rememberMessage(chatId, "model", "Wancana", answer);
}