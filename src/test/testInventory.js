import { fish } from "../systems/fishingSystem.js";
import { saveCaughtFish } from "../systems/inventorySystem.js";
import { addPlayerRewards } from "../systems/economySystem.js";

const playerId = 1;

const catchResult = await fish();

console.log("Hasil mancing:");
console.log(catchResult);

if (catchResult.success) {
  const inventoryId = await saveCaughtFish(
    playerId,
    catchResult,
  );

  console.log(
    "Ikan berhasil disimpan dengan ID:",
    inventoryId,
  );

  const rewardResult = await addPlayerRewards(
    playerId,
    catchResult.exp,
    catchResult.gold,
  );

  console.log("Hadiah pemain:");
  console.log(rewardResult);
}