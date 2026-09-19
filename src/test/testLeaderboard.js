import { getLeaderboard } from "../commands/leaderboard.js";

const result = await getLeaderboard();

console.log(result.message);