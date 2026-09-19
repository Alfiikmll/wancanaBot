
import {
  getRodById,
} from "../systems/rodSystem.js";

import {
  rollSkillChance,
} from "../systems/rodSkillSystem.js";

// =========================================================
// CONFIG
// =========================================================

const TEST_AMOUNT = 1000;

// Rod yang ingin diuji
const rodsToTest = [
  "bamboo",
  "elastic",
  "iron",
  "gold",
  "platinum",
  "diamond",
  "ambatukamm",
  "adulPalembang",
  "bigbosRodd",
  "inkor",
  "adulRayapBesi",
  "superByan",
  "diazAyam",
  "mythical",
];

// =========================================================
// FORMAT
// =========================================================

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

// =========================================================
// TEST SATU JORAN
// =========================================================

function testRodSkill(rodId) {
  const rod = getRodById(rodId);

  if (!rod) {
    console.log(
      `❌ Rod tidak ditemukan: ${rodId}`,
    );
    return;
  }

  if (!rod.skill) {
    console.log(
      `\n🎣 ${rod.name}`,
    );

    console.log(
      "⚪ Tidak memiliki skill.",
    );

    return;
  }

  let activated = 0;

  for (
    let i = 0;
    i < TEST_AMOUNT;
    i += 1
  ) {
    const result =
      rollSkillChance(
        rod.skill.chance,
      );

    if (result) {
      activated += 1;
    }
  }

  const actualChance =
    (activated / TEST_AMOUNT) * 100;

  console.log(
    `\n🎣 ${rod.name}`,
  );

  console.log(
    `⚡ Skill: ${rod.skill.name}`,
  );

  console.log(
    `🎯 Chance teori: ${rod.skill.chance}%`,
  );

  console.log(
    `🎲 Percobaan: ${TEST_AMOUNT}`,
  );

  console.log(
    `✅ Aktif: ${activated} kali`,
  );

  console.log(
    `📊 Chance aktual: ${formatPercent(actualChance)}`,
  );

  const difference =
    Math.abs(
      actualChance -
        rod.skill.chance,
    );

  console.log(
    `📐 Selisih: ${formatPercent(difference)}`,
  );

  if (difference <= 3) {
    console.log(
      "🟢 Hasil chance masih dalam batas wajar.",
    );
  } else {
    console.log(
      "🟡 Hasil agak jauh dari chance teori. Coba jumlah percobaan lebih banyak.",
    );
  }
}

// =========================================================
// START TEST
// =========================================================

console.log(
  "========================================",
);

console.log(
  "🎣 WANCANA BOT — ROD SKILL TEST",
);

console.log(
  "========================================",
);

console.log(
  `Jumlah simulasi per rod: ${TEST_AMOUNT}`,
);

for (
  const rodId
  of rodsToTest
) {
  testRodSkill(rodId);
}

console.log(
  "\n========================================",
);

console.log(
  "✅ TEST SELESAI",
);

console.log(
  "========================================",
);

