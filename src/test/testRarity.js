import { getRandomRarity } from "../systems/raritySystem.js";

const result = {
  Common: 0,
  Uncommon: 0,
  Rare: 0,
  Epic: 0,
  Legendary: 0,
  Mythic: 0,
};

for (let i = 0; i < 1000; i += 1) {
  const rarity = getRandomRarity();

  result[rarity] += 1;
}

console.log(result);