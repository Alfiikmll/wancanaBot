import pool from "../databases/database.js";

import {
  getNormalRods,
  getRodById,
} from "./rodSystem.js";

export async function getRodShop(
  whatsappId,
) {
  const rods =
    getNormalRods();

  if (
    rods.length === 0
  ) {
    return {
      success: false,
      message:
        "❌ Toko joran sedang kosong.",
    };
  }

  const [playerRows] =
    await pool.query(
      `
      SELECT
        id,
        name,
        gold
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

  const [ownedRows] =
    await pool.query(
      `
      SELECT rod_id
      FROM player_rods
      WHERE player_id = ?
      `,
      [player.id],
    );

  const ownedRodIds =
    new Set(
      ownedRows.map(
        (row) => row.rod_id,
      ),
    );

  let message =
    "🛒 *TOKO JORAN NORMAL*\n\n";

  message +=
    `👤 Pemain: ${player.name}\n`;

  message +=
    `💰 Gold kamu: ${player.gold}\n\n`;

  for (
    const [
      index,
      rod,
    ] of rods.entries()
  ) {
    const owned =
      ownedRodIds.has(
        rod.id,
      );

    const price =
      rod.price === 0
        ? "GRATIS"
        : `${rod.price} Gold`;

    const status =
      owned
        ? "✅ Sudah dimiliki"
        : "🛒 Bisa dibeli";

    message +=
      `${index + 1}. 🎣 *${rod.name}*\n` +
      `🆔 ID: ${rod.id}\n` +
      `💰 Harga: ${price}\n` +
      `${status}\n`;

    if (rod.skill) {
      message +=
        `⚡ Skill: ${rod.skill.name}\n` +
        `🎲 Chance: ${rod.skill.chance}%\n`;
    }

    message += "\n";
  }

  message +=
    "📌 *CARA MEMBELI*\n" +
    "/belirod <id_joran>\n\n" +
    "Contoh:\n" +
    "/belirod bamboo\n" +
    "/belirod diamond";

  return {
    success: true,
    message:
      message.trim(),
  };
}

export async function buyRod(
  whatsappId,
  rodId,
) {
  const rod =
    getRodById(rodId);

  if (!rod) {
    return {
      success: false,
      message:
        "❌ Joran tersebut tidak ditemukan.",
    };
  }

  if (
    rod.type !== "normal"
  ) {
    return {
      success: false,
      message:
        "❌ Joran ini tidak dijual di toko normal.",
    };
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [players] =
      await connection.query(
        `
        SELECT
          id,
          name,
          gold
        FROM players
        WHERE whatsapp_id = ?
        FOR UPDATE
        `,
        [whatsappId],
      );

    if (
      players.length === 0
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
      };
    }

    const player =
      players[0];

    const [ownedRows] =
      await connection.query(
        `
        SELECT id
        FROM player_rods
        WHERE player_id = ?
          AND rod_id = ?
        LIMIT 1
        `,
        [
          player.id,
          rod.id,
        ],
      );

    if (
      ownedRows.length > 0
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          `❌ Kamu sudah memiliki ${rod.name}.`,
      };
    }

    if (
      rod.price === 0
    ) {
      await connection.query(
        `
        INSERT INTO player_rods
        (
          player_id,
          rod_id,
          obtained_from
        )
        VALUES (?, ?, 'shop')
        `,
        [
          player.id,
          rod.id,
        ],
      );

      await connection.commit();

      return {
        success: true,
        message:
          `🎉 *JORAN DIDAPATKAN!*\n\n` +
          `🎣 ${rod.name}\n` +
          `💰 Harga: GRATIS\n\n` +
          `Gunakan:\n` +
          `/pilihjoran ${rod.id}`,
      };
    }

    if (
      Number(player.gold) <
      Number(rod.price)
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          `❌ Gold kamu tidak cukup.\n\n` +
          `💰 Gold kamu: ${player.gold}\n` +
          `💸 Harga ${rod.name}: ${rod.price} Gold`,
      };
    }

    await connection.query(
      `
      UPDATE players
      SET gold = gold - ?
      WHERE id = ?
      `,
      [
        rod.price,
        player.id,
      ],
    );

    await connection.query(
      `
      INSERT INTO player_rods
      (
        player_id,
        rod_id,
        obtained_from
      )
      VALUES (?, ?, 'shop')
      `,
      [
        player.id,
        rod.id,
      ],
    );

    await connection.commit();

    return {
      success: true,
      message:
        `🎉 *JORAN BERHASIL DIBELI!*\n\n` +
        `🎣 ${rod.name}\n` +
        `💰 Harga: ${rod.price} Gold\n` +
        `💰 Sisa Gold: ${
          Number(player.gold) -
          Number(rod.price)
        }\n\n` +
        `Gunakan:\n` +
        `/pilihjoran ${rod.id}`,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Buy rod error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Terjadi kesalahan saat membeli joran.",
    };
  } finally {
    connection.release();
  }
}