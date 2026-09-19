import { handleMessage } from "../bot.js";

const fakeSock = {
  sendMessage: async (sender, message) => {
    console.log("\n📨 PESAN BOT:");
    console.log(message.text || message);
  },
};

const sender = "6281234567890@s.whatsapp.net";

console.log("=== MANCING PERTAMA ===");

await handleMessage(
  fakeSock,
  "/mancing",
  sender,
);

console.log("\n=== MANCING KEDUA ===");

await handleMessage(
  fakeSock,
  "/mancing",
  sender,
);