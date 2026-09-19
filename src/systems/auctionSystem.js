
import pool from "../databases/database.js";

const INITIAL_DURATION_SECONDS = 60;
const EXTENSION_SECONDS = 30;

// =========================================================
// HELPER
// =========================================================

function getRemainingSeconds(
  endsAt,
) {
  return Math.max(
    0,
    Math.ceil(
      (
        new Date(
          endsAt,
        ).getTime() -
        Date.now()
      ) / 1000,
    ),
  );
}

// =========================================================
// BUAT LELANG
// =========================================================

export async function createAuction(
  whatsappId,
  inventoryIndex,
  startPrice,
) {
  const index =
    Number(inventoryIndex);

  const price =
    Number(startPrice);

  if (
    !Number.isInteger(index) ||
    index <= 0
  ) {
    return {
      success: false,
      message:
        "❌ Nomor ikan tidak valid.",
    };
  }

  if (
    !Number.isInteger(price) ||
    price <= 0
  ) {
    return {
      success: false,
      message:
        "❌ Harga awal harus berupa angka lebih dari 0.",
    };
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    // -----------------------------------------------------
    // PLAYER
    // -----------------------------------------------------

    const [players] =
      await connection.query(
        `
        SELECT id, name
        FROM players
        WHERE whatsapp_id = ?
        FOR UPDATE
        `,
        [whatsappId],
      );

    if (players.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Kamu belum terdaftar. Gunakan /daftar terlebih dahulu.",
      };
    }

    const player =
      players[0];

    // -----------------------------------------------------
    // INVENTORY
    // HARUS sama dengan /inventory
    // -----------------------------------------------------

    const [fishRows] =
      await connection.query(
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
        [player.id],
      );

    const selectedFish =
      fishRows[index - 1];

    if (!selectedFish) {
      await connection.rollback();

      return {
        success: false,
        message:
          `❌ Ikan nomor ${index} tidak ditemukan.\n` +
          `Gunakan /inventory untuk melihat daftar ikan.`,
      };
    }

    // -----------------------------------------------------
    // LOCK IKAN
    // -----------------------------------------------------

    const [lockedFishRows] =
      await connection.query(
        `
        SELECT
          id,
          fish_name,
          rarity,
          weight,
          exp,
          gold
        FROM player_inventory
        WHERE id = ?
          AND player_id = ?
        FOR UPDATE
        `,
        [
          selectedFish.id,
          player.id,
        ],
      );

    if (lockedFishRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Ikan sudah tidak tersedia.",
      };
    }

    const lockedFish =
      lockedFishRows[0];

    // -----------------------------------------------------
    // CEK AUCTION AKTIF
    // -----------------------------------------------------

    const [activeAuctionRows] =
      await connection.query(
        `
        SELECT id
        FROM auction_listings
        WHERE player_inventory_id = ?
          AND status = 'active'
        LIMIT 1
        `,
        [lockedFish.id],
      );

    if (activeAuctionRows.length > 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Ikan tersebut sudah sedang dilelang.",
      };
    }

    // -----------------------------------------------------
    // BUAT AUCTION
    // -----------------------------------------------------

    const [auctionResult] =
      await connection.query(
        `
        INSERT INTO auction_listings
        (
          player_inventory_id,
          seller_player_id,
          start_price,
          current_bid,
          highest_bidder_id,
          status,
          started_at,
          ends_at
        )
        VALUES (
          ?,
          ?,
          ?,
          0,
          NULL,
          'active',
          NOW(),
          DATE_ADD(
            NOW(),
            INTERVAL ? SECOND
          )
        )
        `,
        [
          lockedFish.id,
          player.id,
          price,
          INITIAL_DURATION_SECONDS,
        ],
      );

    const auctionId =
      auctionResult.insertId;

    await connection.commit();

    return {
      success: true,
      message:
        `🔨 *LELANG DIBUKA!*\n\n` +
        `🔨 ID Lelang: #${auctionId}\n` +
        `🐟 Ikan: ${lockedFish.fish_name}\n` +
        `⭐ Rarity: ${lockedFish.rarity}\n` +
        `⚖️ Berat: ${Number(lockedFish.weight).toFixed(2)} kg\n\n` +
        `💰 Harga awal: ${price} Gold\n` +
        `⏱️ Durasi awal: 1 menit\n` +
        `🔥 Setiap bid valid: +30 detik`,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Create auction error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Terjadi kesalahan saat membuat lelang.",
    };
  } finally {
    connection.release();
  }
}

