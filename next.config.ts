// next.config.ts — konfigurasi Next.js.
// Fungsi: mengatur opsi build & runtime Next.
// Isi: saat ini `typedRoutes: true` (link & router otomatis ter-type).
//      Tambah opsi lain (rewrites, images, experimental, dst) hanya saat fitur membutuhkannya.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default nextConfig;
