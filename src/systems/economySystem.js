import pool from "../databases/database.js";

export async function addPlayerRewards(
  playerId,
  exp,
  gold,
) {
  const [players] = await pool.query(
    "SELECT * FROM players WHERE id = ?",
    [playerId],
  );

  if (players.length === 0) {
    return {
      success: false,
      message: "Pemain tidak ditemukan.",
    };
  }

  const player = players[0];

  let newExp = player.exp + exp;
  let newLevel = player.level;

  const requiredExp = newLevel * 100;

  if (newExp >= requiredExp) {
    newExp -= requiredExp;
    newLevel += 1;
  }

  await pool.query(
    `UPDATE players
     SET exp = ?, level = ?, gold = gold + ?
     WHERE id = ?`,
    [newExp, newLevel, gold, playerId],
  );

  return {
    success: true,
    oldLevel: player.level,
    newLevel,
    expGained: exp,
    goldGained: gold,
    currentExp: newExp,
  };
}