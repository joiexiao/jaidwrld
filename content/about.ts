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
    Designer with a curiosity for technology and art,
    <span class="text-muted">exploring the ways ideas,
    visuals, and interactions come together to create
    meaningful digital experiences.</span><br /><br />
    <span class="text-muted">From shaping ideas to crafting
    interfaces, I enjoy </span>making things that feel
    intuitive, thoughtful, and a little different.
  `,

  closing:
    '<span class="text-muted">Currently freelance and </span>building career.<br/>Based in </span>Depok, Indonesia.',

  footer:
    '<span class="text-muted">© 2026 jaidwrld — </span>All rights reserved.',

  paperImage: "/projects/avatar.png",
};