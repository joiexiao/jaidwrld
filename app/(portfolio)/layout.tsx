// app/(portfolio)/layout.tsx — shell area PORTFOLIO (URL: /).
// Fungsi: membungkus semua halaman publik portfolio. Tanda kurung (…) = route group,
//         jadi TIDAK mengubah URL ("/" tetap "/").
// Isi: Navbar + Footer dari components/portfolio/layout, dan SmoothScrollProvider
//      dari components/animation (nanti). Sekarang sekadar wrapper.
export default function PortfolioLayout({ children }: LayoutProps<"/">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
