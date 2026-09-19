
import pool from "../databases/database.js";

import { getRodById } from "./rodSystem.js";

import { getRandomRarity } from "./raritySystem.js";

import {
  getRandomWeight,
  formatWeight,
} from "./weightSystem.js";

import { applyRodSkill } from "./rodSkillSystem.js";

import {
  getGoldMultiplier,
  getLuckBonus,
} from "./itemBuffSystem.js";

async function getRandomFishByRarity(
  rarity,
) {
  const [fishes] = await pool.query(
    `
    SELECT *
    FROM fish_species
    WHERE rarity = ?
    ORDER BY RAND()
    LIMIT 1
    `,
    [rarity],
  );

  if (fishes.length === 0) {
    return null;
  }

  return fishes[0];
}

const rarityOrder = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

function getNextRarity(rarity) {
  const currentIndex =
    rarityOrder.indexOf(rarity);

  if (currentIndex === -1) {
    return rarity;
  }

  if (
    currentIndex >=
    rarityOrder.length - 1
  ) {
    return rarity;
  }

  return rarityOrder[
    currentIndex + 1
  ];
}

function applyRarityUpgrade(
  rarity,
) {
  return getNextRarity(rarity);
}

export async function fish(
  rodId = "wood",
  playerId,
) {
  const rod =
    getRodById(rodId);

  if (!rod) {
    return {
      success: false,
      message:
        "❌ Joran tidak ditemukan.",
    };
  }

  if (!playerId) {
    return {
      success: false,
      message:
        "❌ Player ID tidak ditemukan.",
    };
  }

  // =====================================================
  // BUFF ITEM AKTIF
  // =====================================================

  const luckBonus =
    getLuckBonus(playerId);

  const goldMultiplier =
    getGoldMultiplier(playerId);

  // =====================================================
  // TENTUKAN RARITY
  // =====================================================

  const rarity =
    getRandomRarity(
      rod.bonus.rareChance,
      luckBonus,
    );

  // =====================================================
  // AMBIL IKAN
  // =====================================================

  let selectedFish =
    await getRandomFishByRarity(
      rarity,
    );

  if (!selectedFish) {
    return {
      success: false,
      message:
        `❌ Belum ada ikan dengan rarity ${rarity} di database.`,
    };
  }

  // =====================================================
  // HITUNG BERAT
  // =====================================================

  let weight =
    getRandomWeight(
      Number(
        selectedFish.min_weight,
      ),
      Number(
        selectedFish.max_weight,
      ),
    );

  weight *=
    rod.bonus.weightMultiplier;

  weight = Number(
    weight.toFixed(2),
  );

  // =====================================================
  // HITUNG EXP
  // =====================================================

  let exp = Math.floor(
    Number(
      selectedFish.base_exp,
    ) *
      rod.bonus.expMultiplier,
  );

  // =====================================================
  // HITUNG GOLD
  // =====================================================

  let gold = Math.floor(
    Number(
      selectedFish.base_gold,
    ) *
      rod.bonus.goldMultiplier,
  );

  // =====================================================
  // BUFF CINCIN AMBARAWA
  // =====================================================

  if (goldMultiplier > 1) {
    gold = Math.floor(
      gold * goldMultiplier,
    );
  }

  // =====================================================
  // DATA HASIL AWAL
  // =====================================================

  let catchResult = {
    fish: selectedFish.name,

    rarity: selectedFish.rarity,

    weight,

    exp,

    gold,

    rod: rod.name,
  };

  // =====================================================
  // ROD SKILL
  // =====================================================

  const skillResult =
    await applyRodSkill(
      rod.id,
      catchResult,
      playerId,
    );

  if (
    skillResult.activated
  ) {
    catchResult =
      skillResult.result;
  }

  // =====================================================
  // SPECIAL RARITY EFFECT
  // =====================================================

  if (
    catchResult.rarityUpgrade ||
    catchResult.legendaryEntrance ||
    catchResult.mythicalUpgrade
  ) {
    let targetRarity =
      catchResult.rarity;

    if (
      catchResult.mythicalUpgrade
    ) {
      targetRarity =
        "Mythic";
    } else if (
      catchResult.legendaryEntrance
    ) {
      targetRarity =
        "Legendary";
    } else if (
      catchResult.rarityUpgrade
    ) {
      targetRarity =
        applyRarityUpgrade(
          catchResult.rarity,
        );
    }

    const upgradedFish =
      await getRandomFishByRarity(
        targetRarity,
      );

    if (upgradedFish) {
      selectedFish =
        upgradedFish;

      catchResult.fish =
        selectedFish.name;

      catchResult.rarity =
        selectedFish.rarity;

      let upgradedWeight =
        getRandomWeight(
          Number(
            selectedFish.min_weight,
          ),
          Number(
            selectedFish.max_weight,
          ),
        );

      upgradedWeight *=
        rod.bonus.weightMultiplier;

      catchResult.weight =
        Number(
          upgradedWeight.toFixed(2),
        );

      catchResult.exp =
        Math.floor(
          Number(
            selectedFish.base_exp,
          ) *
            rod.bonus.expMultiplier,
        );

      catchResult.gold =
        Math.floor(
          Number(
            selectedFish.base_gold,
          ) *
            rod.bonus.goldMultiplier,
        );

      // Gold buff harus tetap berlaku
      // setelah rarity upgrade.
      if (
        goldMultiplier > 1
      ) {
        catchResult.gold =
          Math.floor(
            catchResult.gold *
              goldMultiplier,
          );
      }
    }
  }

  // =====================================================
  // HASIL TAMBAHAN
  // =====================================================

  catchResult.formattedWeight =
    formatWeight(
      catchResult.weight,
    );

  catchResult.skillActivated =
    skillResult.activated;

  catchResult.skillName =
    skillResult.skill?.name ||
    null;

  catchResult.skillChance =
    skillResult.skill?.chance ||
    null;

  catchResult.skillMessage =
    skillResult.message ||
    null;

  catchResult.luckBonus =
    luckBonus;

  catchResult.goldBuff =
    goldMultiplier > 1;

  return {
    success: true,

    ...catchResult,
  };
}

