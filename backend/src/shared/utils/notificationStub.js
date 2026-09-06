import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { env } from '../../core/env.js';
import { db } from '../../core/database.js';

// Konfigurasi Nodemailer menggunakan akun Gmail yang Anda berikan
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

async function sendEmailOtp(email, kode) {
  if (env.otpDevMode) {
    console.log(`[DEV MODE] Kirim OTP ${kode} ke ${email}`);
    return { success: true, channel: 'email' };
  }
  
  try {
    // Pengiriman email dieksekusi di background (fire and forget dari sisi controller)
    await transporter.sendMail({
      from: `"LMS Politeknik Sukabumi" <${env.smtpUser}>`,
      to: email,
      subject: 'Kode Verifikasi OTP Anda',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2c3e50;">Verifikasi Akun LMS</h2>
          <p>Gunakan kode OTP berikut untuk masuk ke sistem:</p>
          <h1 style="color: #2980b9; letter-spacing: 5px;">${kode}</h1>
          <p style="color: #7f8c8d; font-size: 12px;">Kode ini hanya berlaku selama ${env.otpTtlMinutes} menit. JANGAN BERIKAN kode ini kepada siapapun.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] OTP berhasil dikirim ke ${email}`);
    return { success: true, channel: 'email' };
  } catch (error) {
    console.error('[EMAIL ERROR]:', error);
    return { success: false, channel: 'email', error };
  }
}

async function sendWhatsappOtp(noWa, kode) {
  if (env.otpDevMode) {
    console.log(`[DEV MODE] Kirim WA OTP ${kode} ke ${noWa}`);
    return { success: true, channel: 'whatsapp' };
  }
  
  const pesan = `*VERIFIKASI AKUN LMS*\n\nKode OTP Anda adalah: *${kode}*\n\nKode ini berlaku selama ${env.otpTtlMinutes} menit. Mohon JANGAN memberikan kode ini kepada siapapun termasuk pihak akademik demi keamanan akun.`;
  return sendWhatsappMessage(noWa, pesan);
}

async function sendWhatsappMessage(noWa, pesan) {
  if (env.otpDevMode) {
    console.log(`[DEV MODE] Pesan WA ke ${noWa}: ${pesan}`);
    return { success: true };
  }

  if (!env.fonnteToken) {
    console.error('[WA ERROR]: Fonnte token belum dikonfigurasi di .env');
    return { success: false, error: 'Gateway belum siap' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('target', noWa);
    formData.append('message', pesan);
    
    // Mengeksekusi request ke Fonnte API di background
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': env.fonnteToken
      },
      body: formData
    });

    const data = await response.json();
    if (data.status) {
      console.log(`[WA] Pesan berhasil dikirim ke ${noWa}`);
      return { success: true, channel: 'whatsapp', data };
    } else {
      console.error('[WA ERROR API]:', data.reason);
      return { success: false, channel: 'whatsapp', error: data.reason };
    }
  } catch (error) {
    console.error('[WA CATCH ERROR]:', error);
    return { success: false, channel: 'whatsapp', error };
  }
}

// ============================================================================
// GOOGLE DRIVE BACKGROUND REFRESH HANDLING
// ============================================================================

/**
 * Fungsi helper untuk mendapatkan Instance Google Drive milik User tertentu.
 * Sistem ini sudah menerapkan BACKGROUND AUTO-REFRESH.
 */
export async function getGoogleDriveClient(userId) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.googleRefreshToken) {
    throw new Error('User belum menghubungkan akun Google Drive');
  }

  // Membuat instance OAuth2 baru khusus untuk user ini
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
    process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  // Menyuntikkan token dari database
  // Jika expiry_date sudah lewat, package `googleapis` akan SECARA OTOMATIS 
  // melakukan HTTP Request untuk merefresh token sebelum mengeksekusi operasi Drive.
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : null,
  });

  // LISTENER BACKGROUND REFRESH: 
  // Saat `googleapis` otomatis merefresh token, event 'tokens' akan dipicu.
  // Kita harus menyimpan Access Token baru tersebut kembali ke database secara diam-diam.
  oauth2Client.on('tokens', async (tokens) => {
    const updateData = { googleAccessToken: tokens.access_token };
    
    // Refresh token jarang berubah, tapi jika Google memberikannya yang baru, kita simpan juga.
    if (tokens.refresh_token) updateData.googleRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date) updateData.googleTokenExpiry = new Date(tokens.expiry_date);
    
    try {
      await db.user.update({
        where: { id: userId },
        data: updateData
      });
      console.log(`[GDRIVE BACKGROUND] Token berhasil diperbarui secara otomatis untuk User #${userId}`);
    } catch (dbErr) {
      console.error(`[GDRIVE BACKGROUND ERROR] Gagal menyimpan token baru User #${userId}:`, dbErr);
    }
  });

  // Kembalikan instance Google Drive v3 yang sudah terotorisasi dan punya fitur auto-refresh
  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function connectGoogleDrive(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
    process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  // Generate link login Google untuk user. 
  // PENTING: `access_type: offline` wajib agar Google memberikan Refresh Token.
  // PENTING: `prompt: consent` memaksa Google memberikan ulang Refresh Token bila user login ulang.
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file']
  });
  
  return { success: true, authUrl };
}

export const notificationStub = { sendEmailOtp, sendWhatsappOtp, sendWhatsappMessage, connectGoogleDrive, getGoogleDriveClient };
