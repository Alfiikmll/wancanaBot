import pool from "../databases/database.js";

import {
  createAuction,
  getActiveAuctions,
  placeBid,
  finishAuction,
} from "../systems/auctionSystem.js";

// =========================================================
// CARA PAKAI
// =========================================================
//
// node src/test/testAuction.js "WHATSAPP_ID" 1 500
//
// Contoh:
// node src/test/testAuction.js "628123456789" 1 500
//
// Argumen:
// 1. WhatsApp ID pemain penjual
// 2. Nomor ikan di /inventory
// 3. Harga awal lelang
//
// CATATAN:
// Script ini memakai DATABASE ASLI kamu.
// Gunakan ikan yang memang ingin kamu jadikan test.
// =========================================================

const sellerWhatsAppId =
  process.argv[2];

const inventoryIndex =
  Number(process.argv[3]);

const startPrice =
  Number(process.argv[4]);

// =========================================================
// VALIDASI ARGUMEN
// =========================================================

if (
  !sellerWhatsAppId ||
  !Number.isInteger(inventoryIndex) ||
  inventoryIndex <= 0 ||
  !Number.isInteger(startPrice) ||
  startPrice <= 0
) {
  console.log(`
❌ Format salah.

Gunakan:

node src/test/testAuction.js "WHATSAPP_ID" NOMOR_IKAN HARGA

Contoh:

node src/test/testAuction.js "628123456789" 1 500
  `.trim());

  process.exit(1);
}

// =========================================================
// HELPER
// =========================================================

function separator() {
  console.log(
    "\n----------------------------------------",
  );
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms),
  );
}

// =========================================================
// AMBIL PLAYER
// =========================================================

async function getSeller() {
  const [rows] =
    await pool.query(
      `
      SELECT
        id,
        name,
        gold
      FROM players
      WHERE whatsapp_id = ?
      LIMIT 1
      `,
      [sellerWhatsAppId],
    );

  return rows[0] || null;
}

// =========================================================
// AMBIL INVENTORY
// =========================================================

async function getInventoryFish(
  playerId,
  index,
) {
  const [rows] =
    await pool.query(
      `
      SELECT
        id,
        fish_name,
        rarity,
        weight,
        exp,
        gold,
        caught_at
      FROM player_inventory
      WHERE player_id = ?
      ORDER BY caught_at DESC, id DESC
      `,
      [playerId],
    );

  return rows[index - 1] || null;
}

// =========================================================
// TEST UTAMA
// =========================================================

