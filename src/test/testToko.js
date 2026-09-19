import {
  getRodShop,
  buyRod,
} from "../systems/rodPurchaseSystem.js";

const whatsappId = "6281234567890@s.whatsapp.net";

const shopResult = await getRodShop(whatsappId);
console.log(shopResult.message);

console.log("\n====================\n");

const buyResult = await buyRod(whatsappId, "bamboo");
console.log(buyResult.message);

process.exit();