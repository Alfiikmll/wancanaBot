
import { getRodById } from "./rodSystem.js";
import { addItem } from "./itemSystem.js";

export function rollSkillChance(chance) {
  if (!chance || chance <= 0) {
    return false;
  }

  return Math.random() * 100 < chance;
}

export function getRodSkill(rodId) {
  const rod = getRodById(rodId);

  if (!rod) {
    return null;
  }

  return rod.skill || null;
}

export async function applyRodSkill(
  rodId,
  fishData,
  playerId,
) {
  const rod = getRodById(rodId);

  if (!rod) {
    return {
      activated: false,
      result: fishData,
      message: null,
    };
  }

  const skill = rod.skill;

  if (!skill) {
    return {
      activated: false,
      result: fishData,
      message: null,
    };
  }

  const activated = rollSkillChance(
    skill.chance,
  );

  if (!activated) {
    return {
      activated: false,
      skill,
      result: fishData,
      message: null,
    };
  }

  const result = {
    ...fishData,
  };

  let message =
    `⚡ *SKILL AKTIF!*\n` +
    `✨ ${skill.name}\n` +
    `🎲 Chance: ${skill.chance}%`;

  switch (skill.effect) {
    // =====================================================
    // BAMBOO
    // =====================================================

    case "gold_bonus":
      result.gold = Math.floor(
        result.gold * 1.25,
      );

      message +=
        "\n💰 Gold mendapat bonus 25%!";

      break;

    // =====================================================
    // ELASTIC
    // =====================================================

    case "extra_catch":
      result.extraCatch = true;

      message +=
        "\n🎣 Kesempatan tangkapan tambahan aktif!";

      break;

    // =====================================================
    // IRON
    // =====================================================

    case "weight_bonus":
      result.weight = Number(
        (result.weight * 1.25).toFixed(2),
      );

      message +=
        "\n⚖️ Berat ikan meningkat 25%!";

      break;

    // =====================================================
    // GOLD
    // =====================================================

    case "gold_jackpot":
      result.gold = Math.floor(
        result.gold * 2,
      );

      message +=
        "\n💰 *GOLD JACKPOT!*\n" +
        "Gold hasil tangkapan ×2!";

      break;

    // =====================================================
    // PLATINUM
    // =====================================================

    case "exp_bonus":
      result.exp = Math.floor(
        result.exp * 2,
      );

      message +=
        "\n✨ *EXP BONUS!*\n" +
        "EXP hasil tangkapan ×2!";

      break;

    // =====================================================
    // DIAMOND
    // =====================================================

    case "rarity_upgrade":
      result.rarityUpgrade = true;

      message +=
        "\n💎 *DIAMOND GUARANTEE!*\n" +
        "⬆️ Rarity ikan akan dinaikkan!";

      break;

    // =====================================================
    // AMBATUKAMM
    // =====================================================

    case "double_weight":
      result.weight = Number(
        (result.weight * 2).toFixed(2),
      );

      message +=
        "\n💥 *AMBATUKAMM BURST!*\n" +
        "⚖️ Berat ikan ×2!";

      break;

    // =====================================================
    // BIGBOS
    // =====================================================

    case "bigbos_bonus":
      result.weight = Number(
        (result.weight * 1.5).toFixed(2),
      );

      result.exp = Math.floor(
        result.exp * 2,
      );

      message +=
        "\n👑 *BIGBOS COMMAND!*\n" +
        "⚖️ Berat ikan ×1.5\n" +
        "✨ EXP ×2!";

      break;

    // =====================================================
    // INKOR
    // =====================================================

    case "lele_bonus":
      if (
        result.fish &&
        result.fish
          .toLowerCase()
          .includes("lele")
      ) {
        result.weight = Number(
          (result.weight * 2).toFixed(2),
        );

        result.gold = Math.floor(
          result.gold * 2,
        );

        message +=
          "\n🐟 *LELE EMPIRE!*\n" +
          "⚖️ Berat lele ×2\n" +
          "💰 Gold lele ×2!";
      } else {
        message +=
          "\n🐟 Lele Empire aktif, " +
          "tetapi ikan ini bukan Lele.";
      }

      break;

    // =====================================================
    // ADUL RAYAP BESI
    // =====================================================

    case "iron_material":
  await addItem(
    playerId,
    "cincin_ambarawa",
    1,
  );

  result.itemReward = {
    id: "cincin_ambarawa",
    name: "💍 Cincin Ambarawa",
    quantity: 1,
  };

  message +=
    "\n⛓️ *IRON EATER!*\n" +
    "💍 Kamu menemukan *Cincin Ambarawa*!\n" +
    "✨ Cincinnya berkilau sangat terang!";

  break;

    // =====================================================
    // SUPER BYAN
    // =====================================================

    case "legendary_entrance":
      result.legendaryEntrance = true;

      message +=
        "\n🌟 *LEGENDARY ENTRANCE!*\n" +
        "✨ Tangkapan akan mendapatkan efek Legendary!";

      break;

    // =====================================================
    // DIAZ AYAM
    // =====================================================

    case "food_item":
      await addItem(
        playerId,
        "ayam_geprekin",
        1,
      );

      result.itemReward = {
        id: "ayam_geprekin",
        name: "🍗 Ayam Geprekin",
        quantity: 1,
      };

      message +=
        "\n👨‍🍳 *CHEF LAUT KING DIAZZZ!*\n" +
        "🍗 Kamu mendapatkan *Ayam Geprekin*!\n" +
        "🍀 Item ini bisa memberikan Luck +50% selama 30 detik!";

      break;

    // =====================================================
    // MYTHICAL
    // =====================================================

    case "mythical_upgrade":
      result.mythicalUpgrade = true;

      message +=
        "\n🌌 *MYTHICAL REALITY BREAK!*\n" +
        "✨ Takdir Mythical terbuka!";

      break;

    default:
      message +=
        "\n✨ Skill aktif, tetapi efeknya belum terdaftar.";

      break;
  }

  return {
    activated: true,
    skill,
    result,
    message,
  };
}

