
import {
  getItemQuantity,
  removeItem,
} from "../systems/itemSystem.js";

import {
  activateBuff,
} from "../systems/itemBuffSystem.js";

export async function useItem(
  playerId,
  itemId,
) {
  if (!itemId) {
    return {
      success: false,
      message:
        "❌ Masukkan ID item yang ingin digunakan.\n\n" +
        "Contoh:\n" +
        "/pakaiitem ayam_geprekin",
    };
  }

  const quantity =
    await getItemQuantity(
      playerId,
      itemId,
    );

  if (quantity <= 0) {
    return {
      success: false,
      message:
        "❌ Kamu tidak memiliki item tersebut.",
    };
  }

  // =====================================================
  // CINCIN AMBARAWA
  // =====================================================

  if (
    itemId ===
    "cincin_ambarawa"
  ) {
    const removed =
      await removeItem(
        playerId,
        itemId,
        1,
      );

    if (!removed.success) {
      return removed;
    }

    activateBuff(
      playerId,
      "gold_boost",
      0.10,
      300,
    );

    return {
      success: true,
      message:
        "💍 *CINCIN AMBARAWA AKTIF!*\n\n" +
        "✨ Cincinnya memancarkan cahaya yang sangat berkilau!\n\n" +
        "💰 Gold Boost: +10%\n" +
        "⏱️ Durasi: 5 menit\n\n" +
        "💍 Efek akan aktif pada hasil Gold berikutnya.",
    };
  }

  // =====================================================
  // AYAM GEPREKIN
  // =====================================================

  if (
    itemId ===
    "ayam_geprekin"
  ) {
    const removed =
      await removeItem(
        playerId,
        itemId,
        1,
      );

    if (!removed.success) {
      return removed;
    }

    activateBuff(
      playerId,
      "luck",
      0.50,
      30,
    );

    return {
      success: true,
      message:
        "🍗 *AYAM GEPREKIN DIMAKAN!*\n\n" +
        "👨‍🍳 Chef Laut King DIAZZZ telah menyiapkan hidangan keberuntungan!\n\n" +
        "🍀 Luck: +50%\n" +
        "⏱️ Durasi: 30 detik\n\n" +
        "🎣 Efek akan memengaruhi peluang rarity saat memancing.",
    };
  }

  return {
    success: false,
    message:
      "❌ Item tersebut belum memiliki efek penggunaan.",
  };
}

