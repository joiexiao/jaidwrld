// app/(dashboard)/dashboard/page.tsx — halaman overview dashboard (URL: /dashboard).
// Isi: widget ringkasan dari components/dashboard/widgets (StatCard, ActivityFeed, ...).
import Loader from "@/components/animation/loader";
export default function DashboardPage() {
  return (
    <div className="bg-surface flex flex-1 items-center justify-center p-8">
      <Loader />
    </div>
  );
}
