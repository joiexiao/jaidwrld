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

  /** Bila diisi, Escape memanggil ini alih-alih menutup. */
  onEscape?: () => void;

  /** Nama view-transition untuk morph beda halaman. */
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
  // Otherwise, show activeIcon (default ChevronLeft) while active
  // and triggerIcon while inactive.
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
      const target = event.target;

      if (!(target instanceof Element)) return;

      // Jangan tutup menu ketika klik pada elemen yang dikecualikan.
      if (target.closest("[data-menu-dismiss-ignore]")) {
        return;
      }

      if (rootRef.current && !rootRef.current.contains(target)) {
        updateOpen(false);
      }
    };

    // Escape: bila onEscape diisi, panggil itu.
    // Kalau tidak, perilaku default = tutup menu.
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

  const triggerButton = (
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
  );

  /*
   * Lebar spacer mengikuti ukuran icon-only button:
   * 48px per option + 8px gap antar option.
   *
   * Spacer ikut layout root agar grup bisa tetap centered.
   * Options sendiri menggunakan absolute positioning supaya
   * tidak ikut mengubah layout root secara langsung.
   */
  const optionGap = 8;
  const optionButtonSize = 48;

  const optionsWidth =
    options.length * optionButtonSize +
    Math.max(0, options.length - 1) * optionGap;

  const optionsSpacer = (
    <motion.div
      aria-hidden="true"
      className="shrink-0"
      initial={false}
      animate={{
        width: isOpen ? optionsWidth : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 20,
        mass: 1,
      }}
    />
  );

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center ${
        isOpen ? "gap-2" : "gap-0"
      } ${className}`}
    >
      {/* Spacer di sebelah kiri untuk direction left */}
      {direction === "left" && optionsSpacer}

      {/* Trigger button */}
      {viewTransitionName ? (
        <ViewTransition
          name={viewTransitionName}
          share="vt-menu"
          default="none"
        >
          {triggerButton}
        </ViewTransition>
      ) : (
        triggerButton
      )}

      {/* Spacer di sebelah kanan untuk direction right */}
      {direction === "right" && optionsSpacer}

      {/* Options — absolute agar tidak memengaruhi layout root */}
      <AnimatePresence initial={false}>
        {isOpen && options.length > 0 && (
          <motion.div
            key="options"
            id={menuId}
            variants={groupVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 ${
              direction === "right" ? "left-14" : "left-0"
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
}
