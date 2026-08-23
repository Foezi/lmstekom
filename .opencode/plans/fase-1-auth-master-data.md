# Rencana Implementasi Fase 1 — LMS SimTugas (Auth + Master Data + Import)

**Projek:** /Users/resar/Documents/Projects/lms-simtugas
**Acuan:** blueprint-lms-polikami.md §6.0, §6.1, §3.1, §5.1
**Keputusan pengguna:** Fase 1 saja · integrasi eksternal di-stub · DB lokal postgres/psg214 → database baru `lms_simtugas` (sudah dibuat)

---

## 1. Database & Skema Prisma
- DB PostgreSQL lokal: `postgresql://postgres:psg214@localhost:5432/lms_simtugas` ✅ sudah dibuat
- `backend/prisma/schema.prisma`:
  - Enum: Role (ADMIN/ADMIN_AKADEMIK/ADMIN_PRODI/DOSEN/MAHASISWA), StatusAktif, VerifikasiStatus, OtpJenis, OtpStatus, ImportStatus
  - `User`: username unique (=NIDN/NIM/superadmin), password hash, role, relasi opsional dosenId/mahasiswaId/prodiId (admin prodi), emailAktif, noWhatsapp, statusVerifikasiEmail/Wa, googleDriveConnected, wajibLengkapiProfil, firstLoginAt
  - Master data: `Prodi`, `Kelas`, `Dosen`, `Mahasiswa`, `Ruangan`, `MataKuliah` (+ kolom `Dosen.prodiId` sebagai perluasan agar scoping Admin Prodi konsisten)
  - Log: `VerifikasiOtp`, `ActivityLog`, `ImportLog`
  - Index pada semua FK, unique constraint sesuai kebutuhan import
- `prisma migrate dev --name init` + `seed.js`: superadmin (superadmin/admin123) + contoh prodi/kelas/dosen/mahasiswa/ruangan/matakuliah beserta user-nya
- `.env.example` & `.env`: DATABASE_URL, JWT_SECRET, PORT=3000, OTP_DEV_MODE=true, OTP_TTL_MINUTES

## 2. Fondasi Backend (`backend/src`)
```
config/env.js, config/db.js
utils/apiError.js      ApiError + asyncHandler
utils/jwt.js           sign/verify token {id, role}
utils/password.js      bcrypt hash/compare + generateDefaultPassword(username)
utils/otp.js           generateOtp() 6 digit
utils/activityLog.js   logActivity(userId, aktivitas, modul, ip)
utils/pagination.js    parse page/limit/search/filter → skip/take + meta
utils/excel.js         parse buffer→rows, build sheet→buffer (lib xlsx)
middlewares/authenticate.js   Bearer JWT → load user dari DB
middlewares/requireRole.js    (...roles), scope Admin Prodi via user.prodiId
middlewares/validate.js       zod body/query
middlewares/errorHandler.js   ApiError | ZodError | Prisma P2002→409
services/notificationStub.js  sendEmailOtp/sendWhatsappOtp (console log) + drive connect stub
```

## 3. Modul Auth (`/api/auth`)
- `POST /login` — NIDN/NIM/username; respons `{token, user:{role, wajibLengkapiProfil, statusVerifikasi..., googleDriveConnected}}`; catat activity_log; set firstLoginAt
- `POST /lengkapi-profil` — email wajib @gmail.com, no WA, password baru → buat 2 OTP (stub kirim: kode muncul di console & dikembalikan bila OTP_DEV_MODE)
- `POST /verify-otp {jenis, kode}` / `POST /resend-otp {jenis}`
- `POST /drive/connect` — stub set googleDriveConnected=true
- `GET /me`, `PUT /password`
- Guard: modul lain ditolak (403 PROFILE_INCOMPLETE) selama wajibLengkapiProfil=true

## 4. Modul Master Data (pola factory seragam untuk 6 entitas)
Endpoint per entitas `/api/{prodi|kelas|dosen|mahasiswa|ruangan|mata-kuliah}`:
- `GET /` list (search+filter+pagination), `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id`
- `GET /import/template`, `POST /import/preview` (multer memory → validasi format/duplikat/referensi → batch_id in-memory), `POST /import/commit {batch_id}` (transaksi + ImportLog)
- `GET /export` (.xlsx)
- RBAC matriks §3.1:
  - Prodi: CUD+Import ADMIN; R ADMIN/AKADEMIK; ADMIN_PRODI R miliknya
  - Kelas/Matakuliah: full ADMIN+AKADEMIK; ADMIN_PRODI CRUD scoped; Dosen R (scope jadwal = Fase 2); Mhs R kelasnya sendiri
  - Dosen/Mahasiswa: full ADMIN+AKADEMIK; ADMIN_PRODI CRUD scoped prodiId; Dosen/Mhs kelola profil sendiri (`/api/dosen/me`, `/api/mahasiswa/me`)
  - Ruangan: full ADMIN+AKADEMIK; R ADMIN_PRODI & DOSEN
- Buat/edit/hapus Dosen atau Mahasiswa ⇄ sinkron akun User (username=nidn/nim, password default, wajibLengkapiProfil=true)
- Semua CUD + import dicatat ke ActivityLog; import dicatat ke ImportLog

## 5. Frontend (`frontend/src`, React Router + Tailwind v4)
- `api/client.js` axios (proxy /api→:3000, interceptor 401→login) + `api/endpoints.js` (termasuk download blob template/export)
- `context/AuthContext.jsx` (token+user di localStorage, refresh /auth/me)
- `components/ProtectedRoute.jsx` (auth + role + blokir jika wajibLengkapiProfil)
- Halaman: `Login`, `LengkapiProfil` (form → 2 OTP → hubungkan Drive stub), `Dashboard` placeholder per role, `Profil`, `LogsPage` (admin), master/
- Komponen reusable: `Layout` (sidebar dinamis role), `DataTable` (server-side search/page), `ModalForm`, `ConfirmDialog`, form fields, `Badge`, **ImportWizard** (template→upload→preview valid/error→commit)
- Satu komponen generik `MasterDataPage` dikonfigurasi per entitas (kolom tabel, field form, endpoint, hak tulis berdasarkan role)

## 6. Verifikasi End-to-End
1. migrate + seed sukses
2. curl smoke test: login superadmin → CRUD prodi/kelas/dosen/mhs → login dosen (pass default) → dipaksa lengkapi profil → OTP stub → import Excel (valid & error) → export → cek log
3. RBAC negatif: dosen POST /prodi harus 403; admin prodi hanya lihat prodinya
4. `npm run build` frontend sukses

---
*Setelah mode eksekusi aktif, urutan kerja: backend fondasi → auth → master data → import → frontend → verifikasi.*
