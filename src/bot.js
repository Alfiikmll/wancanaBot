import {
  menuCaption,
  getMenuImagePath,
} from "./commands/menu.js";

import { daftarPlayer } from "./commands/daftar.js";
import { getProfile } from "./commands/profile.js";
import { getInventory } from "./commands/inventory.js";
import { getLeaderboard } from "./commands/leaderboard.js";
import { getRods } from "./commands/joran.js";
import { chooseRod } from "./commands/pilihJoran.js";
import { getItems } from "./commands/item.js";
import { useItem } from "./commands/pakaiItem.js";
import {
  handleAuctionCommand,
} from "./commands/lelang.js";

import { fish } from "./systems/fishingSystem.js";
import {
  getRarityEmoji,
} from "./systems/raritySystem.js";
import {
  saveCaughtFish,
} from "./systems/inventorySystem.js";
import {
  addPlayerRewards,
} from "./systems/economySystem.js";

import {
  checkFishingCooldown,
  startFishingCooldown,
} from "./systems/fishingCooldown.js";

import {
  getRodShop,
  buyRod,
} from "./systems/rodPurchaseSystem.js";

import {
  handleGuessCommand,
  handleGuessAnswer,
} from "./commands/tebakGambar.js";

import {
  exchangeGoldToCoins,
} from "./systems/coinExchangeSystem.js";

import {
  sellAllFish,
  sellFishByIndex,
} from "./systems/sellFishSystem.js";

import {
  getActiveBuff,
} from "./systems/itemBuffSystem.js";

import {
gacha,
getGachaRodList,
} from "./systems/gachaSystem.js";


import {
  handleAIMessage,
  handleAutoJoin,
} from "./handlers/aiHandlers.js";

import {
  clearChatMemory,
  rememberMessage,
} from "./AI/chatMemory.js";

import {
  decideAutoJoin,
  getChatMode,
  setChatMode,
} from "./AI/autoJoin.js";

import {
  areJidsSameUser,
} from "@whiskeysockets/baileys";

function isBotMentioned(
  sock,
  mentionedJid = [],
) {
  const botIds = [
    sock.user?.id,
    sock.user?.lid,
    sock.user?.phoneNumber,
  ].filter(Boolean);

  return mentionedJid.some(
    (mentioned) =>
      botIds.some(
        (botId) =>
          areJidsSameUser(
            mentioned,
            botId,
          ),
      ),
  );
}

function getBotNumbers(sock) {
  return [
    sock.user?.id,
    sock.user?.lid,
    sock.user?.phoneNumber,
  ]
    .filter(Boolean)
    .map((jid) => jid.split("@")[0].split(":")[0]);
}

// Bersihkan teks sebelum disimpan ke memori / dikirim ke AI:
// buang "/ai", ganti mention bot jadi "Wancana", mention lain jadi "@user".
function cleanMessageText(sock, text) {
  let result = text.replace(/^\/ai\b\s*/i, "");

  for (const number of getBotNumbers(sock)) {
    result = result.replaceAll(`@${number}`, "Wancana");
  }

  return result
    .replace(/@\d{5,}/g, "@user")
    .replace(/\s+/g, " ")
    .trim();
}

// Daftar admin bot di .env: BOT_ADMINS=628123456789,628987654321
// Kalau kosong, semua orang boleh mengubah mode.
function isBotAdmin(userId) {
  const admins = (process.env.BOT_ADMINS || "")
    .split(",")
    .map((number) => number.replace(/\D/g, ""))
    .filter(Boolean);

  if (admins.length === 0) {
    return true;
  }

  return admins.includes(userId.split("@")[0]);
}

