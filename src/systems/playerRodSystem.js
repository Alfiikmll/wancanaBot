import pool from "../databases/database.js";
import { getRodById } from "./rodSystem.js";

export async function getPlayerRods(playerId) {
  const [rows] = await pool.query(
    `SELECT rod_id, obtained_from, obtained_at
     FROM player_rods
     WHERE player_id = ?
     ORDER BY id ASC`,
    [playerId],
  );

  return rows.map((row) => {
    const rod = getRodById(row.rod_id);

    return {
      ...rod,
      obtainedFrom: row.obtained_from,
      obtainedAt: row.obtained_at,
    };
  });
}

export async function hasPlayerRod(
  playerId,
  rodId,
) {
  const [rows] = await pool.query(
    `SELECT id
     FROM player_rods
     WHERE player_id = ?
     AND rod_id = ?`,
    [playerId, rodId],
  );

  return rows.length > 0;
}

export async function addPlayerRod(
  playerId,
  rodId,
  obtainedFrom = "shop",
) {
  const rod = getRodById(rodId);

  if (!rod) {
    return {
      success: false,
      message: "❌ Rod tidak ditemukan.",
    };
  }

  const alreadyOwned = await hasPlayerRod(
    playerId,
    rodId,
  );

  if (alreadyOwned) {
    return {
      success: false,
      message: `❌ Kamu sudah memiliki ${rod.name}.`,
    };
  }

  await pool.query(
    `INSERT INTO player_rods
     (player_id, rod_id, obtained_from)
     VALUES (?, ?, ?)`,
    [playerId, rodId, obtainedFrom],
  );

  return {
    success: true,
    rod,
  };
}