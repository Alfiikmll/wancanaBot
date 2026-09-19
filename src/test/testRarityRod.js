import { getRandomRarity } from "../systems/raritySystem.js";

const results = {};

for (let i = 0; i < 10000; i += 1) {
  const rarity = getRandomRarity(9);

  results[rarity] = (results[rarity] || 0) + 1;
}

console.log(results);

process.exit();