
import {
  fish,
} from "../systems/fishingSystem.js";

import {
  activateBuff,
  getActiveBuff,
} from "../systems/itemBuffSystem.js";

const TEST_PLAYER_ID = 999999;

// Kita pakai Ambatukamm karena skill-nya
// tidak membutuhkan database item.
// Jadi test ini aman dan tidak menambahkan item.
const TEST_ROD = "ambatukamm";

const TEST_AMOUNT = 50;

function printSeparator() {
  console.log(
    "----------------------------------------",
  );
}

function getAverage(values) {
  if (values.length === 0) {
    return 0;
  }

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return total / values.length;
}

async function runFishingTest(
  label,
) {
  const results = [];

  console.log(`\n🎣 ${label}`);

  for (
    let i = 0;
    i < TEST_AMOUNT;
    i += 1
  ) {
    const result =
      await fish(
        TEST_ROD,
        TEST_PLAYER_ID,
      );

    if (!result.success) {
      throw new Error(
        result.message,
      );
    }

    results.push(result);

    console.log(
      `${i + 1}. ` +
        `${result.fish} | ` +
        `${result.rarity} | ` +
        `${result.formattedWeight} | ` +
        `Gold: ${result.gold} | ` +
        `Skill: ${
          result.skillActivated
            ? "AKTIF"
            : "-"
        }`,
    );
  }

  return results;
}

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "🧪 WANCANA BOT",
  );

  console.log(
    "🎣 FISHING INTEGRATION TEST",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Rod: ${TEST_ROD}`,
  );

  console.log(
    `Jumlah percobaan: ${TEST_AMOUNT}`,
  );

  // =======================================================
  // TEST 1 — NORMAL
  // =======================================================

  printSeparator();

  console.log(
    "🧪 TEST 1 — TANPA BUFF",
  );

  const normalResults =
    await runFishingTest(
      "HASIL NORMAL",
    );

  // =======================================================
  // AKTIFKAN CINCIN AMBARAWA
  // =======================================================

  printSeparator();

  console.log(
    "💍 Mengaktifkan Cincin Ambarawa...",
  );

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
    `✅ Gold Boost aktif: ${
      goldBuff
        ? "YA"
        : "TIDAK"
    }`,
  );

  // =======================================================
  // TEST 2 — GOLD BUFF
  // =======================================================

  printSeparator();

  console.log(
    "🧪 TEST 2 — GOLD +10%",
  );

  const goldResults =
    await runFishingTest(
      "HASIL DENGAN GOLD BOOST",
    );

  // =======================================================
  // AKTIFKAN AYAM GEPREKIN
  // =======================================================

  printSeparator();

  console.log(
    "🍗 Mengaktifkan Ayam Geprekin...",
  );

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
    `✅ Luck aktif: ${
      luckBuff
        ? "YA"
        : "TIDAK"
    }`,
  );

  // =======================================================
  // TEST 3 — GOLD + LUCK
  // =======================================================

  printSeparator();

  console.log(
    "🧪 TEST 3 — GOLD +10% DAN LUCK +50%",
  );

  const boostedResults =
    await runFishingTest(
      "HASIL DENGAN SEMUA BUFF",
    );

  // =======================================================
  // SUMMARY
  // =======================================================

  printSeparator();

  console.log(
    "📊 RINGKASAN HASIL",
  );

  console.log(
    `Normal average Gold : ${getAverage(
      normalResults.map(
        (item) =>
          item.gold,
      ),
    ).toFixed(2)}`,
  );

  console.log(
    `Gold buff average   : ${getAverage(
      goldResults.map(
        (item) =>
          item.gold,
      ),
    ).toFixed(2)}`,
  );

  console.log(
    `Full buff average   : ${getAverage(
      boostedResults.map(
        (item) =>
          item.gold,
      ),
    ).toFixed(2)}`,
  );

  // =======================================================
  // HITUNG AKTIF SKILL
  // =======================================================

  const skillActivations =
    boostedResults.filter(
      (item) =>
        item.skillActivated,
    ).length;

  console.log(
    `\n⚡ Ambatukamm skill aktif: ${skillActivations}/${TEST_AMOUNT}`,
  );

  // =======================================================
  // CEK METADATA
  // =======================================================

  const hasGoldBuff =
    boostedResults.some(
      (item) =>
        item.goldBuff === true,
    );

  const hasLuck =
    boostedResults.some(
      (item) =>
        item.luckBonus === 0.50,
    );

  console.log(
    `💍 Gold buff terdeteksi: ${
      hasGoldBuff
        ? "PASS"
        : "FAIL"
    }`,
  );

  console.log(
    `🍗 Luck +50% terdeteksi: ${
      hasLuck
        ? "PASS"
        : "FAIL"
    }`,
  );

  // =======================================================
  // CEK OUTPUT
  // =======================================================

  const invalidResults =
    boostedResults.filter(
      (item) =>
        !item.fish ||
        !item.rarity ||
        !Number.isFinite(
          Number(item.weight),
        ) ||
        !Number.isFinite(
          Number(item.gold),
        ) ||
        !Number.isFinite(
          Number(item.exp),
        ),
    );

  console.log(
    `🎣 Hasil tangkapan valid: ${
      invalidResults.length === 0
        ? "PASS"
        : "FAIL"
    }`,
  );

  // =======================================================
  // FINAL
  // =======================================================

  printSeparator();

  if (
    hasGoldBuff &&
    hasLuck &&
    invalidResults.length === 0
  ) {
    console.log(
      "✅ FISHING INTEGRATION TEST PASS",
    );
  } else {
    console.log(
      "❌ FISHING INTEGRATION TEST FAIL",
    );
  }

  console.log(
    "========================================",
  );
}

main().catch(
  (error) => {
    console.error(
      "\n❌ TEST ERROR:",
      error,
    );

    process.exit(1);
  },
);

