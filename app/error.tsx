"use client";
// app/error.tsx — error boundary level route-segment.
// Fungsi: menangkap error runtime dari halaman anak & menampilkan fallback + tombol reset.
// Isi: UI error. Menerima `error` (Error & { digest }) dan `reset()` untuk mencoba ulang.
// Wajib "use client" karena memakai onClick.

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      {error.digest ? (
        <p className="font-mono text-xs text-zinc-500">{error.digest}</p>
      ) : null}
      <button
        className="bg-foreground text-background rounded-full px-5 py-2 transition-opacity hover:opacity-90"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
