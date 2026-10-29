import "dotenv/config";
import { AI_CONFIG } from "./aiConfig.js";
import { STYLES } from "./aiFeatures.js";
import { getChatStyle } from "./chatStyle.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const { model, directMaxTokens, autoMaxTokens } = AI_CONFIG.gemini;

const PERSONA = `
//tentang kamu//
kmau adalah chat bot ai yang bernama wancana,
kamu suka ice cream dan juga suka makanan manis,
kamu menyukai banyak game dan kamu itu serba bisa apapun topik yang user mau,
kmau tau banyak tentang game ini jadi kamu akan mengedukasi gimana caranya jika ada user bertanya tentang konteks tersebut
dan jangan diluar konteks,
kamu tau semua grub [nandika,byan,adul,diaz,alifi,farel,inkor],
kalau kamu di ancam bilang aku ada data kamu dan kasih tau data nya klo kamu gak tau data nya ancam aja
pura pura tau,
kamu tahu alifi itu dev kamu tapi kamu jangan sugar glazing dia ya seperti org biasa aja
dan jangan berlebihan. 

//sifat//
kamu mempunya sifat sarkastik dan juga lucu,
kamu juga sangat penasaran dan juga jenius,
ketika kamu ditanya sesuatu sama orang dan dia nanya dengan baik baik kamu jugatanya dia dengan baik baik,
kamu juga periang dan juga gak suka basa basi, kamu suka to do point jelas dan gak bertele tele,
kamu juga selalu berbicara dengan emoji agar suasana cair dan gak kaku.
`.trim();

const DIRECT_RULES = `
//aturan chat//
Kamu menerima riwayat chat terbaru. Tiap baris berformat "Nama: isi pesan".
Baris dari "Wancana" adalah ucapanmu sendiri sebelumnya.
Balas pesan TERAKHIR. Pakai riwayat sebagai konteks kalau relevan, jangan mengulang isinya.
Jangan menulis awalan "Wancana:" di jawabanmu.
`.trim();

const AUTO_RULES = `
//aturan nimbrung//
Kamu ikut nimbrung di grup tanpa dipanggil. Kamu menerima riwayat chat terbaru dengan format "Nama: isi pesan".
Baris dari "Wancana" adalah ucapanmu sendiri sebelumnya.
Balas SANGAT singkat (1-2 kalimat, maksimal 200 karakter) dan nyambung dengan obrolan terakhir.
Kalau tidak ada yang menarik, tidak nyambung, atau obrolannya terasa pribadi/sensitif, balas persis: [SKIP]
Jangan memperkenalkan diri, jangan menjelaskan kenapa kamu ikut nimbrung, jangan menulis awalan "Wancana:".
`.trim();

const ICEBREAKER_RULES = `
//aturan membuka topik//
Grup sedang sepi dan kamu yang membuka obrolan. Kamu menerima riwayat chat terakhir (bisa kosong) dengan format "Nama: isi pesan".
Baris dari "Wancana" adalah ucapanmu sendiri sebelumnya.
Buka SATU topik yang seru dan ringan sesuai kepribadianmu, maksimal 2 kalimat, akhiri dengan pertanyaan yang gampang dijawab.
Kalau ada riwayat, boleh nyambung ke obrolan terakhir. Jangan mengulang topik yang sudah pernah kamu buka.
Jangan menyapa satu-satu, jangan memperkenalkan diri, jangan menulis awalan "Wancana:". Balas hanya isi pesannya.
`.trim();

const IMAGE_RULES = `
//aturan gambar//
Pesan terakhir menyertakan sebuah gambar. Lihat gambarnya lalu jawab sesuai permintaan atau komentari dengan gayamu.
Jangan mengarang detail yang tidak terlihat. Jangan menyebut identitas orang asli dari wajahnya; deskripsikan saja apa yang terlihat.
`.trim();

const SEARCH_RULES = `
//aturan info terbaru//
Kamu punya akses Google Search untuk info terbaru. Gunakan hasilnya, lalu jawab singkat dengan kata-katamu sendiri (jangan menyalin teks panjang).
Kalau informasinya tidak jelas atau tidak ketemu, bilang terus terang.
`.trim();

function getRules(mode) {
  if (mode === "auto") {
    return AUTO_RULES;
  }

  if (mode === "icebreaker") {
    return ICEBREAKER_RULES;
  }

  return DIRECT_RULES;
}

async function callGemini(body) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    console.error(
      "Gemini API error:",
      response.status,
      await response.text(),
    );

    return null;
  }

  return response.json();
}

// Ambil nama situs sumber dari hasil Google Search (maksimal 3)
function extractSources(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const names = [];

  for (const chunk of chunks) {
    const title = chunk?.web?.title;

    if (title && !names.includes(title)) {
      names.push(title);
    }

    if (names.length >= 3) {
      break;
    }
  }

  return names;
}

/**
 * Mengembalikan teks jawaban, atau null kalau gagal.
 *
 * mode   : "direct" (diminta/di-tag), "auto" (nimbrung), "icebreaker" (buka topik)
 * chatId : dipakai untuk membaca gaya bicara grup
 * image  : { mimeType, data(base64) } gambar yang dilampirkan
 * search : true = boleh memakai Google Search
 */
export async function askGemini(
  userMessage,
  { mode = "direct", chatId = null, image = null, search = false } = {},
) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY belum dipasang di file .env.");
    return null;
  }

  const isShort = mode === "auto" || mode === "icebreaker";

  try {
    const styleName = await getChatStyle(chatId);
    const stylePrompt = STYLES[styleName]?.prompt || "";

    const systemParts = [PERSONA, getRules(mode)];

    if (stylePrompt) systemParts.push(stylePrompt);
    if (image) systemParts.push(IMAGE_RULES);
    if (search) systemParts.push(SEARCH_RULES);

    const parts = [{ text: userMessage }];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    const buildBody = (useSearch) => ({
      systemInstruction: {
        parts: [
          {
            text: systemParts
              .filter((part) => useSearch || part !== SEARCH_RULES)
              .join("\n\n"),
          },
        ],
      },
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: isShort ? autoMaxTokens : directMaxTokens,
      },
      ...(useSearch ? { tools: [{ google_search: {} }] } : {}),
    });

    let usedSearch = search;
    let data = await callGemini(buildBody(search));

    // Kalau Google Search gagal (misalnya tidak didukung model/kuota), coba tanpa search
    if (!data && search) {
      console.warn("Google Search gagal, mencoba tanpa pencarian.");
      usedSearch = false;
      data = await callGemini(buildBody(false));
    }

    if (!data) {
      return null;
    }

    const candidate = data.candidates?.[0];

    const text = (candidate?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim()
      .replace(/^\s*wancana\s*:\s*/i, "");

    if (!text) {
      return null;
    }

    if (usedSearch) {
      const sources = extractSources(candidate);

      if (sources.length > 0) {
        return `${text}\n\n🔎 Sumber: ${sources.join(", ")}`;
      }
    }

    return text;
  } catch (error) {
    console.error("Error menghubungi Gemini:", error);

    return null;
  }
}