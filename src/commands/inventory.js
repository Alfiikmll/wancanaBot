import pool from "../databases/database.js";

import {
  getRarityEmoji,
} from "../systems/raritySystem.js";

export async function getInventory(
  whatsappId,
) {
  try {
    const [players] =
      await pool.query(
        `
        SELECT
          id,
          name
        FROM players
        WHERE whatsapp_id = ?
        LIMIT 1
        `,
        [whatsappId],
      );

    if (
      players.length === 0
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
      players[0];

    const [inventory] =
      await pool.query(
        `
        SELECT
          pi.id,
          pi.fish_name,
          pi.rarity,
          pi.weight,
          pi.exp,
          pi.gold,
          pi.caught_at,
          EXISTS (
            SELECT 1
            FROM auction_listings a
            WHERE a.player_inventory_id = pi.id
              AND a.status = 'active'
          ) AS is_auctioned
        FROM player_inventory pi
        WHERE pi.player_id = ?
        ORDER BY
          pi.caught_at DESC,
          pi.id DESC
        `,
        [player.id],
      );

    if (
      inventory.length === 0
    ) {
      return {
        success: true,
        message:
          "🎒 Inventory kamu masih kosong.",
      };
    }

    let message =
      `🎒 *INVENTORY ${player.name}*\n\n`;

    inventory.forEach(
      (item, index) => {
        const lock =
          item.is_auctioned
            ? "\n   🔒 *SEDANG DILELANG*"
            : "";

        message +=
          `${index + 1}. 🐟 ${item.fish_name}${lock}\n` +
          `   🆔 ID ikan: ${item.id}\n` +
          `   ⭐ Rarity: ${getRarityEmoji(
            item.rarity,
          )} ${item.rarity}\n` +
          `   ⚖️ Berat: ${Number(
            item.weight,
          ).toFixed(2)} kg\n` +
          `   ✨ EXP: ${item.exp}\n` +
          `   💰 Gold: ${item.gold}\n\n`;
      },
    );

    return {
      success: true,
      message:
        message.trim(),
    };
  } catch (error) {
    console.error(
      "Error getInventory:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Terjadi kesalahan saat mengambil inventory.",
    };
  }
}