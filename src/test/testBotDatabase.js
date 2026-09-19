import { daftarPlayer } from "../commands/daftar.js";
import { getProfile } from "../commands/profile.js";
import { getInventory } from "../commands/inventory.js";

import { fish } from "../systems/fishingSystem.js";
import { saveCaughtFish } from "../systems/inventorySystem.js";
import { addPlayerRewards } from "../systems/economySystem.js";

const testWhatsappId =
  "6281234567890@s.whatsapp.net";

const daftar = await daftarPlayer(
  testWhatsappId,
  "Tester Wancana",
);

console.log("DAFTAR:");
console.log(daftar.message);

const profileBefore = await getProfile(
  testWhatsappId,
);

console.log("\nPROFILE SEBELUM MANCING:");
console.log(profileBefore.message);

const catchResult = await fish();

console.log("\nHASIL MANCING:");
console.log(catchResult);

if (catchResult.success) {
  await saveCaughtFish(
    profileBefore.player.id,
    catchResult,
  );

  const rewardResult = await addPlayerRewards(
    profileBefore.player.id,
    catchResult.exp,
    catchResult.gold,
  );

  console.log("\nREWARD:");
  console.log(rewardResult);
}

const profileAfter = await getProfile(
  testWhatsappId,
);

console.log("\nPROFILE SETELAH MANCING:");
console.log(profileAfter.message);

const inventory = await getInventory(
  testWhatsappId,
);

console.log("\nINVENTORY:");
console.log(inventory.message);