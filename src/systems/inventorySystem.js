import pool from "../databases/database.js";

export async function saveCaughtFish(playerId, catchResult) {
  const [result] = await pool.query(
    `INSERT INTO player_inventory
      (player_id, fish_name, rarity, weight, exp, gold)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      playerId,
      catchResult.fish,
      catchResult.rarity,
      catchResult.weight,
      catchResult.exp,
      catchResult.gold,
    ],
  );

  return result.insertId;
}