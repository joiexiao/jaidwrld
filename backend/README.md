# Backend (Go) — reserved

Folder ini disiapkan untuk service backend **Go** yang akan menyusul. Saat ini
kosong; frontend tetap jalan mandiri.

## Pola

```
Browser → Next.js (Server Component / Route Handler) → Go API
```

Next.js bertindak sebagai **Backend-for-Frontend (BFF)**. Backend Go diakses
server-to-server lewat `fetch`, jadi **tidak butuh CORS** dan token tetap aman
di sisi server.

## Kontrak

- Backend Go mengekspos JSON API (REST).
- Next.js mengaksesnya lewat `API_BASE_URL` (lihat `.env.example`).
- Selama `API_BASE_URL` kosong, lapisan data frontend memakai mock/fallback.

## Deploy

- Vercel hanya host frontend Next.js (folder `backend/` diabaikan lewat
  `.vercelignore`).
- Backend Go di-deploy terpisah (Fly.io / Railway / Render / VPS / Cloud Run).

## Langkah saat backend mulai

1. Inisialisasi module Go di folder ini (`go mod init ...`).
2. Set `API_BASE_URL` di `.env.local` (dan env Vercel) ke alamat service Go.
3. Tambahkan lapisan jembatan di frontend: `lib/api/*` dan `data/` (DAL).
