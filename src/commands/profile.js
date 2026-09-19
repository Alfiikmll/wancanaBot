import pool from "../databases/database.js";

export async function getProfile(whatsappId) {
  const [players] = await pool.query(
    "SELECT * FROM players WHERE whatsapp_id = ?",
    [whatsappId],
  );

  if (players.length === 0) {
    return {
      success: false,
      message: "Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
    };
  }

  const player = players[0];

  return {
    success: true,
    message: `
🎣 *PROFILE PEMAIN*

👤 Nama: ${player.name}
⭐ Level: ${player.level}
✨ EXP: ${player.exp}
💰 Gold: ${player.gold}
🆔 ID: ${player.whatsapp_id}
    `.trim(),
    player,
  };
}