import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  jidDecode,
  jidEncode,
} from "@whiskeysockets/baileys";

import pino from "pino";
import qrcode from "qrcode-terminal";

import { handleMessage } from "./bot.js";

function normalizePhoneJid(jid) {
  if (!jid) {
    return null;
  }

  const decoded = jidDecode(jid);

  if (!decoded) {
    return null;
  }

  if (decoded.server !== "s.whatsapp.net") {
    return null;
  }

  return jidEncode(
    decoded.user,
    "s.whatsapp.net",
  );
}

function getUserIdFromMessage(
  message,
  chatId,
) {
  const isGroup =
    chatId?.endsWith("@g.us");

  if (isGroup) {
    /*
     * Grup:
     * chatId = ID grup
     * participant = pengirim
     * participantAlt = alternatif identitas pengirim
     *
     * Kita hanya mengambil nomor telepon.
     */
    return (
      normalizePhoneJid(
        message.key.participant,
      ) ||
      normalizePhoneJid(
        message.key.participantAlt,
      )
    );
  }

  /*
   * Chat pribadi:
   * remoteJid biasanya identitas chat.
   * remoteJidAlt bisa berisi nomor telepon
   * jika remoteJid menggunakan LID.
   */
  return (
    normalizePhoneJid(
      message.key.remoteJid,
    ) ||
    normalizePhoneJid(
      message.key.remoteJidAlt,
    )
  );
}

async function startBot() {
  const {
    state,
    saveCreds,
  } = await useMultiFileAuthState(
    "auth_info",
  );

  const sock = makeWASocket({
    auth: state,
    logger: pino({
      level: "silent",
    }),
    printQRInTerminal: false,
  });

  sock.ev.on(
    "creds.update",
    saveCreds,
  );

  sock.ev.on(
    "connection.update",
    (update) => {
      const {
        connection,
        lastDisconnect,
        qr,
      } = update;

      if (qr) {
        console.log(
          "Scan QR code berikut:",
        );

        qrcode.generate(qr, {
          small: true,
        });
      }

      if (connection === "open") {
        console.log(
          "Wancana Bot berhasil terhubung!",
        );
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error
            ?.output?.statusCode;

        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log(
            "Koneksi terputus, mencoba lagi...",
          );

          startBot();
        } else {
          console.log(
            "Sesi logout. Hapus folder auth_info jika ingin login ulang.",
          );
        }
      }
    },
  );

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {
      for (const message of messages) {
        if (
          !message?.message ||
          message.key.fromMe
        ) {
          continue;
        }

        const chatId =
          message.key.remoteJid;

        if (!chatId) {
          continue;
        }

        const userId =
          getUserIdFromMessage(
            message,
            chatId,
          );

        if (!userId) {
          console.warn(
            "Nomor telepon pengirim tidak berhasil ditemukan.",
            {
              chatId,
              participant:
                message.key.participant,
              participantAlt:
                message.key.participantAlt,
              remoteJidAlt:
                message.key.remoteJidAlt,
            },
          );

          continue;
        }

        /*
         * Ambil text dari beberapa tipe pesan.
         */
        const messageText =
          message.message
            .conversation ||
          message.message
            .extendedTextMessage
            ?.text ||
          message.message
            .imageMessage
            ?.caption ||
          message.message
            .videoMessage
            ?.caption ||
          "";

        const contextInfo =
          message.message
            .extendedTextMessage
            ?.contextInfo;

        const imageContext =
          message.message
            .imageMessage
            ?.contextInfo;

        const videoContext =
          message.message
            .videoMessage
            ?.contextInfo;

        const mentionedJid =
          contextInfo?.mentionedJid ||
          imageContext?.mentionedJid ||
          videoContext?.mentionedJid ||
          [];

        await handleMessage(
          sock,
          messageText,
          chatId,
          userId,
          mentionedJid,
        );
      }
    },
  );
}

startBot();