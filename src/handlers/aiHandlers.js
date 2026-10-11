import { askGemini } from "../AI/aiChat.js";
import { AI_CONFIG } from "../AI/aiConfig.js";
import {
  formatTranscript,
  getRecentMessages,
  rememberMessage,
} from "../AI/chatMemory.js";
import { markBotSpoke } from "../AI/autoJoin.js";

const SKIP_PATTERN = /^\s*\[?\s*SKIP\s*\]?\s*[.!]?\s*$/i;

const ERROR_TEXT =
  "Maaf tunggu sebentar kemungkinan ada masalah terhadap AI kami, HUBUNGI dev kami jika terjadi masalah.";

async function generateReply(chatId, senderName, mode) {
  const limit =
    mode === "auto"
      ? AI_CONFIG.memory.autoContextMessages
      : AI_CONFIG.memory.directContextMessages;

  const history = await getRecentMessages(chatId, limit);

  const instruction =
    mode === "auto"
      ? "Kamu ikut nimbrung. Komentari obrolan terakhir kalau pantas, atau balas [SKIP]."
      : `Sekarang balas pesan terakhir dari ${senderName}.`;

  const prompt = `[Riwayat chat terbaru]\n${formatTranscript(history)}\n\n${instruction}`;

  return askGemini(prompt, { mode });
}

/**
 * Bot DIMINTA menjawab (di-tag, /ai, balas pesan bot, atau chat pribadi).
 * Tidak ada batas jumlah pertanyaan.
 * Pesan user sudah disimpan ke memori sebelum fungsi ini dipanggil.
 */
export async function handleAIMessage(sock, chatId, senderName) {
  const answer = await generateReply(chatId, senderName, "direct");

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