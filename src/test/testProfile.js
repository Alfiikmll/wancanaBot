import { getProfile } from "../commands/profile.js";

const result = await getProfile("test-player-001");

console.log(result.message);