// app/loading.tsx — UI loading default (Suspense fallback) untuk route segment.
// Fungsi: tampil otomatis selagi data/halaman anak sedang dimuat.
// Isi: skeleton/spinner sesuai kebutuhan desain.
import Loader from "@/components/animation/loader";
export default function Loading() {
  return (
    <div className="bg-surface flex flex-1 items-center justify-center p-8">
      <Loader />
    </div>
  );
}
