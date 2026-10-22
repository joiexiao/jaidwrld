"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  ViewTransition,
  type CSSProperties,
} from "react";
import type { ButtonIcon } from "@/types/icon";
import { ChevronLeft } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

import PortfolioButton from "@/components/ui/PortfolioButton";

export type MenuOption = {
  icon?: ButtonIcon;
  label?: string;
  ariaLabel: string;
  onClick?: () => void;
  showHoverLabel?: boolean;
  hoverLabel?: string;
  copiedLabel?: string;
};

type MenuButtonProps = {
  options: MenuOption[];
  triggerIcon?: ButtonIcon;
  /** Icon main button saat menu terbuka. Default ChevronLeft. */
  activeIcon?: ButtonIcon;
  /** Memaksa icon main button, terlepas dari status menu. */
  forceTriggerIcon?: ButtonIcon;
  triggerLabel?: string;
  direction?: "right" | "left";
  withText?: boolean;
  defaultOpen?: boolean;
  /** Mode terkontrol: bila diisi, state internal diabaikan. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (option: MenuOption, index: number) => void;
  /** Override klik trigger, misalnya untuk navigasi. */
  onMainClick?: () => void;
  /** Tutup menu saat klik di luar area menu. Default true. */
  dismissOnOutsideClick?: boolean;
  /** Bila diisi, Escape memanggil ini (mis. navigasi back) alih-alih menutup. */
  onEscape?: () => void;
  /** Nama view-transition untuk morph beda halaman (mis. "contact-menu"). */
  viewTransitionName?: string;
  className?: string;
};

const groupVariants: Variants = {
  hidden: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const itemVariants: Variants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction * 24,
    scale: 0.92,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function MenuButton({
  options,
  triggerIcon = "only",
  activeIcon,
  forceTriggerIcon,
  triggerLabel = "Menu",
  direction = "right",
  withText = false,
  defaultOpen = false,
  open,
  onOpenChange,
  onSelect,
  onMainClick,
  dismissOnOutsideClick = true,
  onEscape,
  className = "",
  viewTransitionName,
}: MenuButtonProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;

  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const reduceMotion = useReducedMotion();

  // Right: menu enters from the left.
  // Left: menu enters from the right.
  const slideDirection = direction === "right" ? -1 : 1;
  const slideX = reduceMotion ? 0 : slideDirection;
  const showTriggerText = withText && Boolean(triggerLabel);

  // Force a specific icon when provided.
  // Otherwise, show activeIcon (default ChevronLeft) while active and
  // triggerIcon while inactive.
  const activeTriggerIcon =
    forceTriggerIcon ?? (isOpen ? (activeIcon ?? ChevronLeft) : triggerIcon);

  const updateOpen = useCallback(
    (next: boolean) => {
      if (!controlled) {
        setInternalOpen(next);
      }

      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const handleSelect = useCallback(
    (option: MenuOption, index: number) => {
      option.onClick?.();
      onSelect?.(option, index);
      // Sengaja tidak menutup menu saat opsi diklik.
    },
    [onSelect],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        updateOpen(false);
      }
    };

    // Escape: bila `onEscape` diisi (mis. back dari About), panggil itu;
    // kalau tidak, perilaku default = tutup menu.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (onEscape) {
        onEscape();
      } else {
        updateOpen(false);
      }
    };

    if (dismissOnOutsideClick) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updateOpen, dismissOnOutsideClick, onEscape]);

  const triggerStyle: CSSProperties = isOpen ? { borderRadius: "9999px" } : {};

  const content = (
    <div
      ref={rootRef}
      className={`relative flex items-center gap-2 ${className}`}
    >
      <PortfolioButton
        icon={activeTriggerIcon}
        text={showTriggerText}
        colour={isOpen ? "dark" : "light"}
        aria-label={showTriggerText ? undefined : triggerLabel}
        aria-expanded={isOpen}
        aria-controls={options.length > 0 ? menuId : undefined}
        onClick={onMainClick ?? (() => updateOpen(!isOpen))}
        style={triggerStyle}
      >
        {showTriggerText ? triggerLabel : null}
      </PortfolioButton>

      <AnimatePresence initial={false}>
        {isOpen && options.length > 0 && (
          <motion.div
            key="options"
            id={menuId}
            variants={groupVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`flex items-center gap-2 ${
              direction === "left" ? "order-first" : ""
            }`}
          >
            {options.map((option, index) => {
              const showOptionText = withText && Boolean(option.label);

              return (
                <motion.div
                  key={`${option.ariaLabel}-${index}`}
                  variants={itemVariants}
                  custom={slideX}
                  style={{
                    transformOrigin:
                      direction === "right" ? "left center" : "right center",
                  }}
                >
                  <PortfolioButton
                    icon={option.icon}
                    text={showOptionText}
                    colour="light"
                    aria-label={option.ariaLabel}
                    showHoverLabel={option.showHoverLabel ?? false}
                    hoverLabel={option.hoverLabel ?? ""}
                    copiedLabel={option.copiedLabel ?? ""}
                    onClick={() => handleSelect(option, index)}
                  >
                    {showOptionText ? option.label : null}
                  </PortfolioButton>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (!viewTransitionName) return content;

  return (
    <ViewTransition name={viewTransitionName} share="vt-menu" default="none">
      {content}
    </ViewTransition>
  );
}
