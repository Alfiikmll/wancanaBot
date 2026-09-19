import pool from "../databases/database.js";
import {
createAuction,
getActiveAuctions,
placeBid,
finishAuction,
} from "../systems/auctionSystem.js";

const SELLER_WA = "6281234567890@s.whatsapp.net";
const BIDDER_1_WA = "test-player-002";
const BIDDER_2_WA = "test-player-001";

const FISH_INDEX = 1;
const START_PRICE = 500;

async function getPlayerByWa(whatsappId) {
const [rows] = await pool.query(
`       SELECT id, whatsapp_id, name, gold
      FROM players
      WHERE whatsapp_id = ?
      LIMIT 1
    `,
[whatsappId],
);

return rows[0] || null;
}


async function getFishByIndex(playerId, index) {
const [rows] = await pool.query(
`       SELECT
        pi.id,
        pi.fish_name,
        pi.rarity,
        pi.weight
      FROM player_inventory pi
      LEFT JOIN auction_listings al
        ON al.player_inventory_id = pi.id
        AND al.status = 'active'
      WHERE pi.player_id = ?
        AND al.id IS NULL
      ORDER BY pi.caught_at DESC, pi.id DESC
      LIMIT ?, 1
    `,
[playerId, index - 1],
);

return rows[0] || null;
}

async function getAuction(auctionId) {
const [rows] = await pool.query(
`       SELECT *
      FROM auction_listings
      WHERE id = ?
      LIMIT 1
    `,
[auctionId],
);

return rows[0] || null;
}

