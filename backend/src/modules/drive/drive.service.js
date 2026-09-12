import { google } from 'googleapis';
import { env } from '../../core/env.js';
import { db } from '../../core/database.js';
import fs from 'fs';

/**
 * Mendapatkan instance OAuth2 Client yang terkonfigurasi.
 */
export function getOAuth2Client() {
  if (!env.googleClientId || !env.googleClientSecret) {
    return null; // Return null if not configured, indicating we should run in simulation mode
  }
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    `${env.backendUrl}/api/auth/drive/callback`
  );
}

/**
 * Generate URL untuk user melakukan otorisasi Google Drive.
 */
export function generateAuthUrl(userId) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth2 client tidak terkonfigurasi. Tambahkan GOOGLE_CLIENT_ID di .env');
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/drive.file' // Hanya akses file yang di-create oleh aplikasi ini
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Meminta refresh token
    prompt: 'consent', // Memaksa consent agar selalu dapat refresh token
    scope: scopes,
    state: String(userId), // Kirim userId sebagai state untuk dikenali di callback
  });
}

/**
 * Handle callback dari Google OAuth2.
 * @param {string} code 
 * @param {string} state (userId)
 */
export async function handleGoogleCallback(code, state) {
  const userId = parseInt(state, 10);
  if (!userId || isNaN(userId)) {
    throw new Error('Invalid state (userId)');
  }

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth2 is not configured.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  
  // Simpan tokens ke database
  await db.user.update({
    where: { id: userId },
    data: {
      googleDriveConnected: true,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    }
  });

  return userId;
}

/**
 * Simulasi connect drive (jika kredensial belum tersedia).
 */
export async function simulateConnectDrive(userId) {
  await db.user.update({
    where: { id: userId },
    data: {
      googleDriveConnected: true,
      googleAccessToken: 'simulated_access_token',
      googleRefreshToken: 'simulated_refresh_token',
      googleTokenExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 tahun
    }
  });
  return userId;
}

/**
 * Mengunggah file ke Google Drive (atau simulasi jika tidak terkonfigurasi).
 * @param {number} userId 
 * @param {object} file (objek multer: { originalname, mimetype, path, stream dll })
 * @param {string} folderName (opsional)
 */
export async function uploadFileToDrive(userId, file) {
  const oauth2Client = getOAuth2Client();
  
  // Jika tidak ada kredensial, jalankan simulasi sukses
  if (!oauth2Client) {
    console.log(`[SIMULATION] Menerima file ${file.originalname} dari user ${userId}. Simulasi upload ke GDrive sukses.`);
    
    // Harus hapus temp file meskipun simulasi
    if (file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error(`[DriveService] Gagal menghapus file temp ${file.path}:`, err);
      });
    }

    return {
      fileId: `mock_gdrive_id_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      webViewLink: `https://drive.google.com/file/d/mock_gdrive_id_${Date.now()}/view`
    };
  }

  // Dapatkan token user dari database
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.googleDriveConnected || !user.googleRefreshToken) {
    throw new Error('User belum menghubungkan akun Google Drive');
  }

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : null,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  const fileMetadata = {
    name: file.originalname,
  };
  
  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  // Set file permission to public (anyone with the link can read)
  try {
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (permErr) {
    console.error(`[DriveService] Gagal mengatur permission public untuk file ${res.data.id}:`, permErr);
  }

  // Hapus file temporary lokal setelah upload selesai
  fs.unlink(file.path, (err) => {
    if (err) console.error(`[DriveService] Gagal menghapus file temp ${file.path}:`, err);
  });

  return {
    fileId: res.data.id,
    webViewLink: res.data.webViewLink
  };
}

/**
 * Menghapus file dari Google Drive.
 */
export async function deleteFileFromDrive(userId, fileId) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    console.log(`[SIMULATION] Menghapus file ${fileId} dari GDrive. Simulasi sukses.`);
    return true;
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.googleDriveConnected || !user.googleRefreshToken) {
    throw new Error('User belum menghubungkan akun Google Drive');
  }

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : null,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error(`[DriveService] Gagal menghapus file ${fileId} di GDrive:`, error.message);
    throw new Error('Gagal menghapus file dari Google Drive');
  }
}