// =========================================================
// LIHAT LELANG AKTIF
// =========================================================

export async function getActiveAuctions() {
  await closeExpiredAuctions();

  const [auctions] =
    await pool.query(
      `
      SELECT
        a.id,
        a.start_price,
        a.current_bid,
        a.status,
        a.started_at,
        a.ends_at,

        f.fish_name,
        f.rarity,
        f.weight,

        seller.name AS seller_name,

        bidder.name AS bidder_name

      FROM auction_listings a

      INNER JOIN player_inventory f
        ON f.id = a.player_inventory_id

      INNER JOIN players seller
        ON seller.id = a.seller_player_id

      LEFT JOIN players bidder
        ON bidder.id = a.highest_bidder_id

      WHERE a.status = 'active'
      ORDER BY a.ends_at ASC, a.id ASC
      `,
    );

  return auctions;
}

// =========================================================
// BID
// =========================================================

export async function placeBid(
  whatsappId,
  auctionId,
  bidAmount,
) {
  const id =
    Number(auctionId);

  const amount =
    Number(bidAmount);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return {
      success: false,
      message:
        "❌ ID lelang tidak valid.",
    };
  }

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return {
      success: false,
      message:
        "❌ Nilai bid harus berupa angka lebih dari 0.",
    };
  }

  // Bersihkan auction yang benar-benar sudah lewat waktunya.
  await closeExpiredAuctions();

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    // -----------------------------------------------------
    // LOCK AUCTION TERLEBIH DAHULU
    // Pola lock utama auction:
    // AUCTION → PLAYER
    // -----------------------------------------------------

    const [auctionRows] =
      await connection.query(
        `
        SELECT *
        FROM auction_listings
        WHERE id = ?
          AND status = 'active'
        FOR UPDATE
        `,
        [id],
      );

    if (auctionRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Lelang tidak ditemukan atau sudah selesai.",
      };
    }

    const auction =
      auctionRows[0];

    // -----------------------------------------------------
    // CEK WAKTU
    // -----------------------------------------------------

    if (
      getRemainingSeconds(
        auction.ends_at,
      ) <= 0
    ) {
      await connection.rollback();

      await finishAuction(id);

      return {
        success: false,
        message:
          "⏰ Lelang sudah berakhir.",
      };
    }

    // -----------------------------------------------------
    // LOCK BIDDER
    // -----------------------------------------------------

    const [players] =
      await connection.query(
        `
        SELECT id, name, gold
        FROM players
        WHERE whatsapp_id = ?
        FOR UPDATE
        `,
        [whatsappId],
      );

    if (players.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Kamu belum terdaftar.",
      };
    }

    const bidder =
      players[0];

    // -----------------------------------------------------
    // SELLER TIDAK BOLEH BID
    // -----------------------------------------------------

    if (
      bidder.id ===
      auction.seller_player_id
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Kamu tidak bisa menawar ikan milikmu sendiri.",
      };
    }

    // -----------------------------------------------------
    // MINIMUM BID
    // -----------------------------------------------------

    const minimumBid =
      Math.max(
        Number(
          auction.start_price,
        ),
        Number(
          auction.current_bid || 0,
        ) + 1,
      );

    if (
      amount < minimumBid
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          `❌ Bid terlalu kecil.\n\n` +
          `💰 Minimal bid: ${minimumBid} Gold`,
      };
    }

    const previousBidderId =
      auction.highest_bidder_id;

    const previousBid =
      Number(
        auction.current_bid || 0,
      );

    let chargeAmount =
      amount;

    // -----------------------------------------------------
    // BIDDER YANG SAMA
    // -----------------------------------------------------

    if (
      previousBidderId ===
      bidder.id
    ) {
      chargeAmount =
        amount - previousBid;
    }

    if (
      chargeAmount <= 0
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Bid baru harus lebih tinggi dari bid sebelumnya.",
      };
    }

    // -----------------------------------------------------
    // CEK GOLD
    // -----------------------------------------------------

    if (
      Number(bidder.gold) <
      chargeAmount
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          `❌ Gold kamu tidak cukup.\n\n` +
          `💰 Gold kamu: ${bidder.gold}\n` +
          `💸 Dibutuhkan: ${chargeAmount}`,
      };
    }

    // -----------------------------------------------------
    // POTONG GOLD BIDDER BARU
    // -----------------------------------------------------

    await connection.query(
      `
      UPDATE players
      SET gold = gold - ?
      WHERE id = ?
      `,
      [
        chargeAmount,
        bidder.id,
      ],
    );

    // -----------------------------------------------------
    // REFUND BIDDER SEBELUMNYA
    // -----------------------------------------------------

    if (
      previousBidderId &&
      previousBidderId !== bidder.id &&
      previousBid > 0
    ) {
      await connection.query(
        `
        UPDATE players
        SET gold = gold + ?
        WHERE id = ?
        `,
        [
          previousBid,
          previousBidderId,
        ],
      );
    }

    // -----------------------------------------------------
    // SIMPAN BID
    // -----------------------------------------------------

    await connection.query(
      `
      INSERT INTO auction_bids
      (
        auction_id,
        bidder_player_id,
        amount
      )
      VALUES (?, ?, ?)
      `,
      [
        auction.id,
        bidder.id,
        amount,
      ],
    );

    // -----------------------------------------------------
    // PERPANJANG 30 DETIK
    // -----------------------------------------------------

    await connection.query(
      `
      UPDATE auction_listings
      SET
        current_bid = ?,
        highest_bidder_id = ?,
        ends_at = DATE_ADD(
          ends_at,
          INTERVAL ? SECOND
        )
      WHERE id = ?
        AND status = 'active'
      `,
      [
        amount,
        bidder.id,
        EXTENSION_SECONDS,
        auction.id,
      ],
    );

    await connection.commit();

    return {
      success: true,
      message:
        `🔥 *BID BERHASIL!*\n\n` +
        `🔨 Lelang: #${auction.id}\n` +
        `💰 Bid kamu: ${amount} Gold\n` +
        `💸 Gold digunakan: ${chargeAmount} Gold\n\n` +
        `⏱️ Waktu lelang bertambah +30 detik!`,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Place bid error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Terjadi kesalahan saat memasang bid.",
    };
  } finally {
    connection.release();
  }
}

