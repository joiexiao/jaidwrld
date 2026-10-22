// app/layout.tsx — ROOT layout (wajib, hanya satu per app).
// Fungsi: membungkus SEMUA route. Menyediakan <html>/<body>, font global,
//         import globals.css, dan metadata default.
// Isi: font (next/font), title/description, provider global (nanti), class pada <body>.
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jaidwrld",
  description: "Multidisciplinary designer & developer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${rubik.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-flash: baca preferensi tema & set data-theme SEBELUM paint.
            Default = light. "system" di-resolve via matchMedia.
            Sekaligus catat route entry document — dipakai intro home agar tidak
            mengulang saat kembali dari halaman lain. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){window.__jaidEntry=location.pathname;try{var p=localStorage.getItem("theme")||"light";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
