// Pengaturan fitur AI tambahan: gaya bicara, baca gambar, cari info terbaru.

// ---------------------------------------------------------
// Gaya bicara per grup (/aigaya)
// ---------------------------------------------------------
export const STYLES = {
  default: {
    description: "kepribadian asli Wancana",
    prompt: "",
  },
  santai: {
    description: "santai seperti ngobrol sama teman dekat",
    prompt:
      "//gaya bicara tambahan//\nBicaralah sangat santai seperti ngobrol dengan teman dekat: bahasa gaul secukupnya, kalimat pendek, boleh bercanda ringan.",
  },
  sarkas: {
    description: "sarkas dan nyinyir tapi lucu",
    prompt:
      "//gaya bicara tambahan//\nBicaralah sarkas dan nyinyir tapi tetap lucu, tidak menyinggung SARA atau menghina pribadi. Tetap beri jawaban yang benar dan berguna.",
  },
  serius: {
    description: "serius dan sopan, minim candaan",
    prompt:
      "//gaya bicara tambahan//\nBicaralah serius dan sopan dengan bahasa yang rapi. Minim emoji dan hindari candaan. Jawaban jelas dan to the point.",
  },
};

// ---------------------------------------------------------
// Baca gambar
// ---------------------------------------------------------
export const IMAGE_CONFIG = {
  enabled: true,
  // Batas gambar yang boleh dibaca per orang per jam (hemat kuota)
  maxPerUserPerHour: 6,
  // Gambar lebih besar dari ini ditolak
  maxBytes: 4 * 1024 * 1024,
};

// ---------------------------------------------------------
// Cari info terbaru (Google Search lewat Gemini)
// ---------------------------------------------------------
export const SEARCH_CONFIG = {
  enabled: true,
  // Batas pencarian per hari untuk SEMUA grup (menjaga kuota free tier)
  maxPerDay: 30,
  timeZone: "Asia/Jakarta",
  // Search hanya dipakai kalau pesan mengandung salah satu kata ini
  keywords: [
    "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
    // "terkini",
    // "update",
    // "patch",
    // "rilis",
    // "release",
    // "kapan rilis",
    // "berita",
    // "hari ini",
    // "jadwal",
    // "harga",
    // "skor",
    // "season",
    // "versi",
    // "dlc",
    // "trailer",
    // "cari",
    // "googling",
    // "search",
  ],
};

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const searchRegex = SEARCH_CONFIG.keywords.length
  ? new RegExp(
      `(?<![\\p{L}\\p{N}])(?:${SEARCH_CONFIG.keywords
        .map(escapeRegex)
        .join("|")})(?![\\p{L}\\p{N}])`,
      "iu",
    )
  : null;

/** Apakah pesan ini butuh info terbaru dari internet? */
export function needsSearch(text) {
  return searchRegex ? searchRegex.test(String(text ?? "")) : false;
}

let searchDay = "";
let searchCount = 0;

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEARCH_CONFIG.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Ambil jatah pencarian hari ini. false = jatah habis. */
export function takeSearchSlot() {
  const today = todayKey();

  if (searchDay !== today) {
    searchDay = today;
    searchCount = 0;
  }

  if (searchCount >= SEARCH_CONFIG.maxPerDay) {
    return false;
  }

  searchCount += 1;

  return true;
}

const imageUsage = new Map(); // userId -> [timestamp]

/** Ambil jatah baca gambar untuk satu orang. false = jatah habis. */
export function takeImageSlot(userId) {
  const key = String(userId ?? "unknown");
  const now = Date.now();

  const list = (imageUsage.get(key) || []).filter(
    (time) => now - time < 60 * 60 * 1000,
  );

  if (list.length >= IMAGE_CONFIG.maxPerUserPerHour) {
    imageUsage.set(key, list);
    return false;
  }

  list.push(now);
  imageUsage.set(key, list);

  return true;
}