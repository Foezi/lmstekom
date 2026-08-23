/**
 * Stub layanan notifikasi & integrasi eksternal (blueprint §6.0c/d).
 * Interface siap diganti provider nyata (SMTP / WhatsApp Gateway / Google Drive API)
 * tanpa mengubah pemanggil di service layer.
 */

async function sendEmailOtp(email, kode) {
  console.log(`[STUB EMAIL] Kirim OTP ${kode} ke ${email}`);
  return { success: true, channel: 'email' };
}

async function sendWhatsappOtp(noWa, kode) {
  console.log(`[STUB WHATSAPP] Kirim OTP ${kode} ke ${noWa}`);
  return { success: true, channel: 'whatsapp' };
}

async function sendWhatsappMessage(noWa, pesan) {
  console.log(`[STUB WHATSAPP] Pesan ke ${noWa}: ${pesan}`);
  return { success: true };
}

/** Stub otorisasi OAuth2 Google Drive — langsung menandai user terhubung. */
async function connectGoogleDrive(user) {
  console.log(`[STUB GDRIVE] Otorisasi OAuth2 untuk user #${user.id} (${user.username})`);
  return { success: true };
}

export const notificationStub = { sendEmailOtp, sendWhatsappOtp, sendWhatsappMessage, connectGoogleDrive };