async function main() {
  console.log(
    "========================================",
  );

  console.log(
    "🧪 WANCANA BOT — AUCTION TEST",
  );

  console.log(
    "========================================",
  );

  console.log(
    `👤 Seller: ${sellerWhatsAppId}`,
  );

  console.log(
    `🐟 Nomor ikan: ${inventoryIndex}`,
  );

  console.log(
    `💰 Harga awal: ${startPrice}`,
  );

  // =======================================================
  // PLAYER
  // =======================================================

  const seller =
    await getSeller();

  if (!seller) {
    console.log(
      "\n❌ Player tidak ditemukan.",
    );

    process.exit(1);
  }

  console.log(
    `✅ Player ditemukan: ${seller.name}`,
  );

  // =======================================================
  // IKAN
  // =======================================================

  const fish =
    await getInventoryFish(
      seller.id,
      inventoryIndex,
    );

  if (!fish) {
    console.log(
      `\n❌ Ikan nomor ${inventoryIndex} tidak ditemukan.`,
    );

    process.exit(1);
  }

  console.log(
    `✅ Ikan ditemukan: ${fish.fish_name}`,
  );

  separator();

  // =======================================================
  // TEST 1
  // BUAT LELANG
  // =======================================================

  console.log(
    "🧪 TEST 1 — BUAT LELANG",
  );

  const createResult =
    await createAuction(
      sellerWhatsAppId,
      inventoryIndex,
      startPrice,
    );

  console.log(
    createResult.message,
  );

  if (!createResult.success) {
    console.log(
      "\n❌ TEST 1 GAGAL",
    );

    process.exit(1);
  }

  console.log(
    "\n✅ TEST 1 PASS",
  );

  // =======================================================
  // CARI AUCTION YANG BARU DIBUAT
  // =======================================================

  const [auctionRows] =
    await pool.query(
      `
      SELECT
        id,
        player_inventory_id,
        status,
        current_bid,
        ends_at
      FROM auction_listings
      WHERE player_inventory_id = ?
        AND seller_player_id = ?
        AND status = 'active'
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        fish.id,
        seller.id,
      ],
    );

  if (
    auctionRows.length === 0
  ) {
    console.log(
      "\n❌ Auction tidak ditemukan setelah dibuat.",
    );

    process.exit(1);
  }

  const auction =
    auctionRows[0];

  console.log(
    `🔨 Auction ID: #${auction.id}`,
  );

  // =======================================================
  // TEST 2
  // LIHAT AUCTION
  // =======================================================

  separator();

  console.log(
    "🧪 TEST 2 — LIHAT AUCTION",
  );

  const auctions =
    await getActiveAuctions();

  const found =
    auctions.find(
      (item) =>
        Number(item.id) ===
        Number(auction.id),
    );

  if (!found) {
    console.log(
      "\n❌ Auction aktif tidak muncul.",
    );

    process.exit(1);
  }

  console.log(
    `✅ Auction #${found.id} ditemukan.`,
  );

  console.log(
    `🐟 ${found.fish_name}`,
  );

  console.log(
    `⭐ ${found.rarity}`,
  );

  console.log(
    `💰 Bid: ${found.current_bid || found.start_price}`,
  );

  console.log(
    `👤 Seller: ${found.seller_name}`,
  );

  console.log(
    "\n✅ TEST 2 PASS",
  );

  // =======================================================
  // TEST 3
  // FORCE EXPIRE
  //
  // Kita ubah waktu auction menjadi beberapa detik
  // dari sekarang agar tidak perlu menunggu 1 menit.
  // =======================================================

  separator();

  console.log(
    "🧪 TEST 3 — EXPIRED TANPA BID",
  );

  console.log(
    "⏱️ Auction akan dipaksa expire dalam 5 detik...",
  );

  await pool.query(
    `
    UPDATE auction_listings
    SET ends_at = DATE_ADD(NOW(), INTERVAL 5 SECOND)
    WHERE id = ?
      AND status = 'active'
    `,
    [auction.id],
  );

  console.log(
    "✅ Waktu auction berhasil dipersingkat.",
  );

  console.log(
    "⏳ Menunggu 7 detik...",
  );

  await sleep(7000);

  // Jalankan cleanup manual.
  await import(
    "../systems/auctionSystem.js"
  ).then(
    async (module) => {
      await module.closeExpiredAuctions();
    },
  );

  // =======================================================
  // CEK STATUS AUCTION
  // =======================================================

  const [afterRows] =
    await pool.query(
      `
      SELECT
        id,
        player_inventory_id,
        status,
        highest_bidder_id,
        current_bid
      FROM auction_listings
      WHERE id = ?
      `,
      [auction.id],
    );

  if (
    afterRows.length === 0
  ) {
    console.log(
      "\n❌ Data auction hilang.",
    );

    process.exit(1);
  }

  const after =
    afterRows[0];

  console.log(
    `🔨 Auction #${after.id}`,
  );

  console.log(
    `📌 Status: ${after.status}`,
  );

  console.log(
    `💰 Current bid: ${after.current_bid}`,
  );

  // =======================================================
  // CEK IKAN
  // =======================================================

  const [fishAfterRows] =
    await pool.query(
      `
      SELECT
        id,
        fish_name
      FROM player_inventory
      WHERE id = ?
        AND player_id = ?
      `,
      [
        fish.id,
        seller.id,
      ],
    );

  const fishReturned =
    fishAfterRows.length > 0;

  console.log(
    `🐟 Ikan kembali tersedia: ${
      fishReturned
        ? "YA"
        : "TIDAK"
    }`,
  );

  // =======================================================
  // VALIDASI
  // =======================================================

  if (
    after.status === "expired" &&
    fishReturned &&
    !after.highest_bidder_id &&
    Number(after.current_bid) === 0
  ) {
    console.log(
      "\n✅ TEST 3 PASS",
    );

    console.log(
      "✅ Auction tanpa bid berakhir dengan benar.",
    );

    console.log(
      "✅ Ikan tetap berada di inventory seller.",
    );
  } else {
    console.log(
      "\n❌ TEST 3 FAIL",
    );
  }

  // =======================================================
  // FINAL
  // =======================================================

  separator();

  console.log(
    "🎉 AUCTION BASIC TEST SELESAI",
  );

  console.log(
    "========================================",
  );

  await pool.end();
}

main().catch(
  async (error) => {
    console.error(
      "\n❌ TEST ERROR:",
      error,
    );

    try {
      await pool.end();
    } catch {}

    process.exit(1);
  },
);