// =========================================================
// SELESAIKAN AUCTION
// =========================================================

export async function finishAuction(
  auctionId,
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock auction dulu.
    const [auctionRows] =
      await connection.query(
        `
        SELECT *
        FROM auction_listings
        WHERE id = ?
          AND status = 'active'
        FOR UPDATE
        `,
        [auctionId],
      );

    if (auctionRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "Lelang sudah selesai.",
      };
    }

    const auction =
      auctionRows[0];

    // -----------------------------------------------------
    // LOCK IKAN
    // -----------------------------------------------------

    const [fishRows] =
      await connection.query(
        `
        SELECT
          id,
          fish_name,
          rarity,
          weight,
          exp,
          gold
        FROM player_inventory
        WHERE id = ?
          AND player_id = ?
        FOR UPDATE
        `,
        [
          auction.player_inventory_id,
          auction.seller_player_id,
        ],
      );

    if (fishRows.length === 0) {
      await connection.query(
        `
        UPDATE auction_listings
        SET
          status = 'cancelled',
          finished_at = NOW()
        WHERE id = ?
        `,
        [auction.id],
      );

      await connection.commit();

      return {
        success: false,
        message:
          "❌ Ikan lelang sudah tidak ditemukan.",
      };
    }

    const fish =
      fishRows[0];

    // -----------------------------------------------------
    // TIDAK ADA BID
    // -----------------------------------------------------

    if (
      !auction.highest_bidder_id ||
      Number(
        auction.current_bid,
      ) <= 0
    ) {
      await connection.query(
        `
        UPDATE auction_listings
        SET
          status = 'expired',
          finished_at = NOW()
        WHERE id = ?
        `,
        [auction.id],
      );

      await connection.commit();

      return {
        success: true,
        status: "expired",
        sellerId:
          auction.seller_player_id,
        fishName:
          fish.fish_name,
        message:
          `⏰ *LELANG BERAKHIR*\n\n` +
          `🐟 ${fish.fish_name}\n\n` +
          `Tidak ada yang menawar.\n` +
          `↩️ Ikan tetap kembali/tersedia di inventory pemilik.`,
      };
    }

    // -----------------------------------------------------
    // LOCK WINNER
    // -----------------------------------------------------

    const [winnerRows] =
      await connection.query(
        `
        SELECT id, name
        FROM players
        WHERE id = ?
        FOR UPDATE
        `,
        [auction.highest_bidder_id],
      );

    if (winnerRows.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Pemenang lelang tidak ditemukan.",
      };
    }

    const winner =
      winnerRows[0];

    const winningBid =
      Number(
        auction.current_bid,
      );

    // -----------------------------------------------------
    // HAPUS IKAN DARI SELLER
    // -----------------------------------------------------

    const [deleteResult] =
      await connection.query(
        `
        DELETE FROM player_inventory
        WHERE id = ?
          AND player_id = ?
        `,
        [
          fish.id,
          auction.seller_player_id,
        ],
      );

    if (
      deleteResult.affectedRows === 0
    ) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Ikan gagal dipindahkan.",
      };
    }

    // -----------------------------------------------------
    // MASUKKAN IKAN KE WINNER
    // -----------------------------------------------------

    await connection.query(
      `
      INSERT INTO player_inventory
      (
        player_id,
        fish_name,
        rarity,
        weight,
        exp,
        gold
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        winner.id,
        fish.fish_name,
        fish.rarity,
        fish.weight,
        fish.exp,
        fish.gold,
      ],
    );

    // -----------------------------------------------------
    // BAYAR SELLER
    // -----------------------------------------------------

    await connection.query(
      `
      UPDATE players
      SET gold = gold + ?
      WHERE id = ?
      `,
      [
        winningBid,
        auction.seller_player_id,
      ],
    );

    // -----------------------------------------------------
    // SELESAIKAN AUCTION
    // -----------------------------------------------------

    await connection.query(
      `
      UPDATE auction_listings
      SET
        status = 'sold',
        finished_at = NOW()
      WHERE id = ?
      `,
      [auction.id],
    );

    await connection.commit();

    return {
      success: true,
      status: "sold",
      sellerId:
        auction.seller_player_id,
      winnerId:
        winner.id,
      fishName:
        fish.fish_name,
      amount:
        winningBid,
      message:
        `🏆 *LELANG SELESAI!*\n\n` +
        `🔨 Lelang: #${auction.id}\n` +
        `🐟 ${fish.fish_name}\n` +
        `⭐ ${fish.rarity}\n` +
        `⚖️ ${Number(fish.weight).toFixed(2)} kg\n\n` +
        `🏆 Pemenang: ${winner.name}\n` +
        `💰 Harga akhir: ${winningBid} Gold`,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Finish auction error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Gagal menyelesaikan lelang.",
    };
  } finally {
    connection.release();
  }
}

// =========================================================
// TUTUP AUCTION EXPIRED
// =========================================================

export async function closeExpiredAuctions() {
  const [expiredAuctions] =
    await pool.query(
      `
      SELECT id
      FROM auction_listings
      WHERE status = 'active'
        AND ends_at <= NOW()
      ORDER BY ends_at ASC
      `,
    );

  for (
    const auction
    of expiredAuctions
  ) {
    await finishAuction(
      auction.id,
    );
  }

  return expiredAuctions.length;
}

// =========================================================
// AUTO CLEANER
// =========================================================

setInterval(
  async () => {
    try {
      await closeExpiredAuctions();
    } catch (error) {
      console.error(
        "Auction auto close error:",
        error,
      );
    }
  },
  5000,
);