export async function handleMessage(
  sock,
  messageText,
  chatId,
  userId,
  mentionedJid = [],
  senderName = "Seseorang",
  quotedJid = null,
) {
  if (
    !messageText ||
    !userId
  ) {
    return;
  }

  const isGroup =
    chatId?.endsWith("@g.us");

  // =========================================================
  // MENU
  // =========================================================

  if (messageText === "/menu") {
    await sock.sendMessage(chatId, {
      image: {
        url: getMenuImagePath(),
      },
      caption: menuCaption,
    });

    return;
  }

  // =========================================================
  // MODE AI GRUP (/aimode) & RESET INGATAN (/aireset)
  // =========================================================

  if (
    messageText === "/aimode" ||
    messageText.startsWith("/aimode ") ||
    messageText === "/aireset"
  ) {
    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: "⚠️ Perintah ini hanya untuk grup.",
      });

      return;
    }

    if (messageText === "/aireset") {
      if (!isBotAdmin(userId)) {
        await sock.sendMessage(chatId, {
          text: "⛔ Hanya dev wancana yang bisa menghapus ingatan.",
        });

        return;
      }

      await clearChatMemory(chatId);

      await sock.sendMessage(chatId, {
        text: "🧹 Ingatan chat grup ini sudah dihapus.",
      });

      return;
    }

    const argument = messageText
      .replace("/aimode", "")
      .trim()
      .toLowerCase();

    if (argument === "tag" || argument === "auto") {
      if (!isBotAdmin(userId)) {
        await sock.sendMessage(chatId, {
          text: "⛔ Hanya wancana dev yang bisa mengubah mode AI.",
        });

        return;
      }

      await setChatMode(chatId, argument);

      await sock.sendMessage(chatId, {
        text:
          argument === "auto"
            ? "🤖 Mode *AUTO*: Wancana mode auto  😎"
            : "🤖 Mode *TAG*: Wancana hanya menjawab kalau di-tag, dibalas, atau pakai /ai 🤫",
      });

      return;
    }

    const currentMode = await getChatMode(chatId);

    await sock.sendMessage(chatId, {
      text:
        `🤖 *Mode AI grup ini: ${currentMode.toUpperCase()}*\n\n` +
        "• tag → AI hanya jawab kalau di-tag / dibalas / /ai\n" +
        "• auto → AI juga ikut nimbrung sendiri\n\n" +
        "Ubah: /aimode tag atau /aimode auto\n" +
        "Hapus ingatan: /aireset",
    });

    return;
  }

  // =========================================================
  // DAFTAR
  // =========================================================

  if (
    messageText.startsWith(
      "/daftar",
    )
  ) {
    const name =
      messageText
        .replace(
          "/daftar",
          "",
        )
        .trim();

    const result =
      await daftarPlayer(
        userId,
        name,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // PROFILE
  // =========================================================

  if (
    messageText === "/profile"
  ) {
    const result =
      await getProfile(
        userId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // JORAN
  // =========================================================

  if (
    messageText === "/joran"
  ) {
    const result =
      await getRods(
        userId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // PILIH JORAN
  // =========================================================

  if (
    messageText.startsWith(
      "/pilihjoran",
    )
  ) {
    const rodId =
      messageText
        .replace(
          "/pilihjoran",
          "",
        )
        .trim();

    const result =
      await chooseRod(
        userId,
        rodId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }


  // =========================================================
// DAFTAR JORAN GACHA
// =========================================================

if (
  messageText === "/gacharod"
) {
  const result =
    getGachaRodList();

  await sock.sendMessage(
    chatId,
    {
      text: result.message,
    },
  );

  return;
}

  // =========================================================
  // GACHA
  // =========================================================

  if (
    messageText === "/gacha" ||
    messageText === "/gacha 1"
  ) {
    const result =
      await gacha(
        userId,
        1,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  if (
    messageText === "/gacha 10"
  ) {
    const result =
      await gacha(
        userId,
        10,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  if (
    messageText.startsWith(
      "/gacha ",
    )
  ) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Gacha hanya mendukung:\n\n" +
          "/gacha\n" +
          "/gacha 10",
      },
    );

    return;
  }

  // =========================================================
  // GOLD -> COIN
  // =========================================================

  if (
    messageText.startsWith(
      "/tukarcoin",
    )
  ) {
    const argument =
      messageText
        .replace(
          "/tukarcoin",
          "",
        )
        .trim();

    if (!argument) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "💱 *TUKAR GOLD KE COIN*\n\n" +
            "100 Gold = 1 Coin\n\n" +
            "Contoh:\n" +
            "/tukarcoin 1\n" +
            "/tukarcoin 10",
        },
      );

      return;
    }

    const result =
      await exchangeGoldToCoins(
        userId,
        argument,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // JUAL IKAN
  // =========================================================

  if (
    messageText.startsWith(
      "/jualikan",
    )
  ) {
    const argument =
      messageText
        .replace(
          "/jualikan",
          "",
        )
        .trim()
        .toLowerCase();

    if (!argument) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "💰 *CARA MENJUAL IKAN*\n\n" +
            "/inventory\n" +
            "/jualikan <nomor>\n" +
            "/jualikan semua",
        },
      );

      return;
    }

    const result =
      argument === "semua"
        ? await sellAllFish(
            userId,
          )
        : await sellFishByIndex(
            userId,
            argument,
          );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // LEADERBOARD
  // =========================================================

  if (
    messageText ===
    "/leaderboard"
  ) {
    const result =
      await getLeaderboard();

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // INVENTORY IKAN
  // =========================================================

  if (
    messageText === "/inventory"
  ) {
    const result =
      await getInventory(
        userId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // ITEM
  // =========================================================

  if (
    messageText === "/item"
  ) {
    const profileResult =
      await getProfile(
        userId,
      );

    if (
      !profileResult.success
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            profileResult.message,
        },
      );

      return;
    }

    const result =
      await getItems(
        profileResult
          .player.id,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // PAKAI ITEM
  // =========================================================

  if (
    messageText.startsWith(
      "/pakaiitem",
    )
  ) {
    const itemId =
      messageText
        .replace(
          "/pakaiitem",
          "",
        )
        .trim();

    const profileResult =
      await getProfile(
        userId,
      );

    if (
      !profileResult.success
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            profileResult.message,
        },
      );

      return;
    }

    const result =
      await useItem(
        profileResult
          .player.id,
        itemId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // MANCING
  // =========================================================

  if (
    messageText === "/mancing"
  ) {
    const profileResult =
      await getProfile(
        userId,
      );

    if (
      !profileResult.success
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            profileResult.message,
        },
      );

      return;
    }

    const player =
      profileResult.player;

    const cooldown =
      checkFishingCooldown(
        player.id,
      );

    if (
      !cooldown.allowed
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            `⏳ Kamu masih dalam cooldown.\n\n` +
            `Tunggu ${cooldown.remaining} detik lagi sebelum memancing.`,
        },
      );

      return;
    }

    const goldBuff =
      getActiveBuff(
        player.id,
        "gold_boost",
      );

    const luckBuff =
      getActiveBuff(
        player.id,
        "luck",
      );

    const catchResult =
      await fish(
        player.current_rod,
        player.id,
      );

    if (
      !catchResult.success
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            catchResult.message,
        },
      );

      return;
    }

    startFishingCooldown(
      player.id,
    );

    await saveCaughtFish(
      player.id,
      catchResult,
    );

    const rewardResult =
      await addPlayerRewards(
        player.id,
        catchResult.exp,
        catchResult.gold,
      );

    let message =
      "🎣 *HASIL MEMANCING*\n\n";

    message +=
      `🪝 Rod: ${catchResult.rod}\n`;

    message +=
      `🐟 Ikan: ${catchResult.fish}\n`;

    message +=
      `✨ Rarity: ${getRarityEmoji(
        catchResult.rarity,
      )} ${catchResult.rarity}\n`;

    message +=
      `⚖️ Berat: ${catchResult.formattedWeight}\n`;

    if (
      catchResult.skillActivated &&
      catchResult.skillMessage
    ) {
      message +=
        `\n${catchResult.skillMessage}\n`;
    }

    if (goldBuff) {
      message +=
        `\n💍 *GOLD BOOST AKTIF*\n` +
        `💰 +10%\n` +
        `⏱️ Sisa: ${goldBuff.remainingSeconds} detik\n`;
    }

    if (luckBuff) {
      message +=
        `\n🍗 *LUCK AKTIF*\n` +
        `🍀 +50%\n` +
        `⏱️ Sisa: ${luckBuff.remainingSeconds} detik\n`;
    }

    message +=
      `\n🎁 EXP: +${catchResult.exp}\n`;

    message +=
      `💰 Gold: +${catchResult.gold}\n`;

    message +=
      `\n⭐ Level: ${rewardResult.newLevel}\n`;

    if (
      catchResult.itemReward
    ) {
      message +=
        `\n🎁 *ITEM DITEMUKAN!*\n` +
        `${catchResult.itemReward.name} ×${catchResult.itemReward.quantity}\n`;
    }

    message +=
      "\n🎒 Ikan telah masuk ke inventory!";

    await sock.sendMessage(
      chatId,
      {
        text:
          message.trim(),
      },
    );

    return;
  }

  // =========================================================
  // TOKO
  // =========================================================

  if (
    messageText === "/toko"
  ) {
    const result =
      await getRodShop(
        userId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // BELI JORAN
  // =========================================================

  if (
    messageText.startsWith(
      "/belirod",
    )
  ) {
    const rodId =
      messageText
        .replace(
          "/belirod",
          "",
        )
        .trim();

    const result =
      await buyRod(
        userId,
        rodId,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }

  // =========================================================
  // LELANG
  // =========================================================

  if (
    messageText === "/lelang" ||
    messageText.startsWith(
      "/lelang ",
    )
  ) {
    const argument =
      messageText
        .replace(
          "/lelang",
          "",
        )
        .trim();

    const result =
      await handleAuctionCommand(
        userId,
        argument,
      );

    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );

    return;
  }




  // =========================================================
// TEBAK GAMBAR
// =========================================================

if (
  messageText === "/tebakgambar" ||
  messageText.startsWith("/tebakgambar ")
) {
  const argument =
    messageText
      .replace("/tebakgambar", "")
      .trim();

  const result =
    await handleGuessCommand(
      sock,
      chatId,
      userId,
      argument,
    );

  if (
    result?.message
  ) {
    await sock.sendMessage(
      chatId,
      {
        text: result.message,
      },
    );
  }

  return;
}






// =========================================================
// JAWABAN TEBAK GAMBAR
// =========================================================

const botMentioned =
  isBotMentioned(
    sock,
    mentionedJid,
  );

// Kalau grup sedang punya game, pesan biasa dianggap jawaban.
if (
  isGroup &&
  !messageText.startsWith("/") &&
  !botMentioned
) {
  const handled =
    await handleGuessAnswer(
      sock,
      chatId,
      userId,
      messageText,
    );

  if (handled) {
    return;
  }
}

  // =========================================================
  // AI
  // =========================================================

  const isAICommand =
    messageText === "/ai" ||
    messageText.startsWith("/ai ");

  // Perintah lain yang diawali "/" bukan obrolan.
  if (
    messageText.startsWith("/") &&
    !isAICommand
  ) {
    return;
  }

  // Membalas (reply) pesan bot juga dianggap memanggil bot.
  const isReplyToBot =
    quotedJid
      ? isBotMentioned(sock, [quotedJid])
      : false;

  // DIMINTA: chat pribadi, tag bot, /ai, atau reply ke bot.
  const isDirect =
    !isGroup ||
    botMentioned ||
    isAICommand ||
    isReplyToBot;

  const cleanText =
    cleanMessageText(
      sock,
      messageText,
    );

  if (!cleanText) {
    if (isDirect) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "🤖 Tag nomor Wancana Bot atau gunakan:\n/ai pertanyaan",
        },
      );
    }

    return;
  }

  // Semua obrolan (bukan perintah) direkam sebagai ingatan.
  await rememberMessage(
    chatId,
    "user",
    senderName,
    cleanText,
  );

  if (isDirect) {
    await handleAIMessage(
      sock,
      chatId,
      senderName,
    );

    return;
  }

  // IKUT NIMBRUNG: hanya di grup dengan mode "auto".
  const mode =
    await getChatMode(chatId);

  if (mode !== "auto") {
    return;
  }

  const decision =
    decideAutoJoin(
      chatId,
      cleanText,
    );

  if (!decision.join) {
    return;
  }

  await handleAutoJoin(
    sock,
    chatId,
    senderName,
  );
}