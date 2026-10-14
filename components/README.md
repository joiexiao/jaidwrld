# components/

Aturan organisasi komponen. Prinsipnya dua sumbu: **lapisan (layer)** dan **area (domain)**.

## Lapisan (dari paling bodoh ke paling cerdas)

| Folder                     | Isi                                                     | Boleh import dari           |
| -------------------------- | ------------------------------------------------------- | --------------------------- |
| `ui/`                      | Primitif desain (Button, Card, Input, Modal)            | — (nol dependensi internal) |
| `animation/`               | Primitif gerak, semua `"use client"` (Reveal, Parallax) | `ui/`                       |
| `portfolio/`, `dashboard/` | Komposisi spesifik area (sections/widgets/layout)       | `ui/`, `animation/`, `lib/` |
| `app/`                     | Halaman & layout (routing)                              | semua di atas               |

## Aturan arah import (satu arah saja)

```
app  →  portfolio/dashboard  →  animation  →  ui
```

- `ui/` dan `animation/` **dilarang** import dari `portfolio/` atau `dashboard/`.
- Area **dilarang** import dari area lain (`portfolio` tidak boleh import `dashboard`, dst).
- `"use client"` dikurung di `animation/` dan komponen interaktif. Section/widget default **server component**.

## Konvensi

- Nama file: `kebab-case.tsx` (cth `hero-section.tsx`). Nama komponen: `PascalCase`.
- Import pakai alias `@/…` (cth `@/components/ui/button`).
- Hindari barrel `index.ts` besar agar batas server/client tetap jelas.

## Styling warna (WAJIB)

Warna UI **jangan hardcode hex**. Pakai token semantik dari `app/globals.css`, biar
otomatis ikut ganti tema:

| Sebelum (hardcode)                 | Sesudah (token)                | Fungsi              |
| ---------------------------------- | ------------------------------ | ------------------- |
| `bg-white` / `bg-[#f7f7f5]`        | `bg-background` / `bg-surface` | latar utama / kartu |
| `text-black` / `text-[#20201f]`    | `text-foreground`              | teks utama          |
| `text-black/40` / `text-[#a5a5a3]` | `text-muted`                   | teks sekunder       |
| `border-black/10`                  | `border-border`                | garis / border      |
| warna aksen                        | `bg-accent` / `text-accent`    | highlight           |

- Token tersedia: `background`, `foreground`, `surface`, `surface-2`, `muted`, `border`, `accent`.
- Opacity modifier tetap jalan: `bg-foreground/10`, `text-muted/70`.
- Butuh warna baru? Tambah di **dua blok** `[data-theme="light"]` & `[data-theme="dark"]`
  di `app/globals.css`, lalu map di `@theme inline`.
- Beda tipis antar tema? Override lokal: `dark:bg-black/40` (variant `dark` ikut `data-theme`).
- **Pengecualian:** warna brand/konten (mis. palet per-project, artwork mockup) tetap
  hardcode — itu identitas, bukan chrome tema.
- Ganti tema lewat `useTheme()` (`hooks/use-theme.ts`) atau komponen `ThemeCta` (`components/ui/theme-cta.tsx`).

## Komponen kartu & carousel

- `components/ui/PortfolioCard.tsx` — kartu berlayer **dinamis**: jumlah kartu mengikuti `project.images` (1 kartu per gambar). Front card = `images[0]` (gambar + judul project); sisanya (`images[1..]`) jadi back-layer berisi gambar (`theme` sebagai fallback bg). Saat hover, layer membuka seperti kipas dari **pivot bawah**.
  - **Magnetic hover:** seluruh stack tertarik ke kursor + miring 3D (translate + tilt) via `useMagnetic`; spring balik saat kursor keluar. Prop tune: `magnetStrength` (0.06), `maxOffset` (12), `magnetScale` (1.015), `tilt` (7).
- `components/ui/ProjectCarousel.tsx` — membungkus `PortfolioCard`; navigasi lewat scroll wheel + dot (vertikal di kanan saat desktop, di bawah saat mobile).
- `hooks/use-magnetic.ts` — mesin magnet reusable (rAF spring; menulis `element.style.transform` imperatif → aman hydration; abaikan touch; hormati `prefers-reduced-motion`). Dipakai `PortfolioCard` & `PortfolioButton`.
- Sumber data: `content/projects.ts` (`Project[]`, field `slug` & `images`). Gambar proyek disimpan di `public/projects/<slug>-<n>.jpg` (diisi manual; `images[0]` = cover).

## Komponen tombol & menu

- `components/ui/PortfolioButton.tsx` — tombol dasar (ikon/teks, prop `colour: "light" | "dark"`, magnet). Jadi basis `MenuButton`.
- `components/ui/menu-button.tsx` — trigger + opsi yang muncul **dari samping** saat diklik (pakai `framer-motion`, fade + slide + stagger). Prop: `options[]` (`icon`/`label`/`ariaLabel`/`onClick`), `triggerIcon`/`triggerLabel`, `direction` (`"right"` default | `"left"`), `withText` (default `false` = icon-only), `defaultOpen`, `onOpenChange`, `onSelect`. Saat open, trigger jadi **dark + rounded-full** (light mode) dan sekaligus CTA menutup menu; menutup juga via klik opsi, klik luar, atau `Escape`.
