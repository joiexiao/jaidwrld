"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { IconComponent } from "@/types/icon";
import { useTheme, type Theme } from "@/hooks/use-theme";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

const OPTIONS: {
  value: Theme;
  label: string;
  Icon: IconComponent;
}[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export default function ThemeCta({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumbWidth, setThumbWidth] = useState(0);

  const x = useMotionValue(0);
  const width = useMotionValue(0);

  const activeIndex = Math.max(
    0,
    OPTIONS.findIndex((option) => option.value === theme),
  );

  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    const measure = () => {
      const activeItem = itemRefs.current[activeIndex];
      const trackRect = track.getBoundingClientRect();

      if (!activeItem) return;

      const itemRect = activeItem.getBoundingClientRect();
      const inset = 4;

      const nextX = itemRect.left - trackRect.left - inset;
      const nextWidth = itemRect.width;

      setThumbWidth(nextWidth);

      if (reduceMotion) {
        x.jump(nextX);
        width.jump(nextWidth);
      } else {
        animate(x, nextX, SPRING);
        animate(width, nextWidth, SPRING);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, [activeIndex, reduceMotion, x, width]);

  const handleSelect = (value: Theme) => {
    if (value !== theme) {
      setTheme(value);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % OPTIONS.length;
        break;

      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = OPTIONS.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextOption = OPTIONS[nextIndex];

    handleSelect(nextOption.value);
    itemRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label="Theme"
      className={`border-border bg-surface/90 text-muted relative isolate inline-grid auto-cols-fr grid-flow-col items-center gap-1 overflow-hidden rounded-full border p-1 shadow-sm backdrop-blur ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className="bg-foreground pointer-events-none absolute top-1 bottom-1 left-1 z-0 rounded-full"
        style={{
          x,
          width,
          opacity: thumbWidth > 0 ? 1 : 0,
        }}
      />

      {OPTIONS.map(({ value, label, Icon }, index) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleSelect(value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`focus-visible:ring-foreground focus-visible:ring-offset-surface relative z-10 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isActive ? "text-background" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon
              aria-hidden="true"
              className="size-3.5 shrink-0"
              strokeWidth={1.75}
            />

            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
