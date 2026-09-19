import { getInventory } from "../commands/inventory.js";

const result = await getInventory("test-player-001");

console.log(result.message);