# Arsitektur — jaidwrld

Dokumen ini memetakan struktur project: routing, komponen, lapisan, dan konvensi.
Prinsip utamanya **dua sumbu**: _lapisan (layer)_ dan _area (domain)_.

## Peta folder

```text
jaidwrld/
│
├─ app/                                  # App Router — ROUTING saja (sumber URL)
│  ├─ layout.tsx                         # Root layout: <html>/<body>, font, metadata  [semua route]
│  ├─ globals.css                        # Tailwind v4 + token tema
│  ├─ error.tsx                          # Error boundary (route segment)
│  ├─ global-error.tsx                   # Error boundary global (root)
│  ├─ not-found.tsx                      # UI 404
│  ├─ loading.tsx                        # UI loading default
│  ├─ favicon.ico
│  │
│  ├─ (portfolio)/                       # AREA PUBLIK (route group → URL: /)
│  │  ├─ layout.tsx                      # PortfolioShell: Navbar + Footer + SmoothScroll
│  │  ├─ page.tsx                        # HOMEPAGE  →  /
│  │  ├─ about/(page.tsx menyusul)       #           →  /about
│  │  ├─ contact/(page.tsx menyusul)     #           →  /contact
│  │  └─ project/                        #           →  /project
│  │     ├─ (page.tsx menyusul)          #           →  /project
│  │     └─ [slug]/page.tsx              #           →  /project/:slug
│  │
│  └─ (dashboard)/                       # AREA APP (privat, auth menyusul)
│     ├─ login/page.tsx                  #           →  /login   (tanpa shell dashboard)
│     └─ dashboard/
│        ├─ layout.tsx                   # DashboardShell: Sidebar + Topbar
│        ├─ page.tsx                     # Overview  →  /dashboard
│        ├─ projects/(page.tsx menyusul) #           →  /dashboard/projects
│        └─ settings/(page.tsx menyusul) #           →  /dashboard/settings
│
├─ components/                           # SEMUA komponen (domain-first)
│  ├─ README.md                          # Aturan lapisan + arah import
│  ├─ ui/                                # Primitif desain, area-agnostic (Button, Card, Input, Modal)
│  ├─ animation/                         # Primitif gerak, "use client" (Reveal, Parallax, SmoothScrollProvider)
│  ├─ portfolio/                         # KHUSUS area portfolio
│  │  ├─ sections/                       # HeroSection, AboutSection, WorkSection, ContactSection
│  │  └─ layout/                         # Navbar, Footer
│  └─ dashboard/                         # KHUSUS area dashboard
│     ├─ widgets/                        # StatCard, ActivityFeed, Chart, DataTable
│     └─ layout/                         # Sidebar, Topbar
│
├─ hooks/                                # Custom React hooks lintas-area (client)
├─ lib/                                  # Util murni (cn, formatDate, seo, konstanta)
├─ types/                                # Tipe TypeScript bersama (Project, User, ...)
├─ content/                              # Konten portfolio = objek TS (projects.ts, site.ts, about.ts)
├─ public/projects/                      # Gambar proyek (diisi manual; nama file = <slug>.jpg)
│
├─ backend/                              # Service GO (di-deploy terpisah, diabaikan Vercel)
│  └─ README.md                          # Rencana + kontrak API
│
├─ next.config.ts                        # typedRoutes: true
├─ tsconfig.json                         # alias @/* → ./*
├─ eslint.config.mjs
├─ postcss.config.mjs                    # Tailwind v4 via PostCSS
├─ .prettierrc.json / .prettierignore
├─ .gitignore / .gitattributes / .vercelignore
├─ .env.example                          # template env (tracked); salin ke .env.local
├─ pnpm-workspace.yaml
└─ AGENTS.md                             # aturan agen/Next
```

## Peta URL

| URL                   | Sumber                                    | Status      |
| --------------------- | ----------------------------------------- | ----------- |
| `/`                   | `app/(portfolio)/page.tsx`                | ✅ aktif    |
| `/login`              | `app/(dashboard)/login/page.tsx`          | ✅ aktif    |
| `/dashboard`          | `app/(dashboard)/dashboard/page.tsx`      | ✅ aktif    |
| `/_not-found`         | `app/not-found.tsx`                       | ✅ aktif    |
| `/about`              | `app/(portfolio)/about/page.tsx`          | ⏳ menyusul |
| `/contact`            | `app/(portfolio)/contact/page.tsx`        | ⏳ menyusul |
| `/project`            | `app/(portfolio)/project/page.tsx`        | ⏳ menyusul |
| `/project/:slug`      | `app/(portfolio)/project/[slug]/page.tsx` | ✅ aktif    |
| `/dashboard/projects` | `app/(dashboard)/dashboard/projects/`     | ⏳ menyusul |
| `/dashboard/settings` | `app/(dashboard)/dashboard/settings/`     | ⏳ menyusul |

