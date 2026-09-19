
export const rods = {
  wood: {
    id: "wood",
    name: "Rod Kayu",
    type: "normal",
    price: 0,
    gachaChance: null,

    bonus: {
      rareChance: 0,
      weightMultiplier: 1,
      goldMultiplier: 1,
      expMultiplier: 1,
    },

    skill: null,
    partner: null,
  },

  bamboo: {
    id: "bamboo",
    name: "Rod Bamboo",
    type: "normal",
    price: 10,
    gachaChance: null,

    bonus: {
      rareChance: 2,
      weightMultiplier: 1,
      goldMultiplier: 1.05,
      expMultiplier: 1,
    },

    skill: {
      id: "bamboo_luck",
      name: "Bamboo Luck",
      chance: 5,
      description: "5% peluang mendapatkan bonus Gold.",
      effect: "gold_bonus",
    },

    partner: null,
  },

  elastic: {
    id: "elastic",
    name: "Rod Elastis",
    type: "normal",
    price: 20,
    gachaChance: null,

    bonus: {
      rareChance: 1,
      weightMultiplier: 1.05,
      goldMultiplier: 1,
      expMultiplier: 1,
    },

    skill: {
      id: "elastic_catch",
      name: "Elastic Catch",
      chance: 10,
      description: "10% peluang mendapatkan bonus tangkapan.",
      effect: "extra_catch",
    },

    partner: null,
  },

  iron: {
    id: "iron",
    name: "Rod Besi",
    type: "normal",
    price: 50,
    gachaChance: null,

    bonus: {
      rareChance: 3,
      weightMultiplier: 1.1,
      goldMultiplier: 1,
      expMultiplier: 1,
    },

    skill: {
      id: "iron_grip",
      name: "Iron Grip",
      chance: 8,
      description: "8% peluang meningkatkan berat ikan.",
      effect: "weight_bonus",
    },

    partner: null,
  },

  gold: {
    id: "gold",
    name: "Rod Emas",
    type: "normal",
    price: 100,
    gachaChance: null,

    bonus: {
      rareChance: 4,
      weightMultiplier: 1.1,
      goldMultiplier: 1.2,
      expMultiplier: 1,
    },

    skill: {
      id: "golden_fortune",
      name: "Golden Fortune",
      chance: 12,
      description: "12% peluang mendapatkan bonus Gold besar.",
      effect: "gold_jackpot",
    },

    partner: null,
  },

  platinum: {
    id: "platinum",
    name: "Rod Platinum",
    type: "normal",
    price: 120,
    gachaChance: null,

    bonus: {
      rareChance: 6,
      weightMultiplier: 1.15,
      goldMultiplier: 1.15,
      expMultiplier: 1.2,
    },

    skill: {
      id: "platinum_bonus",
      name: "Platinum Bonus",
      chance: 10,
      description: "10% peluang mendapatkan bonus EXP.",
      effect: "exp_bonus",
    },

    partner: null,
  },

  diamond: {
    id: "diamond",
    name: "Rod Diamond",
    type: "normal",
    price: 200,
    gachaChance: null,

    bonus: {
      rareChance: 9,
      weightMultiplier: 1.25,
      goldMultiplier: 1.25,
      expMultiplier: 1.25,
    },

    skill: {
      id: "diamond_guarantee",
      name: "Diamond Guarantee",
      chance: 10,
      description: "10% peluang menaikkan rarity ikan.",
      effect: "rarity_upgrade",
    },

    partner: null,
  },

  ambatukamm: {
    id: "ambatukamm",
    name: "Rod Ambatukamm",
    type: "secret",
    price: null,
    gachaChance: 4,

    bonus: {
      rareChance: 12,
      weightMultiplier: 1.3,
      goldMultiplier: 1.15,
      expMultiplier: 1.15,
    },

    skill: {
      id: "weight_burst",
      name: "Ambatukamm Burst",
      chance: 15,
      description: "15% peluang menggandakan berat ikan.",
      effect: "double_weight",
    },

    partner: {
      name: "Ambatukamm",
      quote: "HASIL TANGKAPAN MELEDAK!",
    },
  },

  adulPalembang: {
    id: "adulPalembang",
    name: "Rod Adul Palembang",
    type: "secret",
    price: null,
    gachaChance: 45,

    bonus: {
      rareChance: 8,
      weightMultiplier: 1.2,
      goldMultiplier: 1.5,
      expMultiplier: 1.1,
    },

    skill: {
      id: "sultan_bonus",
      name: "Sultan Bonus",
      chance: 12,
      description: "12% peluang mendapatkan Gold tambahan dalam jumlah besar.",
      effect: "gold_jackpot",
    },

    partner: {
      name: "Adul Palembang",
      quote: "Tenang, rezeki anak sultan!",
    },
  },

  bigbosRodd: {
    id: "bigbosRodd",
    name: "Bigbos Rodd",
    type: "secret",
    price: null,
    gachaChance: 25,

    bonus: {
      rareChance: 10,
      weightMultiplier: 1.35,
      goldMultiplier: 1.2,
      expMultiplier: 1.4,
    },

    skill: {
      id: "bigbos_command",
      name: "Bigbos Command",
      chance: 10,
      description: "10% peluang meningkatkan berat ikan dan EXP.",
      effect: "bigbos_bonus",
    },

    partner: {
      name: "Bigbos Rodd",
      quote: "Semua ikan harus tunduk kepada Bigbos!",
    },
  },

  inkor: {
    id: "inkor",
    name: "Rod Perternak Lele Legendaris Hero — Inkor",
    type: "secret",
    price: null,
    gachaChance: 2,

    bonus: {
      rareChance: 15,
      weightMultiplier: 1.4,
      goldMultiplier: 1.25,
      expMultiplier: 1.3,
    },

    skill: {
      id: "lele_empire",
      name: "Lele Empire",
      chance: 20,
      description: "20% peluang bonus besar ketika mendapatkan ikan bertema lele.",
      effect: "lele_bonus",
    },

    partner: {
      name: "Inkor si Lele Hero",
      quote: "Lele jumbo siap dikirim, Bos!",
    },
  },

  adulRayapBesi: {
    id: "adulRayapBesi",
    name: "Rod Adul si Rayap Besi",
    type: "secret",
    price: null,
    gachaChance: 20,

    bonus: {
      rareChance: 13,
      weightMultiplier: 1.5,
      goldMultiplier: 1.2,
      expMultiplier: 1.2,
    },

    skill: {
      id: "iron_eater",
      name: "Iron Eater",
      chance: 10,
      description: "10% peluang mendapatkan material besi.",
      effect: "iron_material",
    },

    partner: {
      name: "Adul si Rayap Besi",
      quote: "Besi? Sini biar saya makan!",
    },
  },

  superByan: {
    id: "superByan",
    name: "Rod Super Byan Ngawi Legend",
    type: "secret",
    price: null,
    gachaChance: 3,

    bonus: {
      rareChance: 18,
      weightMultiplier: 1.45,
      goldMultiplier: 1.3,
      expMultiplier: 1.5,
    },

    skill: {
      id: "legendary_entrance",
      name: "Legendary Entrance",
      chance: 8,
      description: "8% peluang memicu efek Legendary Entrance.",
      effect: "legendary_entrance",
    },

    partner: {
      name: "Super Byan Ngawi",
      quote: "Legenda telah tiba!",
    },
  },

  diazAyam: {
    id: "diazAyam",
    name: "Rod Diaz Ayam Kaefci Lezat",
    type: "secret",
    price: null,
    gachaChance: 0.9,

    bonus: {
      rareChance: 14,
      weightMultiplier: 1.3,
      goldMultiplier: 1.4,
      expMultiplier: 1.25,
    },

    skill: {
      id: "kaefci_meal",
      name: "Kaefci Meal",
      chance: 10,
      description: "10% peluang mendapatkan item makanan.",
      effect: "food_item",
    },

    partner: {
      name: "Diaz Ayam Kaefci",
      quote: "Ayam lezat, ikan hebat!",
    },
  },

  mythical: {
    id: "mythical",
    name: "🌌 MYTHICAL ROD — SUPREME",
    type: "mythical",
    price: null,
    gachaChance: 0.1,

    bonus: {
      rareChance: 30,
      weightMultiplier: 2,
      goldMultiplier: 1.75,
      expMultiplier: 2,
    },

    skill: {
      id: "mythical_reality_break",
      name: "Mythical Reality Break",
      chance: 5,
      description: "5% peluang mengubah ikan menjadi ikan Mythical.",
      effect: "mythical_upgrade",
    },

    partner: {
      name: "Wancana, Penjaga Laut Mythical",
      quote: "Takdir ikan Mythical telah terbuka.",
    },
  },
};

export function getRodById(rodId) {
  return rods[rodId] || null;
}

export function getAllRods() {
  return Object.values(rods);
}

export function getNormalRods() {
  return getAllRods().filter(
    (rod) => rod.type === "normal",
  );
}

export function getGachaRods() {
  return getAllRods().filter(
    (rod) =>
      rod.type === "secret" ||
      rod.type === "mythical",
  );
}
