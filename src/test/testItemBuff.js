
import {
  activateBuff,
  getActiveBuff,
  getGoldMultiplier,
  getLuckBonus,
} from "../systems/itemBuffSystem.js";

const TEST_PLAYER_ID = 999999;

console.log(
  "========================================",
);

console.log(
  "🧪 WANCANA BOT — ITEM BUFF TEST",
);

console.log(
  "========================================",
);

// =========================================================
// CINCIN AMBARAWA
// =========================================================

console.log("\n💍 TEST CINCIN AMBARAWA");

activateBuff(
  TEST_PLAYER_ID,
  "gold_boost",
  0.10,
  300,
);

const goldBuff =
  getActiveBuff(
    TEST_PLAYER_ID,
    "gold_boost",
  );

console.log(
  `✅ Buff aktif: ${goldBuff !== null}`,
);

console.log(
  `💰 Gold multiplier: ${getGoldMultiplier(TEST_PLAYER_ID)}`,
);

console.log(
  `⏱️ Sisa waktu: ${goldBuff?.remainingSeconds}s`,
);

// =========================================================
// AYAM GEPREKIN
// =========================================================

console.log("\n🍗 TEST AYAM GEPREKIN");

activateBuff(
  TEST_PLAYER_ID,
  "luck",
  0.50,
  30,
);

const luckBuff =
  getActiveBuff(
    TEST_PLAYER_ID,
    "luck",
  );

console.log(
  `✅ Buff aktif: ${luckBuff !== null}`,
);

console.log(
  `🍀 Luck bonus: ${getLuckBonus(TEST_PLAYER_ID) * 100}%`,
);

console.log(
  `⏱️ Sisa waktu: ${luckBuff?.remainingSeconds}s`,
);

// =========================================================
// HASIL
// =========================================================

console.log(
  "\n========================================",
);

console.log(
  "📊 HASIL TEST",
);

console.log(
  "========================================",
);

if (
  goldBuff &&
  getGoldMultiplier(TEST_PLAYER_ID) === 1.10
) {
  console.log(
    "✅ Cincin Ambarawa: PASS",
  );
} else {
  console.log(
    "❌ Cincin Ambarawa: FAIL",
  );
}

if (
  luckBuff &&
  getLuckBonus(TEST_PLAYER_ID) === 0.50
) {
  console.log(
    "✅ Ayam Geprekin: PASS",
  );
} else {
  console.log(
    "❌ Ayam Geprekin: FAIL",
  );
}

console.log(
  "\n✅ TEST ITEM BUFF SELESAI",
);

console.log(
  "========================================",
);

