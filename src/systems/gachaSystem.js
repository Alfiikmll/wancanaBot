import pool from "../databases/database.js";

import {
getGachaRods,
} from "./rodSystem.js";

import {
addItem,
} from "./itemSystem.js";

// =========================================================
// ITEM AMPAS GACHA
// =========================================================

const junkItems = [
{
id: "junk_sandal",
name: "🩴 Sandal Jepit Sebelah",
isJunk: true,
gachaChance: 100,
},

{
id: "junk_kaleng",
name: "🥫 Kaleng Karat",
isJunk: true,
gachaChance: 100,
},

{
id: "junk_rumputlaut",
name: "🌿 Rumput Laut Basi",
isJunk: true,
gachaChance: 100,
},

{
id: "junk_kaoskaki",
name: "🧦 Kaos Kaki Hilang",
isJunk: true,
gachaChance: 100,
},

{
id: "junk_batu",
name: "🪨 Batu Sungai",
isJunk: true,
gachaChance: 100,
},
];

// =========================================================
// RANDOM GACHA
// =========================================================

function getRandomGachaResult() {
const gachaPool = [
...getGachaRods(),
...junkItems,
];

const validPool =
gachaPool.filter(
(item) =>
Number(item.gachaChance) > 0,
);

if (
validPool.length === 0
) {
throw new Error(
"Gacha pool kosong atau semua gachaChance tidak valid.",
);
}

const totalChance =
validPool.reduce(
(total, item) =>
total +
Number(item.gachaChance),
0,
);

let random =
Math.random() *
totalChance;

for (
const item of validPool
) {
random -=
Number(item.gachaChance);


if (
  random <= 0
) {
  return item;
}


}

return validPool[
validPool.length - 1
];
}

// =========================================================
// GACHA
// =========================================================

