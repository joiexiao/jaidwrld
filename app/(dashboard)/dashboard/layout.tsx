// app/(dashboard)/dashboard/layout.tsx — shell area dashboard (URL: /dashboard).
// Fungsi: membungkus semua halaman dashboard dengan chrome aplikasi (Sidebar + Topbar).
// Isi: susun komponen dari components/dashboard/layout lalu render {children}.
// Catatan: guard/auth dashboard dipasang nanti (proxy.ts + cek sesi di server).
export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return <div className="flex min-h-full flex-1">{children}</div>;
}
