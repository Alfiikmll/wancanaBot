import { fish } from "../systems/fishingSystem.js";

async function runFishingTest() {
  console.log("🎣 Memulai testing sistem fishing...\n");

  try {
    const result = await fish("wood");

    if (!result.success) {
      console.log("❌ Testing gagal");
      console.log(result.message);
      return;
    }

    console.log("✅ Testing berhasil!\n");

    console.log("📦 HASIL SIMULASI");
    console.log("-------------------------");
    console.log(`🪝 Rod: ${result.rod}`);
    console.log(`🐟 Ikan: ${result.fish}`);
    console.log(`⭐ Rarity: ${result.rarity}`);
    console.log(`⚖️ Berat: ${result.formattedWeight}`);
    console.log(`💰 Gold: ${result.gold}`);
    console.log(`✨ EXP: ${result.exp}`);
  } catch (error) {
    console.error("❌ Terjadi error saat testing:");
    console.error(error);
  } finally {
    process.exit();
  }
}

runFishingTest();