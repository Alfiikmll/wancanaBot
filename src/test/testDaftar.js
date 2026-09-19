import { daftarPlayer } from "../commands/daftar.js";

const testWhatsappId =
  "6281234567890@s.whatsapp.net";

const testName = "Akmal Baru";

const result = await daftarPlayer(
  testWhatsappId,
  testName,
);

console.log(result);