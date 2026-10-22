import type { ComponentType, SVGProps } from "react";

// Props minimal yang dipakai saat merender ikon di dalam button.
// Sengaja dipersempit (bukan SVGProps penuh) supaya cocok untuk ikon dari
// lucide-react maupun @radix-ui/react-icons (keduanya menerima props ini).
export type IconProps = Pick<
  SVGProps<SVGSVGElement>,
  "className" | "color" | "strokeWidth" | "aria-hidden"
>;

/** Ikon SVG apa pun (lucide-react maupun @radix-ui/react-icons). */
export type IconComponent = ComponentType<IconProps>;

/** Nilai prop `icon`: komponen ikon, atau flag ikon bawaan button. */
export type ButtonIcon = IconComponent | boolean | "only";
