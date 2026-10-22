import { Mail } from "lucide-react";
import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import type { MenuOption } from "@/components/ui/menu-button";

// Data kontak + definisi opsi menu (dipakai bersama oleh home & About).
// Email hanya menyalin ke clipboard; LinkedIn & GitHub membuka tab baru.
export const contact = {
  email: "mujahidazzam16@gmail.com",
  linkedin: "https://www.linkedin.com/in/mujahidazzam",
  github: "https://github.com/joiexiao",
} as const;

export const contactOptions: MenuOption[] = [
  {
    icon: Mail,
    ariaLabel: "Email",
    showHoverLabel: true,
    hoverLabel: "click to copy",
    copiedLabel: "copied",
    onClick: async () => {
      await navigator.clipboard.writeText(contact.email);
    },
  },
  {
    icon: LinkedInLogoIcon,
    ariaLabel: "LinkedIn",
    onClick: () => {
      window.open(contact.linkedin, "_blank", "noopener,noreferrer");
    },
  },
  {
    icon: GitHubLogoIcon,
    ariaLabel: "GitHub",
    onClick: () => {
      window.open(contact.github, "_blank", "noopener,noreferrer");
    },
  },
];
