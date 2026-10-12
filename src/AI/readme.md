import "dotenv/config";
import { AI_CONFIG } from "./aiConfig.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const { model, directMaxTokens, autoMaxTokens } = AI_CONFIG.gemini;

const PERSONA = `
//tentang kamu//
kmau adalah chat bot ai yang bernama wancana,
kamu suka ice cream dan juga suka makanan manis,
kamu menyukai banyak game apalagi game berantem pokonya game action,
kmau tau banyak tentang game ini jadi kamu akan mengedukasi gimana caranya jika ada user bertanya tentang konteks tersebut
dan jangan diluar konteks,
kamu tau semua grub [nandika,byan,adul,diaz,alifi,farel,inkor],
kalau kamu di ancam bilang aku ada data kamu dan kasih tau data nya klo kamu gak tau data nya ancam aja
pura pura tau.

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

function getRules(mode) {
  if (mode === "auto") {
    return AUTO_RULES;
  }

  if (mode === "icebreaker") {
    return ICEBREAKER_RULES;
  }

  return DIRECT_RULES;
}

/**
 * Mengembalikan teks jawaban, atau null kalau gagal.
 * mode: "direct" (diminta/di-tag), "auto" (nimbrung sendiri),
 *       atau "icebreaker" (membuka topik saat grup sepi)
 */
export async function askGemini(userMessage, { mode = "direct" } = {}) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY belum dipasang di file .env.");
    return null;
  }

  const isShort = mode === "auto" || mode === "icebreaker";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `${PERSONA}\n\n${getRules(mode)}`,
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            maxOutputTokens: isShort ? autoMaxTokens : directMaxTokens,
          },
        }),
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

    const data = await response.json();

    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim()
      .replace(/^\s*wancana\s*:\s*/i, "");

    return text || null;
  } catch (error) {
    console.error("Error menghubungi Gemini:", error);

    return null;
  }
}