export async function gacha(
whatsappId,
amount = 1,
) {
if (
![1, 10].includes(amount)
) {
return {
success: false,
message:
"Jumlah gacha hanya bisa 1 atau 10.",
};
}

if (!whatsappId) {
return {
success: false,
message:
"❌ Identitas WhatsApp tidak ditemukan.",
};
}

const cost =
amount === 1
? 1
: 9;

const connection =
await pool.getConnection();

try {
await connection.beginTransaction();

// =====================================================
// AMBIL PLAYER
// =====================================================

const [players] =
  await connection.query(
    `
    SELECT
      id,
      whatsapp_id,
      name,
      coins
    FROM players
    WHERE whatsapp_id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [whatsappId],
  );

if (
  players.length === 0
) {
  await connection.rollback();

  return {
    success: false,
    message:
      "Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
  };
}

const player =
  players[0];

const currentCoins =
  Number(player.coins);

// =====================================================
// CEK COIN
// =====================================================

if (
  currentCoins < cost
) {
  await connection.rollback();

  return {
    success: false,
    message:
      `🪙 Coin kamu tidak cukup.\n\n` +
      `Coin sekarang: ${currentCoins}\n` +
      `Coin dibutuhkan: ${cost}`,
  };
}

// =====================================================
// KURANGI COIN
// =====================================================

await connection.query(
  `
  UPDATE players
  SET coins = coins - ?
  WHERE id = ?
  `,
  [
    cost,
    player.id,
  ],
);

// =====================================================
// PROSES GACHA
// =====================================================

const results = [];

for (
  let i = 0;
  i < amount;
  i += 1
) {
  const pulled =
    getRandomGachaResult();

  console.log(
    `[GACHA] Roll ${
      i + 1
    }/${amount}: ${
      pulled.id
    }`,
  );

  // ===================================================
  // AMPAS
  // ===================================================

  if (
    pulled.isJunk
  ) {
    try {
      await addItem(
        player.id,
        pulled.id,
        1,
        connection,
      );
    } catch (error) {
      console.error(
        `[GACHA] Gagal memasukkan item ${pulled.id}:`,
        error,
      );

      throw error;
    }

    results.push({
      item: pulled,
      duplicate: false,
      isJunk: true,
    });

    continue;
  }

  // ===================================================
  // ROD
  // ===================================================

  try {
    const [
      insertResult,
    ] =
      await connection.query(
        `
        INSERT IGNORE INTO player_rods
        (
          player_id,
          rod_id,
          obtained_from
        )
        VALUES (?, ?, 'gacha')
        `,
        [
          player.id,
          pulled.id,
        ],
      );

    results.push({
      rod: pulled,
      duplicate:
        insertResult.affectedRows ===
        0,
      isJunk: false,
    });
  } catch (error) {
    console.error(
      `[GACHA] Gagal memasukkan rod ${pulled.id}:`,
      error,
    );

    throw error;
  }
}

// =====================================================
// COMMIT
// =====================================================

await connection.commit();

// =====================================================
// MESSAGE
// =====================================================

let message =
  `🎰 *HASIL GACHA ${amount}x*\n\n` +
  `🪙 Coin digunakan: ${cost}\n` +
  `🪙 Sisa Coin: ${
    currentCoins - cost
  }\n\n`;

results.forEach(
  (
    result,
    index,
  ) => {
    if (
      result.isJunk
    ) {
      message +=
        `${index + 1}. ` +
        `${result.item.name}\n` +
        `   🗑️ AMPAS GACHA!\n\n`;
    } else {
      message +=
        `${index + 1}. ` +
        `${result.rod.name}`;

      if (
        result.duplicate
      ) {
        message +=
          " ♻️ Duplikat";
      } else {
        message +=
          " ✨ Rod baru";
      }

      message +=
        "\n\n";
    }
  },
);

return {
  success: true,
  message:
    message.trim(),
  results,
};


} catch (error) {
try {
await connection.rollback();
} catch (
rollbackError
) {
console.error(
"Gacha rollback error:",
rollbackError,
);
}


console.error(
  "========================================",
);

console.error(
  "GACHA ERROR DETAIL",
);

console.error(
  "========================================",
);

console.error(
  "Code:",
  error?.code,
);

console.error(
  "Message:",
  error?.message,
);

console.error(
  "SQL Message:",
  error?.sqlMessage,
);

console.error(
  "SQL:",
  error?.sql,
);

console.error(
  error,
);

console.error(
  "========================================",
);

return {
  success: false,
  message:
    "❌ Terjadi kesalahan saat melakukan gacha.\n" +
    "Cek terminal bot untuk detail error.",
};


} finally {
connection.release();
}
}
export function getGachaRodList() {
const rods = getGachaRods();

if (rods.length === 0) {
return {
success: false,
message:
"❌ Belum ada joran yang tersedia dari Gacha.",
};
}

const sortedRods = [...rods].sort(
(a, b) =>
Number(a.gachaChance) -
Number(b.gachaChance),
);

let message =
"🎰 *DAFTAR JORAN GACHA*\n\n";

message +=
"Joran berikut bisa didapatkan melalui Gacha.\n" +
"Semakin kecil chance, semakin langka.\n\n";

sortedRods.forEach(
(rod, index) => {
const type =
rod.type === "mythical"
? "🌌 MYTHICAL"
: "✨ SECRET";


  message +=
    `${index + 1}. ${type}\n` +
    `🎣 *${rod.name}*\n` +
    `🆔 ID: ${rod.id}\n` +
    `🎲 Chance Gacha: ${rod.gachaChance}%\n` +
    `⚖️ Weight: ×${rod.bonus.weightMultiplier}\n` +
    `💰 Gold: ×${rod.bonus.goldMultiplier}\n` +
    `✨ EXP: ×${rod.bonus.expMultiplier}\n`;

  if (rod.skill) {
    message +=
      `⚡ Skill: ${rod.skill.name}\n` +
      `🎯 Skill Chance: ${rod.skill.chance}%\n`;
  }

  message += "\n";
},


);

message +=
"📌 Gunakan:\n" +
"/gacha\n" +
"/gacha 10";

return {
success: true,
message:
message.trim(),
};
}
