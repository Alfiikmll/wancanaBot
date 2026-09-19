import { askGemini } from "../AI/aiChat.js";
import { checkAICooldown } from "../AI/aiCooldown.js";

export async function handleAIMessage(
sock,
chatId,
userId,
userMessage,
) {
// Cooldown dihitung berdasarkan nomor pengguna.
const cooldown = checkAICooldown(userId);

if (!cooldown.allowed) {
await sock.sendMessage(chatId, {
text: `⏳ Kamu sudah memakai 5 pertanyaan karena developer gw masi miskin belom mampu beli
server yang proper jadi\nSilakan tunggu ${cooldown.remaining} detik.`,
});


return;


}

const answer = await askGemini(userMessage);

await sock.sendMessage(chatId, {
text: answer,
});
}
