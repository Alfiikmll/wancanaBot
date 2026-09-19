import { getRods } from "../commands/joran.js";

const result = await getRods("6281234567890@s.whatsapp.net");

console.log(result.message);

process.exit();