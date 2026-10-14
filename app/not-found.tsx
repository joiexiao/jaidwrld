// app/not-found.tsx — UI 404.
// Fungsi: tampil untuk route yang tidak dikenal, atau saat fungsi notFound() dipanggil.
// Isi: pesan + tautan balik ke beranda.
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="bg-foreground text-background rounded-full px-5 py-2 transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  );
}
