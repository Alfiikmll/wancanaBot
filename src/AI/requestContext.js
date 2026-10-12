import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

/**
 * Jalankan fungsi dengan konteks pesan (pengirim + gambar yang menempel).
 * Semua kode di dalamnya bisa membaca konteks ini tanpa mengubah parameter.
 */
export function runWithRequestContext(context, callback) {
  return storage.run(context, callback);
}

export function getRequestContext() {
  return storage.getStore() ?? {};
}