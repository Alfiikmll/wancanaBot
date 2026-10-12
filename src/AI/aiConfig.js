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
    baseChance: 0.5,
    // Peluang nimbrung kalau pesan mengandung tanda tanya
    questionChance: 1,
    // Peluang nimbrung kalau pesan mengandung kata pemicu
    triggerChance: 0.9,
    // Minimal jumlah pesan baru sejak bot terakhir bicara
    // (kata pemicu boleh melewati aturan ini)
    minMessagesBetween: 4,
    // Jeda minimal antar nimbrung per grup (detik)
    cooldownSeconds: 3,
    // Batas nimbrung per grup per jam
    maxPerHour: 15,
    // Pesan yang lebih pendek dari ini diabaikan
    minTextLength: 1,
    // Kata/frasa pemicu (tidak peka huruf besar-kecil)
    triggerWords: [
      "wancana",
      "wancana",
      "nimbrung",
      "bot",
      "ai",
      "big bos",
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

  // Bot membuka topik sendiri kalau grup sepi.
  // Hanya berlaku untuk grup yang mode-nya "auto" (/aimode auto).
  icebreaker: {
    enabled: true,
    // Grup dianggap sepi kalau tidak ada pesan masuk selama ini (menit)
    idleMinutes: 180,
    // Seberapa sering bot mengecek grup (menit)
    checkEveryMinutes: 10,
    // Jam tenang: bot tidak membuka topik di jam ini (0-23, zona waktu di bawah)
    quietHoursStart: 23,
    quietHoursEnd: 7,
    timeZone: "Asia/Jakarta",
    // Maksimal bot membuka topik per grup per hari
    maxPerDay: 3,
    // Setelah bot membuka topik, peluang membalas obrolan berikutnya naik
    // selama beberapa menit (supaya balasan member tidak dicuekin)
    afterOpenerChance: 0.9,
    afterOpenerMinutes: 10,
    // Ide topik acak yang diselipkan ke Gemini supaya tidak monoton
    topicIdeas: [
      "jokes gaul satir",
      "tempat nongrong terbaik",
      "rekomendasi game seru untuk dimainkan bareng",
      "makanan manis atau ice cream favorit",
      "pertanyaan 'pilih mana' yang lucu dan ringan",
      "hal random lucu yang terjadi hari ini",
      "game lama yang bikin nostalgia",
    ],
  },

  gemini: {
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    // Batas panjang jawaban. Kalau jawaban sering terpotong/kosong, naikkan.
    directMaxTokens: 1024,
    autoMaxTokens: 256,
  },
};