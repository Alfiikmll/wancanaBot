// Semua pengaturan AI ada di sini. Ubah angkanya sesuka kamu.
export const AI_CONFIG = {
  memory: {
    // Jumlah pesan per chat yang disimpan di RAM (harus >= directContextMessages)
    ramMessagesPerChat: 40,
    // Jumlah pesan per chat yang disimpan di database (yang lama dihapus otomatis)
    maxStoredPerChat: 200,
    // Berapa pesan terakhir yang dikirim ke AI saat DI-TAG / diminta
    directContextMessages: 20,
    // Berapa pesan terakhir yang dikirim ke AI saat NIMBRUNG (kecil = hemat token)
    autoContextMessages: 8,
    // Pesan yang lebih tua dari ini tidak dipakai sebagai konteks
    contextMaxAgeHours: 24,
    // Pesan panjang dipotong segini karakter (hemat token)
    maxCharsPerMessage: 300,
  },

  autoJoin: {
    // Mode awal untuk grup yang belum pernah diatur: "tag" atau "auto"
    defaultMode: "tag",
    // Peluang nimbrung ke pesan biasa (0.05 = 5%)
    baseChance: 0.05,
    // Peluang nimbrung kalau pesan mengandung tanda tanya
    questionChance: 0.15,
    // Peluang nimbrung kalau pesan mengandung kata pemicu
    triggerChance: 0.9,
    // Minimal jumlah pesan baru sejak bot terakhir bicara
    // (kata pemicu boleh melewati aturan ini)
    minMessagesBetween: 4,
    // Jeda minimal antar nimbrung per grup (detik)
    cooldownSeconds: 40,
    // Batas nimbrung per grup per jam
    maxPerHour: 15,
    // Pesan yang lebih pendek dari ini diabaikan
    minTextLength: 4,
    // Kata/frasa pemicu (tidak peka huruf besar-kecil)
    triggerWords: [
      "wancana",
      "bot",
      "ai",
      "gemini",
      "game",
      "mmorpg",
      "mmo",
      "berantem",
      "ml",
      "elden ring",
      "boss",
      "ice cream",
      "es krim",
      "ai gubluk",
      "ngopi",
      "main ps",
      "ps",
    ],
  },

  gemini: {
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    // Batas panjang jawaban. Kalau jawaban sering terpotong/kosong, naikkan.
    directMaxTokens: 1024,
    autoMaxTokens: 256,
  },
};