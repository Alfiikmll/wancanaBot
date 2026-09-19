import {
  getPlayerItems,
} from "../systems/itemSystem.js";

import {
  getActiveBuff,
} from "../systems/itemBuffSystem.js";

function formatTime(seconds) {
  if (seconds <= 0) {
    return "habis";
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remainingSeconds =
    seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

export async function getItems(
  playerId,
) {
  try {
    const items =
      await getPlayerItems(
        playerId,
      );

    let message =
      "🎒 *ITEM KAMU*\n";

    if (
      items.length === 0
    ) {
      message +=
        "\nKamu belum memiliki item.";
    } else {
      const groupedItems =
        {};

      for (
        const item of items
      ) {
        if (
          !groupedItems[
            item.type
          ]
        ) {
          groupedItems[
            item.type
          ] = [];
        }

        groupedItems[
          item.type
        ].push(item);
      }

      for (
        const [
          type,
          typeItems,
        ] of Object.entries(
          groupedItems,
        )
      ) {
        let title =
          "📦 ITEM";

        if (
          type === "junk"
        ) {
          title =
            "🗑️ AMPAS GACHA";
        } else if (
          type === "food"
        ) {
          title =
            "🍗 MAKANAN";
        } else if (
          type === "boost"
        ) {
          title =
            "✨ BOOST";
        } else if (
          type === "material"
        ) {
          title =
            "⛏️ MATERIAL";
        }

        message +=
          `\n${title}\n`;

        for (
          const item of typeItems
        ) {
          message +=
            `🆔 ID: ${item.item_id}\n` +
            `${item.name} ×${item.quantity}\n` +
            `└ ${item.description}\n\n`;
        }
      }
    }

    const goldBuff =
      getActiveBuff(
        playerId,
        "gold_boost",
      );

    const luckBuff =
      getActiveBuff(
        playerId,
        "luck",
      );

    message +=
      "\n⚡ *BUFF AKTIF*\n";

    if (
      goldBuff ||
      luckBuff
    ) {
      if (goldBuff) {
        message +=
          `💰 Gold Boost: +${
            goldBuff.value * 100
          }%\n` +
          `⏱️ Sisa: ${formatTime(
            goldBuff.remainingSeconds,
          )}\n`;
      }

      if (luckBuff) {
        message +=
          `🍀 Luck: +${
            luckBuff.value * 100
          }%\n` +
          `⏱️ Sisa: ${formatTime(
            luckBuff.remainingSeconds,
          )}\n`;
      }
    } else {
      message +=
        "Tidak ada buff aktif.\n";
    }

    message +=
      "\n📌 *CARA MENGGUNAKAN ITEM*\n" +
      "/pakaiitem <id_item>\n\n" +
      "Contoh:\n" +
      "/pakaiitem ayam_geprekin\n" +
      "/pakaiitem cincin_ambarawa";

    return {
      success: true,
      message:
        message.trim(),
    };
  } catch (error) {
    console.error(
      "Get items error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Gagal mengambil inventory item.",
    };
  }
}