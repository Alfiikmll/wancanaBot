
import pool from "../databases/database.js";
import { getRarityEmoji } from "./raritySystem.js";

async function getPlayerByWhatsApp(
  connection,
  whatsappId,
) {
  const [players] =
    await connection.query(
      `
      SELECT id, gold
      FROM players
      WHERE whatsapp_id = ?
      FOR UPDATE
      `,
      [whatsappId],
    );

  return players[0] || null;
}

export async function sellAllFish(
  whatsappId,
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const player =
      await getPlayerByWhatsApp(
        connection,
        whatsappId,
      );

    if (!player) {
      await connection.rollback();

      return {
        success: false,
        message:
          "Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
      };
    }

    // Hanya ikan yang TIDAK sedang dilelang.
    const [fishRows] =
      await connection.query(
        `
        SELECT
          pi.id,
          pi.gold
        FROM player_inventory pi
        WHERE pi.player_id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM auction_listings a
            WHERE a.player_inventory_id = pi.id
              AND a.status = 'active'
          )
        ORDER BY pi.caught_at DESC, pi.id DESC
        FOR UPDATE
        `,
        [player.id],
      );

    if (fishRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "Tidak ada ikan yang bisa dijual.\n" +
          "Ikan yang sedang dilelang tetap dikunci.",
      };
    }

    const totalGold =
      fishRows.reduce(
        (total, row) =>
          total + Number(row.gold),
        0,
      );

    const fishIds =
      fishRows.map(
        (row) => row.id,
      );

    // Buat placeholder (?, ?, ?, ...)
    const placeholders =
      fishIds
        .map(() => "?")
        .join(", ");

    // Hanya hapus ikan yang memang lolos filter
    // dan bukan ikan auction aktif.
    await connection.query(
      `
      DELETE FROM player_inventory
      WHERE player_id = ?
        AND id IN (${placeholders})
        AND NOT EXISTS (
          SELECT 1
          FROM auction_listings a
          WHERE a.player_inventory_id = player_inventory.id
            AND a.status = 'active'
        )
      `,
      [
        player.id,
        ...fishIds,
      ],
    );

    await connection.query(
      `
      UPDATE players
      SET gold = gold + ?
      WHERE id = ?
      `,
      [
        totalGold,
        player.id,
      ],
    );

    await connection.commit();

    return {
      success: true,
      message:
        `💰 *SEMUA IKAN BERHASIL DIJUAL*\n\n` +
        `🐟 Jumlah ikan terjual: ${fishRows.length}\n` +
        `💵 Total Gold didapat: +${totalGold}\n\n` +
        `💰 Gold sekarang: ${Number(player.gold) + totalGold}`,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Sell all fish error:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat menjual semua ikan.",
    };
  } finally {
    connection.release();
  }
}

export async function sellFishByIndex(
  whatsappId,
  fishIndex,
) {
  const index =
    Number(fishIndex);

  if (
    !Number.isInteger(index) ||
    index <= 0
  ) {
    return {
      success: false,
      message:
        "Nomor ikan harus berupa angka yang valid.",
    };
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const player =
      await getPlayerByWhatsApp(
        connection,
        whatsappId,
      );

    if (!player) {
      await connection.rollback();

      return {
        success: false,
        message:
          "Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
      };
    }

    // URUTAN HARUS SAMA DENGAN /inventory
    const [fishRows] =
      await connection.query(
        `
        SELECT
          id,
          fish_name,
          rarity,
          weight,
          gold
        FROM player_inventory
        WHERE player_id = ?
        ORDER BY caught_at DESC, id DESC
        `,
        [player.id],
      );

    if (fishRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "Inventory kamu masih kosong.",
      };
    }

    // VALIDASI DULU sebelum selectedFish.id dipakai.
    const selectedFish =
      fishRows[index - 1];

    if (!selectedFish) {
      await connection.rollback();

      return {
        success: false,
        message:
          `Ikan nomor ${index} tidak ditemukan.\n` +
          `Gunakan /inventory untuk melihat daftar ikan.`,
      };
    }

    // Pastikan ikan belum sedang dilelang.
    const [activeAuctionRows] =
      await connection.query(
        `
        SELECT id
        FROM auction_listings
        WHERE player_inventory_id = ?
          AND status = 'active'
        LIMIT 1
        `,
        [selectedFish.id],
      );

    if (activeAuctionRows.length > 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "🔒 Ikan tersebut sedang dilelang.\n\n" +
          "Ikan harus menyelesaikan lelang terlebih dahulu.",
      };
    }

    // Lock row ikan sebelum menghapusnya.
    const [lockedFishRows] =
      await connection.query(
        `
        SELECT
          id,
          fish_name,
          rarity,
          weight,
          gold
        FROM player_inventory
        WHERE id = ?
          AND player_id = ?
        FOR UPDATE
        `,
        [
          selectedFish.id,
          player.id,
        ],
      );

    if (lockedFishRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Ikan sudah tidak tersedia.",
      };
    }

    const lockedFish =
      lockedFishRows[0];

    await connection.query(
      `
      DELETE FROM player_inventory
      WHERE id = ?
        AND player_id = ?
      `,
      [
        lockedFish.id,
        player.id,
      ],
    );

    await connection.query(
      `
      UPDATE players
      SET gold = gold + ?
      WHERE id = ?
      `,
      [
        lockedFish.gold,
        player.id,
      ],
    );

    await connection.commit();

    return {
      success: true,
      message:
        `💰 *IKAN BERHASIL DIJUAL*\n\n` +
        `🐟 Ikan: ${lockedFish.fish_name}\n` +
        `⭐ Rarity: ${getRarityEmoji(lockedFish.rarity)} ${lockedFish.rarity}\n` +
        `⚖️ Berat: ${Number(lockedFish.weight).toFixed(2)} kg\n` +
        `💵 Gold didapat: +${lockedFish.gold}\n\n` +
        `💰 Gold sekarang: ${Number(player.gold) + Number(lockedFish.gold)}`,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Sell fish by index error:",
      error,
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat menjual ikan.",
    };
  } finally {
    connection.release();
  }
}

