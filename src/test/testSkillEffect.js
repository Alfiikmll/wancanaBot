
import { applyRodSkill } from "../systems/rodSkillSystem.js";

const TEST_PLAYER_ID = 1;

const testFish = {
  fish: "Ikan Hiu",
  rarity: "Rare",
  weight: 100,
  exp: 100,
  gold: 200,
  rod: "Test Rod",
};

const rodsToTest = [
  "ambatukamm",
  "gold",
  "diamond",
  "bigbosRodd",
  "mythical",
];

console.log(
  "========================================",
);

console.log(
  "🧪 WANCANA BOT — SKILL EFFECT TEST",
);

console.log(
  "========================================",
);

for (const rodId of rodsToTest) {
  console.log("\n----------------------------------------");

  console.log(
    `🎣 TEST ROD: ${rodId}`,
  );

  try {
    const result =
      await applyRodSkill(
        rodId,
        { ...testFish },
        TEST_PLAYER_ID,
      );

    console.log(
      `⚡ Skill: ${result.skill?.name || "Tidak ada"}`,
    );

    console.log(
      `🎲 Chance: ${result.skill?.chance ?? 0}%`,
    );

    console.log(
      `✅ Aktif: ${result.activated}`,
    );

    if (result.activated) {
      console.log(
        `⚖️ Berat: ${testFish.weight} → ${result.result.weight}`,
      );

      console.log(
        `💰 Gold: ${testFish.gold} → ${result.result.gold}`,
      );

      console.log(
        `✨ EXP: ${testFish.exp} → ${result.result.exp}`,
      );

      console.log(
        `⬆️ Rarity: ${testFish.rarity} → ${result.result.rarity}`,
      );

      if (result.result.itemReward) {
        console.log(
          `🎁 Item: ${result.result.itemReward.name}`,
        );
      }

      console.log("\n📢 MESSAGE:");

      console.log(
        result.message,
      );
    } else {
      console.log(
        "ℹ️ Skill tidak aktif pada percobaan ini.",
      );
    }
  } catch (error) {
    console.error(
      `❌ Error pada ${rodId}:`,
      error.message,
    );
  }
}

console.log(
  "\n========================================",
);

console.log(
  "✅ EFFECT TEST SELESAI",
);

console.log(
  "========================================",
);

