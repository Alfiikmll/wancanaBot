import pool from "../databases/database.js";
import { getRodById } from "../systems/rodSystem.js";

export async function chooseRod(whatsappId, rodId) {
  if (!rodId) {
    return {
      success: false,
      message: `
❌ Masukkan ID joran yang ingin digunakan.

Contoh:
 /pilihjoran bamboo
      `.trim(),
    };
  }

  const [players] = await pool.query(
    `SELECT * FROM players WHERE whatsapp_id = ?`,
    [whatsappId],
  );

  if (players.length === 0) {
    return {
      success: false,
      message: "❌ Kamu belum terdaftar.\n\nGunakan: /daftar NamaKamu",
    };
  }

  const player = players[0];
  const rod = getRodById(rodId);

  if (!rod) {
    return {
      success: false,
      message: `
❌ Joran dengan ID "${rodId}" tidak ditemukan.

Gunakan:
 /joran
      `.trim(),
    };
  }

  const [ownedRods] = await pool.query(
    `SELECT * FROM player_rods
     WHERE player_id = ?
     AND rod_id = ?`,
    [player.id, rod.id],
  );

  if (ownedRods.length === 0) {
    return {
      success: false,
      message: `
❌ Kamu belum memiliki ${rod.name}.

Dapatkan joran tersebut terlebih dahulu melalui toko atau gacha.
      `.trim(),
    };
  }

  await pool.query(
    `UPDATE players
     SET current_rod = ?
     WHERE id = ?`,
    [rod.id, player.id],
  );

  return {
    success: true,
    message: `
✅ *JORAN BERHASIL DIGANTI*

👤 Pemain: ${player.name}
🪝 Joran aktif: ${rod.name}

⚡ Bonus:
⭐ Rare Chance: +${rod.bonus.rareChance}%
⚖️ Weight: x${rod.bonus.weightMultiplier}
💰 Gold: x${rod.bonus.goldMultiplier}
✨ EXP: x${rod.bonus.expMultiplier}
    `.trim(),
  };
}