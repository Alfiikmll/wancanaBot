import pool from "../databases/database.js";

import {
  getPlayerRods,
} from "../systems/playerRodSystem.js";

import {
  getRodById,
} from "../systems/rodSystem.js";

export async function getRods(
  whatsappId,
) {
  try {
    const [playerRows] =
      await pool.query(
        `
        SELECT
          id,
          name,
          current_rod
        FROM players
        WHERE whatsapp_id = ?
        LIMIT 1
        `,
        [whatsappId],
      );

    if (
      playerRows.length === 0
    ) {
      return {
        success: false,
        message:
          "❌ Kamu belum terdaftar.\n\n" +
          "Gunakan:\n" +
          "/daftar NamaKamu",
      };
    }

    const player =
      playerRows[0];

    const playerRods =
      await getPlayerRods(
        player.id,
      );

    if (
      playerRods.length === 0
    ) {
      return {
        success: true,
        message:
          "🎣 *KOLEKSI JORAN*\n\n" +
          "Kamu belum memiliki joran.",
      };
    }

    let message =
      "🎣 *KOLEKSI JORAN KAMU*\n\n";

    message +=
      `👤 Pemain: ${player.name}\n`;

    message +=
      `📦 Total joran: ${playerRods.length}\n\n`;

    for (
      const [
        index,
        ownedRod,
      ] of playerRods.entries()
    ) {
      const rod =
        getRodById(
          ownedRod.id,
        ) ||
        ownedRod;

      const type =
        rod.type === "mythical"
          ? "🌌 MYTHICAL"
          : rod.type === "secret"
            ? "✨ SECRET"
            : "🎣 NORMAL";

      const active =
        player.current_rod ===
        rod.id
          ? " ✅ *AKTIF*"
          : "";

      message +=
        `${index + 1}. ${type}${active}\n` +
        `🪝 ${rod.name}\n` +
        `🆔 ID: ${rod.id}\n` +
        `🎯 Rare Chance: +${rod.bonus.rareChance}%\n` +
        `⚖️ Weight: ×${rod.bonus.weightMultiplier}\n` +
        `💰 Gold: ×${rod.bonus.goldMultiplier}\n` +
        `✨ EXP: ×${rod.bonus.expMultiplier}\n`;

      if (rod.skill) {
        message +=
          `\n⚡ *SKILL*\n` +
          `🔥 ${rod.skill.name}\n` +
          `🎲 Chance: ${rod.skill.chance}%\n` +
          `📖 ${rod.skill.description}\n`;
      } else {
        message +=
          "\n⚡ Skill: Tidak ada\n";
      }

      if (rod.partner) {
        message +=
          `\n👤 Partner: ${rod.partner.name}\n` +
          `💬 "${rod.partner.quote}"\n`;
      }

      message += "\n";
    }

    message +=
      "📌 *CARA MENGGANTI JORAN*\n" +
      "/pilihjoran <id_joran>\n\n" +
      "Contoh:\n" +
      "/pilihjoran bamboo";

    return {
      success: true,
      message:
        message.trim(),
    };
  } catch (error) {
    console.error(
      "Get rods error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Gagal mengambil koleksi joran.",
    };
  }
}