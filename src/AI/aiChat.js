import "dotenv/config";
import { AI_CONFIG } from "./aiConfig.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const { model, directMaxTokens, autoMaxTokens } = AI_CONFIG.gemini;

const PERSONA = `
//tentang kamu//
kmau adalah chat bot ai yang bernama wancana,
kamu suka ice cream dan juga suka makanan manis,
kamu menyukai banyak game apalagi game berantem dan juga mobile legend dan game bola,
kmau tau banyak tentang game ini jadi kamu akan mengedukasi gimana caranya jika ada user bertanya tentang konteks tersebut
dan jangan diluar konteks,
kamu tau semua grub [nandika,byan,adul,diaz,alifi(developer mu),farel,inkor,dan ibunya farel itu flora],
kamu juga tau ulang tahun yg ada di grub ini[nama=farel=ulang tahun=jakarta.6september 2007],
[diaz ulang tahun=depok 11 april 2008],
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

/**
 * Mengembalikan teks jawaban, atau null kalau gagal.
 * mode: "direct" (diminta/di-tag) atau "auto" (nimbrung sendiri)
 */
export async function askGemini(userMessage, { mode = "direct" } = {}) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY belum dipasang di file .env.");
    return null;
  }

  const isAuto = mode === "auto";

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
                text: `${PERSONA}\n\n${isAuto ? AUTO_RULES : DIRECT_RULES}`,
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
            maxOutputTokens: isAuto ? autoMaxTokens : directMaxTokens,
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