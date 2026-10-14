// app/(dashboard)/dashboard/page.tsx — halaman overview dashboard (URL: /dashboard).
// Isi: widget ringkasan dari components/dashboard/widgets (StatCard, ActivityFeed, ...).
export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Coming soon.</p>
    </div>
  );
}
