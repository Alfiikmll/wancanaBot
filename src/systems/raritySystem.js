
const rarityChances = [
  {
    rarity: "Common",
    chance: 60,
  },
  {
    rarity: "Uncommon",
    chance: 25,
  },
  {
    rarity: "Rare",
    chance: 10,
  },
  {
    rarity: "Epic",
    chance: 4,
  },
  {
    rarity: "Legendary",
    chance: 0.9,
  },
  {
    rarity: "Mythic",
    chance: 0.1,
  },
];

export const rarityDisplay = {
  Common: {
    emoji: "⚪",
    color: "white",
  },

  Uncommon: {
    emoji: "🟢",
    color: "green",
  },

  Rare: {
    emoji: "🔵",
    color: "blue",
  },

  Epic: {
    emoji: "🟣",
    color: "purple",
  },

  Legendary: {
    emoji: "🟡",
    color: "yellow",
  },

  Mythic: {
    emoji: "🔴",
    color: "red",
  },
};

export function getRarityEmoji(rarity) {
  return rarityDisplay[rarity]?.emoji || "⚪";
}

export function getRandomRarity(
  rareBonus = 0,
  luckPercent = 0,
) {
  const luckMultiplier =
    1 + luckPercent;

  const adjustedChances =
    rarityChances.map((item) => {
      // Common dan Uncommon tidak mendapat
      // tambahan dari rod rareChance maupun Luck.
      if (
        item.rarity === "Common" ||
        item.rarity === "Uncommon"
      ) {
        return {
          ...item,
        };
      }

      // Rod bonus tetap berupa tambahan angka.
      // Contoh:
      // Rare 10 + rareBonus 12 = 22
      //
      // Setelah itu Luck memengaruhi peluang rarity
      // langka tersebut.
      const baseChance =
        item.chance + rareBonus;

      return {
        ...item,
        chance:
          baseChance * luckMultiplier,
      };
    });

  const totalChance =
    adjustedChances.reduce(
      (total, item) =>
        total + item.chance,
      0,
    );

  let random =
    Math.random() * totalChance;

  for (const item of adjustedChances) {
    random -= item.chance;

    if (random <= 0) {
      return item.rarity;
    }
  }

  return "Common";
}

