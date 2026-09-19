import pool from "./database.js";

try {
  const [rows] = await pool.query("SELECT 1 AS berhasil");

  console.log("Database berhasil terhubung:", rows);
} catch (error) {
  console.error("Koneksi database gagal:", error.message);
} finally {
  await pool.end();
}