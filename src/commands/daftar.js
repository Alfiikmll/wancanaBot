import pool from "../databases/database.js";

export async function daftarPlayer(
  whatsappId,
  name,
) {
  // Validasi nama kosong
  if (!name || name.trim() === "") {
    return {
      success: false,
      message: `
❌ Nama belum diisi.

Gunakan format:
 /daftar NamaKamu
      `.trim(),
    };
  }

  const cleanName = name.trim();

  // Validasi panjang nama
  if (cleanName.length < 3) {
    return {
      success: false,
      message:
        "❌ Nama minimal terdiri dari 3 karakter.",
    };
  }

  if (cleanName.length > 30) {
    return {
      success: false,
      message:
        "❌ Nama maksimal terdiri dari 30 karakter.",
    };
  }

  // Cek apakah nomor WhatsApp sudah memiliki akun
  const [existingPlayers] = await pool.query(
    `SELECT *
     FROM players
     WHERE whatsapp_id = ?`,
    [whatsappId],
  );

  if (existingPlayers.length > 0) {
    return {
      success: false,
      message: `
❌ Nomor WhatsApp ini sudah memiliki akun.

👤 Nama: ${existingPlayers[0].name}
⭐ Level: ${existingPlayers[0].level}
💰 Gold: ${existingPlayers[0].gold}

Satu nomor hanya boleh memiliki satu akun.
      `.trim(),
      player: existingPlayers[0],
    };
  }

  // Membuat akun baru
  const [result] = await pool.query(
  `INSERT INTO players (whatsapp_id, name, current_rod)
   VALUES (?, ?, ?)`,
  [whatsappId, cleanName, "wood"],
);

await pool.query(
  `INSERT INTO player_rods (player_id, rod_id, obtained_from)
   VALUES (?, ?, ?)`,
  [result.insertId, "wood", "starter"],
);

  const [newPlayers] = await pool.query(
    `SELECT *
     FROM players
     WHERE id = ?`,
    [result.insertId],
  );

  return {
    success: true,
    message: `
🎉 Selamat datang, ${cleanName}!

Kamu berhasil terdaftar di Wancana Bot.

⭐ Level: 1
✨ EXP: 0
💰 Gold: 100

Selamat bermain! 🎣
    `.trim(),
    player: newPlayers[0],
  };
}