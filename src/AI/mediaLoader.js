import { downloadMediaMessage } from "@whiskeysockets/baileys";
import pino from "pino";
import { IMAGE_CONFIG } from "./aiFeatures.js";

const logger = pino({ level: "silent" });

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function createSource(sock, target, mimeType) {
  return {
    // Gambar baru diunduh saat benar-benar dibutuhkan (hemat bandwidth)
    async load() {
      const mime = String(mimeType || "image/jpeg").split(";")[0].trim();

      if (!ALLOWED_TYPES.has(mime)) {
        return { error: "unsupported" };
      }

      try {
        const buffer = await downloadMediaMessage(
          target,
          "buffer",
          {},
          {
            logger,
            reuploadRequest: sock.updateMediaMessage,
          },
        );

        if (!buffer || buffer.length === 0) {
          return { error: "failed" };
        }

        if (buffer.length > IMAGE_CONFIG.maxBytes) {
          return { error: "too_big" };
        }

        return {
          image: {
            mimeType: mime,
            data: buffer.toString("base64"),
          },
        };
      } catch (error) {
        console.error("Gagal mengunduh gambar:", error.message);

        return { error: "failed" };
      }
    },
  };
}

/**
 * Cari gambar pada pesan: gambar yang dikirim bersama pesan,
 * atau gambar yang sedang di-reply. Mengembalikan null kalau tidak ada.
 */
export function buildImageSource(sock, message, chatId) {
  const own = message?.message?.imageMessage;

  if (own) {
    return createSource(sock, message, own.mimetype);
  }

  const contextInfo = message?.message?.extendedTextMessage?.contextInfo;
  const quoted = contextInfo?.quotedMessage?.imageMessage;

  if (quoted && contextInfo?.stanzaId) {
    return createSource(
      sock,
      {
        key: {
          remoteJid: chatId,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant,
          fromMe: false,
        },
        message: { imageMessage: quoted },
      },
      quoted.mimetype,
    );
  }

  return null;
}