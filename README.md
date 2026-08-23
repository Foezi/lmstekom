# SimTugas — LMS Politeknik Sukabumi

Implementasi blueprint LMS Politeknik Sukabumi (lihat `docs/`). Saat ini **Fase 1 selesai**: autentikasi & verifikasi akun, RBAC 5 peran, data master + import/export Excel.

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Backend | Express.js (ESM) + Prisma ORM |
| Database | PostgreSQL (lokal) |
| Auth | JWT + bcrypt, gate profil wajib, OTP stub |
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Import/Export | SheetJS (xlsx) |

## Status Fase

| Fase | Cakupan | Status |
|---|---|---|
| **1** | **Auth + onboarding, Master Data 6 entitas, Import Excel idempoten, Export, Audit log** | ✅ **Selesai** |
| 2 | Jadwal + validasi bentrok + import jadwal | ⬜ |
| 3 | Generate mengajar + 16 pertemuan otomatis | ⬜ |
| 4 | Materi, tugas, kuis (lockdown PG), nilai | ⬜ |
| 5 | Monitoring admin prodi/akademik | ⬜ |

## Role & Akun Demo (seed)

| Username | Password | Peran |
|---|---|---|
| `superadmin` | `admin123` | Administrator |
| `adminti` | `prodi123` | Admin Prodi D4-TI |
| `0012345601`, `0012345602` | `<NIDN>@poltek` | Dosen (password default) |
| `2204001`, `2204002`, `2404003` | `<NIM>@poltek` | Mahasiswa (password default) |

Login pertama kali dosen/mahasiswa: password default → wajib lengkapi profil (email Gmail + WA + password baru) → verifikasi OTP email & WhatsApp (**stub**: kode tampil di console backend & respons API saat `OTP_DEV_MODE=true`) → hubungkan Google Drive (stub).

## Menjalankan

```bash
# database — sesuaikan .env dengan PostgreSQL lokal Anda
cd backend && cp .env.example .env
npx prisma migrate dev   # bila belum ada migrasi
npm run db:seed
npm run dev              # API di :3000

cd frontend && npm install
npm run dev              # web di :5173 (proxy /api -> :3000)
```

## Struktur Backend

```
backend/src/
├── config/          env, Prisma client
├── middlewares/     authenticate (+gate profil), requireRole, validate(zod), errorHandler
├── services/        authService, crudFactory + masterConfigs (6 entitas), notificationStub
├── controllers/     authController, crudController (generik)
├── routes/          auth, profile (/me), master (factory), logs
└── utils/           jwt, password, otp, excel, pagination, activityLog, importBatchStore
```

### Endpoint utama

- `POST /api/auth/login` · `/lengkapi-profil` · `/verify-otp` · `/resend-otp` · `/drive/connect` · `GET /auth/me`
- `/api/prodi` · `/kelas` · `/dosen` · `/mahasiswa` · `/ruangan` · `/mata-kuliah`
  - CRUD + `GET /import/template` + `POST /import/preview|commit` + `GET /export`
- `GET /api/dosen/me`, `PUT /api/dosen/me`, `GET /api/mahasiswa/me` (profil sendiri)
- `GET /api/logs/activity`, `GET /api/logs/import` (admin)

Hak akses tiap modul mengikuti matriks RBAC blueprint §3.1; scoping Admin Prodi otomatis via relasi prodi.

## Catatan Integrasi (stub)

`services/notificationStub.js` menyediakan interface email/WA OTP dan Google Drive OAuth2. Fase integrasi nyata cukup mengganti implementasi stub tanpa mengubah service layer.
