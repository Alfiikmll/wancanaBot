import pool from "../databases/database.js";

export async function getLeaderboard() {
  const [players] = await pool.query(
    `SELECT name, level, exp, gold
     FROM players
     ORDER BY level DESC, exp DESC, gold DESC
     LIMIT 10`,
  );

  if (players.length === 0) {
    return {
      success: true,
      message: "🏆 Belum ada pemain.",
    };
  }

  let message = "🏆 *LEADERBOARD WANCANA BOT*\n\n";

  players.forEach((player, index) => {
    let medal = `${index + 1}.`;

    if (index === 0) medal = "🥇";
    if (index === 1) medal = "🥈";
    if (index === 2) medal = "🥉";

    message += `${medal} ${player.name}\n`;
    message += `   ⭐ Level: ${player.level}\n`;
    message += `   ✨ EXP: ${player.exp}\n`;
    message += `   💰 Gold: ${player.gold}\n\n`;
  });

  return {
    success: true,
    message: message.trim(),
    players,
  };
}