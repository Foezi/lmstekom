# SimTugas — LMS Pemantauan Pengumpulan Tugas Kuliah

Aplikasi LMS untuk memantau pengumpulan tugas kuliah mahasiswa dengan deteksi keterlambatan otomatis, grading, dan rekap pengumpulan per kelas.

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Backend | Express.js (JavaScript) + Prisma ORM |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT (jsonwebtoken + bcrypt) + role-based access |
| Frontend | React + Vite + TailwindCSS |

## Role Pengguna

- **Admin** — kelola user, mata kuliah, kelas
- **Dosen** — buat tugas & deadline, pantau pengumpulan, beri nilai & feedback
- **Mahasiswa** — submit tugas, lihat status (tepat waktu/terlambat), lihat nilai

## Struktur Projek

```
lms-simtugas/
├── docs/                   # Blueprint & dokumentasi desain
├── backend/                # REST API (Express + Prisma)
│   ├── prisma/             # Schema database PostgreSQL
│   └── src/
│       ├── config/         # Konfigurasi (db, env)
│       ├── middlewares/    # auth, role, validasi, error handler
│       ├── routes/
│       ├── controllers/
│       ├── services/       # Business logic
│       └── utils/
└── frontend/               # SPA (React + Vite + Tailwind)
    └── src/
        ├── api/            # Axios instance & endpoint client
        ├── components/
        ├── context/        # AuthContext
        └── pages/
```

## Cara Menjalankan

### 1. Database

```bash
docker compose up -d
```

PostgreSQL berjalan di `localhost:5432` (user: `lms_user`, password: `lms_password`, db: `lms_simtugas`).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

API berjalan di `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.
