import { db } from '../../core/database.js';

/**
 * Catat aktivitas ke activity_log (audit trail). Fire-and-forget aman:
 * kegagalan logging tidak menggagalkan request utama.
 */
export async function logActivity({ userId, aktivitas, modul, ipAddress }) {
  try {
    await db.activityLog.create({
      data: { userId: userId ?? null, aktivitas, modul, ipAddress: ipAddress ?? null },
    });
  } catch (err) {
    console.error('[activity_log] gagal mencatat:', err.message);
  }
}
