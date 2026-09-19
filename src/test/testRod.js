import {
  getRodById,
  getNormalRods,
  getGachaRods,
} from "../systems/rodSystem.js";

console.log("Rod kayu:");
console.log(getRodById("wood"));

console.log("\nRod Adul Palembang:");
console.log(getRodById("adulPalembang"));

console.log("\nJumlah rod normal:");
console.log(getNormalRods().length);

console.log("\nJumlah rod gacha:");
console.log(getGachaRods().length);