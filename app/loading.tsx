// app/loading.tsx — UI loading default (Suspense fallback) untuk route segment.
// Fungsi: tampil otomatis selagi data/halaman anak sedang dimuat.
// Isi: skeleton/spinner sesuai kebutuhan desain.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <span
        aria-label="Loading"
        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    </div>
  );
}
