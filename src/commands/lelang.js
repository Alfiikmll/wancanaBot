
import {
  createAuction,
  getActiveAuctions,
  placeBid,
} from "../systems/auctionSystem.js";

export async function handleAuctionCommand(
  whatsappId,
  argument,
) {
  const args =
    argument
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  // =====================================================
  // /lelang
  // =====================================================

  if (args.length === 0) {
    return buildAuctionHelp();
  }

  const action =
    args[0].toLowerCase();

  // =====================================================
  // /lelang lihat
  // =====================================================

  if (
    action === "lihat" ||
    action === "list"
  ) {
    const auctions =
      await getActiveAuctions();

    if (auctions.length === 0) {
      return {
        success: true,
        message:
          "🔨 *LELANG AKTIF*\n\n" +
          "Belum ada ikan yang sedang dilelang.",
      };
    }

    let message =
      "🔨 *LELANG AKTIF*\n\n";

    auctions.forEach(
      (auction) => {
        const currentBid =
          Number(
            auction.current_bid || 0,
          );

        const priceText =
          currentBid > 0
            ? `${currentBid} Gold`
            : `${auction.start_price} Gold`;

        const remaining =
          Math.max(
            0,
            Math.ceil(
              (
                new Date(
                  auction.ends_at,
                ).getTime() -
                Date.now()
              ) / 1000,
            ),
          );

        const minutes =
          Math.floor(
            remaining / 60,
          );

        const seconds =
          remaining % 60;

        const timeText =
          minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;

        message +=
          `🔨 *#${auction.id}*\n` +
          `🐟 ${auction.fish_name}\n` +
          `⭐ ${auction.rarity}\n` +
          `⚖️ ${Number(auction.weight).toFixed(2)} kg\n` +
          `👤 Penjual: ${auction.seller_name}\n` +
          `💰 Bid: ${priceText}\n` +
          `🏆 Penawar: ${auction.bidder_name || "Belum ada"}\n` +
          `⏱️ Sisa: ${timeText}\n\n`;
      },
    );

    message +=
      `Gunakan:\n` +
      `/lelang bid <ID> <harga>`;

    return {
      success: true,
      message: message.trim(),
    };
  }

  // =====================================================
  // /lelang jual <nomor> <harga>
  // =====================================================

  if (
    action === "jual"
  ) {
    if (args.length < 3) {
      return {
        success: false,
        message:
          "❌ Format salah.\n\n" +
          "/lelang jual <nomor_ikan> <harga_awal>\n\n" +
          "Contoh:\n" +
          "/lelang jual 2 500",
      };
    }

    const inventoryIndex =
      Number(args[1]);

    const startPrice =
      Number(args[2]);

    return await createAuction(
      whatsappId,
      inventoryIndex,
      startPrice,
    );
  }

  // =====================================================
  // /lelang bid <id> <harga>
  // =====================================================

  if (
    action === "bid"
  ) {
    if (args.length < 3) {
      return {
        success: false,
        message:
          "❌ Format salah.\n\n" +
          "/lelang bid <id_lelang> <harga>\n\n" +
          "Contoh:\n" +
          "/lelang bid 12 800",
      };
    }

    const auctionId =
      Number(args[1]);

    const bidAmount =
      Number(args[2]);

    return await placeBid(
      whatsappId,
      auctionId,
      bidAmount,
    );
  }

  return buildAuctionHelp();
}

function buildAuctionHelp() {
  return {
    success: true,
    message:
      "🔨 *SISTEM LELANG IKAN*\n\n" +

      "📋 Lihat lelang:\n" +
      "/lelang lihat\n\n" +

      "🐟 Buat lelang:\n" +
      "/lelang jual <nomor> <harga>\n\n" +

      "🔥 Ikut menawar:\n" +
      "/lelang bid <id> <harga>\n\n" +

      "📌 Aturan:\n" +
      "⏱️ Durasi awal 1 menit\n" +
      "🔥 Setiap bid valid +30 detik\n" +
      "♾️ Tidak ada batas maksimum waktu\n" +
      "🏆 Bid tertinggi menang\n" +
      "↩️ Tidak ada bid = ikan kembali ke pemilik",
  };
}