## Lapisan komponen

| Folder                     | Isi                                               | Boleh import dari           |
| -------------------------- | ------------------------------------------------- | --------------------------- |
| `ui/`                      | Primitif desain (Button, Card, Input, Modal)      | — (nol dependensi internal) |
| `animation/`               | Primitif gerak, semua `"use client"`              | `ui/`                       |
| `portfolio/`, `dashboard/` | Komposisi spesifik area (sections/widgets/layout) | `ui/`, `animation/`, `lib/` |
| `app/`                     | Halaman & layout (routing)                        | semua di atas               |

## Arah import (satu arah saja)

```text
app  →  components/portfolio | components/dashboard  →  components/animation  →  components/ui
```

- `ui/` dan `animation/` **dilarang** import dari `portfolio/` atau `dashboard/`.
- `portfolio/` **dilarang** import dari `dashboard/` (dan sebaliknya).
- `lib/` + `types/` boleh dipakai semua lapisan.
- `"use client"` dikurung di `animation/` dan komponen interaktif; section/widget default **server component**.

## Aliran data (rencana, saat backend Go siap)

```text
Browser → Next.js (Server Component / Route Handler = BFF) → Go API
```

- Semua panggilan Go lewat satu lapisan: `lib/api/*` → `data/` (DAL).
- Env: `API_BASE_URL` (kosong = pakai mock/fallback).
- Server Component fetch **langsung** ke `lib/api` → Go, **bukan** via `/api/*` Next sendiri.
- Poin BFF: file `backend/` (Go) di-deploy terpisah; Vercel hanya host frontend.

## Konvensi

- File: `kebab-case.tsx` → contoh: `hero-section.tsx`
- Komponen: `PascalCase` → contoh: `HeroSection`
- Import alias: `@/...` → contoh: `@/components/ui/button`
- Hindari barrel `index.ts` besar (jaga batas server/client tetap jelas)
- Setiap folder punya `.gitkeep` berisi catatan fungsi + apa yang diisi

## Tema (light / dark / system)

- **Default = light.** Preferensi user disimpan di `localStorage` (`theme`: `light|dark|system`).
- Sumber kebenaran visual: atribut `data-theme` di `<html>` (nilai hasil resolve: `light|dark`).
  `system` di-resolve via `matchMedia("(prefers-color-scheme: dark)")`.
- **Anti-flash:** inline `<script>` di `<head>` (`app/layout.tsx`) set `data-theme`
  sebelum paint; `<html>` diberi `suppressHydrationWarning`.
- Token warna per-tema hidup di `app/globals.css` (`[data-theme="light"]` & `[data-theme="dark"]`),
  di-map ke Tailwind via `@theme inline`. Variant `dark:` di-drive dari `data-theme`
  (bukan `prefers-color-scheme`) lewat `@custom-variant dark`.
- Logic: `hooks/use-theme.ts` (`useTheme()` + `setTheme()`), UI: `components/ui/theme-cta.tsx`.
- Komponen **wajib** pakai token warna (`bg-surface`, `text-foreground`, dst), bukan hex.
- Kartu proyek: `components/ui/PortfolioCard.tsx` (berlayer **dinamis** — jumlah kartu = `project.images.length`; hover buka kipas dari pivot bawah +
  **magnetic hover** translate + 3D tilt seluruh stack via `hooks/use-magnetic.ts`) +
  `components/ui/ProjectCarousel.tsx` (wheel + dot). Data dari `content/projects.ts` (`images: string[]`, `images[0]` = cover),
  gambar dari `public/projects/<slug>-<n>.jpg`. `PortfolioButton` juga pakai `useMagnetic` yang sama.

## Stack

- Next.js 16.4.0 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind v4
- Animasi: GSAP (`@gsap/react`) · Lenis · motion · three
- Ikon: `lucide-react`
- Package manager: pnpm 10.27.0
- Deploy frontend: Vercel · Backend: Go (terpisah)
