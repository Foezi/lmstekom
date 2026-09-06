import crypto from 'crypto';

/**
 * Penyimpanan sementara hasil preview import (idempotent import — blueprint §4.3-2).
 * Preview menyimpan baris tervalidasi; commit memakai batch_id yang sama.
 * In-memory: cukup untuk instans tunggal; ganti Redis untuk multi-instans.
 */
const TTL_MS = 30 * 60 * 1000; // 30 menit
const store = new Map();

export function saveBatch({ userId, entity, rows, errors }) {
  const id = crypto.randomUUID();
  store.set(id, { userId, entity, rows, errors: errors || [], createdAt: Date.now() });
  cleanup();
  return id;
}

export function getBatch(id, { userId, entity }) {
  const batch = store.get(id);
  if (!batch) return null;
  if (batch.userId !== userId || batch.entity !== entity) return null;
  if (Date.now() - batch.createdAt > TTL_MS) {
    store.delete(id);
    return null;
  }
  return batch;
}

export function deleteBatch(id) {
  store.delete(id);
}

function cleanup() {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now - val.createdAt > TTL_MS) store.delete(key);
  }
}
