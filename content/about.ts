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

  collaborations: {
    name: string;
    slug: string;
    href?: string;
    hoverColor?: string;
  }[];
};

export const about: About = {
  intro: `
    Designer with a strong interest in technology,<span class="text-muted"> translating user needs and business goals into thoughtful digital products that balance functionality and user experience.</span><br /><br />
    <span class="text-muted">I enjoy exploring different ways to</span> shape ideas into experiences<span class="text-muted">, from visual details to interactions that make a product feel distinct.</span>
  `,

  closing:
    '<span class="text-muted">Currently freelance and </span>developing expertise. Based in </span>Depok, Indonesia.',

  footer:
    '<span class="text-muted">From the desk of </span>jaidwrld.',

  paperImage: "/projects/avatar.png",

  collaborations: [
    { name: "Heulaulabs", slug: "collab-one", href: "https://www.heulaulab.xyz/", hoverColor: "#ef5ba1" },
    { name: "Kala Loop", slug: "collab-two", href: "https://github.com/Juaruy", hoverColor: "var(--foreground)"},
    { name: "Amaliah Astra", slug: "collab-three", href: "https://www.instagram.com/yayasanastra_yaa?utm_source=ig_web_button_share_sheet&cplk=ZDNlZDc0MzIxNw==", hoverColor: "#30a3e2" },
  ],
};