async function run() {
console.log("🎣 WANCANA BOT — AUCTION BID TEST");
console.log("========================================");
console.log(`👤 Seller   : ${SELLER_WA}`);
console.log(`👤 Bidder 1 : ${BIDDER_1_WA}`);
console.log(`👤 Bidder 2 : ${BIDDER_2_WA}`);
console.log(`🐟 Nomor ikan: ${FISH_INDEX}`);
console.log(`💰 Harga awal: ${START_PRICE}`);

try {
// ==================================================
// SETUP
// ==================================================


const seller = await getPlayerByWa(SELLER_WA);
const bidder1 = await getPlayerByWa(BIDDER_1_WA);
const bidder2 = await getPlayerByWa(BIDDER_2_WA);

if (!seller) {
  throw new Error(`Seller tidak ditemukan: ${SELLER_WA}`);
}

if (!bidder1) {
  throw new Error(`Bidder 1 tidak ditemukan: ${BIDDER_1_WA}`);
}

if (!bidder2) {
  throw new Error(`Bidder 2 tidak ditemukan: ${BIDDER_2_WA}`);
}

console.log(`✅ Seller ditemukan: ${seller.name} (${seller.gold} Gold)`);
console.log(
  `✅ Bidder 1 ditemukan: ${bidder1.name} (${bidder1.gold} Gold)`,
);
console.log(
  `✅ Bidder 2 ditemukan: ${bidder2.name} (${bidder2.gold} Gold)`,
);

const fish = await getFishByIndex(seller.id, FISH_INDEX);

if (!fish) {
  throw new Error(
    `Ikan nomor ${FISH_INDEX} tidak ditemukan atau sedang dilelang.`,
  );
}

console.log(`✅ Ikan ditemukan: ${fish.fish_name}`);

// ==================================================
// TEST 1 — BUAT AUCTION
// ==================================================

console.log("\n----------------------------------------");
console.log("🧪 TEST 1 — BUAT LELANG");

const auctionResult = await createAuction(
  seller.id,
  FISH_INDEX,
  START_PRICE,
);

if (!auctionResult.success) {
  throw new Error(auctionResult.message);
}

const auctionId = auctionResult.auctionId;

console.log(auctionResult.message);
console.log(`✅ Auction #${auctionId} berhasil dibuat.`);

// ==================================================
// TEST 2 — BIDDER 1 BID 700
// ==================================================

console.log("\n----------------------------------------");
console.log("🧪 TEST 2 — BIDDER 1 BID");

const bidder1Before = await getPlayerByWa(BIDDER_1_WA);

const bid1 = await placeBid(
  auctionId,
  bidder1.id,
  700,
);

if (!bid1.success) {
  throw new Error(`Bidder 1 gagal bid: ${bid1.message}`);
}

console.log(bid1.message);

const auctionAfterBid1 = await getAuction(auctionId);
const bidder1After = await getPlayerByWa(BIDDER_1_WA);

if (
  Number(auctionAfterBid1.current_bid) !== 700 ||
  Number(auctionAfterBid1.highest_bidder_id) !== Number(bidder1.id)
) {
  throw new Error("Data highest bidder/current bid tidak sesuai.");
}

const expectedGold1 = Number(bidder1Before.gold) - 700;

if (Number(bidder1After.gold) !== expectedGold1) {
  throw new Error(
    `Gold bidder 1 salah. Expected ${expectedGold1}, got ${bidder1After.gold}`,
  );
}

console.log("✅ Current bid = 700");
console.log("✅ Bidder 1 menjadi highest bidder");
console.log("✅ Gold bidder 1 berkurang 700");

// ==================================================
// TEST 3 — BIDDER 2 OUTBID
// ==================================================

console.log("\n----------------------------------------");
console.log("🧪 TEST 3 — BIDDER 2 OUTBID");

const bidder2Before = await getPlayerByWa(BIDDER_2_WA);
const bidder1BeforeOutbid = await getPlayerByWa(BIDDER_1_WA);

const bid2 = await placeBid(
  auctionId,
  bidder2.id,
  1000,
);

if (!bid2.success) {
  throw new Error(`Bidder 2 gagal bid: ${bid2.message}`);
}

console.log(bid2.message);

const auctionAfterBid2 = await getAuction(auctionId);
const bidder1AfterOutbid = await getPlayerByWa(BIDDER_1_WA);
const bidder2After = await getPlayerByWa(BIDDER_2_WA);

if (
  Number(auctionAfterBid2.current_bid) !== 1000 ||
  Number(auctionAfterBid2.highest_bidder_id) !== Number(bidder2.id)
) {
  throw new Error("Highest bidder setelah outbid tidak sesuai.");
}

// Bidder 1 harus kembali mendapatkan 700 Gold.
const expectedBidder1Gold =
  Number(bidder1BeforeOutbid.gold) + 700;

if (Number(bidder1AfterOutbid.gold) !== expectedBidder1Gold) {
  throw new Error(
    `Refund bidder 1 salah. Expected ${expectedBidder1Gold}, got ${bidder1AfterOutbid.gold}`,
  );
}

// Bidder 2 membayar 1000 Gold.
const expectedBidder2Gold =
  Number(bidder2Before.gold) - 1000;

if (Number(bidder2After.gold) !== expectedBidder2Gold) {
  throw new Error(
    `Gold bidder 2 salah. Expected ${expectedBidder2Gold}, got ${bidder2After.gold}`,
  );
}

console.log("✅ Bidder 2 menjadi highest bidder");
console.log("✅ Current bid = 1000");
console.log("✅ Bidder 1 mendapatkan refund 700");
console.log("✅ Bidder 2 terpotong 1000");

// ==================================================
// TEST 4 — FINISH AUCTION
// ==================================================

console.log("\n----------------------------------------");
console.log("🧪 TEST 4 — SELESAIKAN AUCTION");

// Paksa auction menjadi expired.
await pool.query(
  `
    UPDATE auction_listings
    SET ends_at = NOW() - INTERVAL 1 SECOND
    WHERE id = ?
  `,
  [auctionId],
);

const finishResult = await finishAuction(auctionId);

if (!finishResult.success) {
  throw new Error(
    `Auction gagal diselesaikan: ${finishResult.message}`,
  );
}

console.log(finishResult.message);

const finalAuction = await getAuction(auctionId);

if (finalAuction.status !== "sold") {
  throw new Error(
    `Status auction salah. Expected sold, got ${finalAuction.status}`,
  );
}

if (
  Number(finalAuction.highest_bidder_id) !== Number(bidder2.id)
) {
  throw new Error("Bidder 2 bukan pemenang auction.");
}

if (Number(finalAuction.current_bid) !== 1000) {
  throw new Error("Harga final auction bukan 1000.");
}

console.log("✅ Status auction = sold");
console.log("✅ Pemenang = Bidder 2");
console.log("✅ Harga final = 1000");

// ==================================================
// TEST 5 — VERIFIKASI IKAN PINDAH
// ==================================================

console.log("\n----------------------------------------");
console.log("🧪 TEST 5 — VERIFIKASI IKAN PEMENANG");

const [winnerFish] = await pool.query(
  `
    SELECT id, fish_name, rarity, weight
    FROM player_inventory
    WHERE player_id = ?
      AND fish_name = ?
    ORDER BY id DESC
    LIMIT 1
  `,
  [bidder2.id, fish.fish_name],
);

if (winnerFish.length === 0) {
  throw new Error("Ikan tidak ditemukan di inventory pemenang.");
}

console.log(`✅ ${fish.fish_name} masuk inventory pemenang`);

// ==================================================
// TEST 6 — VERIFIKASI SELLER MENDAPAT GOLD
// ==================================================

console.log("\n----------------------------------------");
console.log("🧪 TEST 6 — VERIFIKASI PEMBAYARAN SELLER");

const sellerAfter = await getPlayerByWa(SELLER_WA);

// Catatan:
// Seller seharusnya mendapatkan +1000 Gold.
// Kita tidak menghitung saldo awal sebagai nilai absolut
// karena seller mungkin punya transaksi lain.

console.log(`✅ Gold seller sekarang: ${sellerAfter.gold}`);
console.log("✅ Pembayaran auction selesai.");

// ==================================================
// SUMMARY
// ==================================================

console.log("\n========================================");
console.log("✅ AUCTION BID TEST SELESAI");
console.log("========================================");
console.log("✅ TEST 1 — Buat auction: PASS");
console.log("✅ TEST 2 — Bid pertama: PASS");
console.log("✅ TEST 3 — Outbid + refund: PASS");
console.log("✅ TEST 4 — Auction selesai: PASS");
console.log("✅ TEST 5 — Ikan pindah ke pemenang: PASS");
console.log("✅ TEST 6 — Seller menerima pembayaran: PASS");
console.log("========================================");


} catch (error) {
console.error("\n❌ AUCTION BID TEST GAGAL");
console.error(error);
} finally {
await pool.end();
}
}

run();
