// content/about.ts — sumber data statis halaman About (type-safe).
// Fungsi: satu sumber kebenaran teks About; gampang dipindah ke API Go nanti.
// Catatan: teks di bawah masih PLACEHOLDER — silakan edit.

export type About = {
  /** Paragraf pembuka di bawah tombol. */
  intro: string;
  /** Kalimat penutup. */
  closing: string;
  /** Baris copyright di paling bawah. */
  footer: string;
  /** Gambar yang dicetak di kertas interaktif (dipakai juga untuk prefetch). */
  paperImage: string;
};

export const about: About = {
  intro:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Saya merancang produk digital dengan fokus pada kejelasan, detail, dan pengalaman yang terasa natural. Placeholder — ganti dengan cerita sebenarnya.",
  closing:
    "Terima kasih sudah mampir. Placeholder — ganti dengan kalimat penutup.",
  footer: "© 2026 jaidwrld — All rights reserved.",
  paperImage: "/projects/avatar.png",
};
