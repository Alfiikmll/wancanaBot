import pool from "../databases/database.js";

const GOLD_PER_EXCHANGE = 100;
const COIN_PER_EXCHANGE = 1;

export async function exchangeGoldToCoins(whatsappId, requestedCoins) {
  const amount = Number(requestedCoins);

  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      success: false,
      message: "Jumlah Coin harus berupa angka lebih dari 0.",
    };
  }

  const requiredGold = amount * GOLD_PER_EXCHANGE;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [players] = await connection.query(
      `
      SELECT id, gold, coins
      FROM players
      WHERE whatsapp_id = ?
      FOR UPDATE
      `,
      [whatsappId],
    );

    if (players.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message: "Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
      };
    }

    const player = players[0];

    if (player.gold < requiredGold) {
      await connection.rollback();

      return {
        success: false,
        message:
          `Gold kamu tidak cukup.\n\n` +
          `Gold sekarang: ${player.gold}\n` +
          `Gold dibutuhkan: ${requiredGold}`,
      };
    }

    await connection.query(
      `
      UPDATE players
      SET gold = gold - ?,
          coins = coins + ?
      WHERE id = ?
      `,
      [requiredGold, amount, player.id],
    );

    await connection.commit();

    return {
      success: true,
      message:
        `💱 PENUKARAN BERHASIL\n\n` +
        `Gold digunakan: ${requiredGold}\n` +
        `Coin didapat: ${amount}\n\n` +
        `Sisa Gold: ${player.gold - requiredGold}\n` +
        `Total Coin: ${player.coins + amount}`,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Coin exchange error:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat menukar Gold.",
    };
  } finally {
    connection.release();
  }
}