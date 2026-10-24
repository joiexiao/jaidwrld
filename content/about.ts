// content/about.ts

export type About = {
  /** Paragraf pembuka di bawah tombol. */
  intro: string;

  /** Kalimat penutup. */
  closing: string;

  /** Baris copyright di paling bawah. */
  footer: string;

  /** Gambar yang dicetak di kertas interaktif. */
  paperImage: string;
};

export const about: About = {
  intro: `
    Award-winning UX Designer,<span class="text-muted"> turning business goals,
    user needs, and messy problems into interfaces that feel obvious.</span><br /></br />
    <span class="text-muted">After studying at </span>Gobelins,<span class="text-muted"> I worked alongside sharp designers and developers
    at </span>Locomotive & Immersive Garden<span class="text-muted">, crafting impactful websites.
  `,

  closing:
    '<span class="text-muted">Now freelance, travelling, and</span> <span class="text-muted">available worldwide. Currently based in </span>Depok, Indonesia.</span>',

  footer: '<span class="text-muted">© 2026 jaidwrld — </span>All rights reserved.',

  paperImage: "/projects/avatar.png",
};