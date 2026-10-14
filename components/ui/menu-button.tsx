"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import PortfolioButton from "@/components/ui/PortfolioButton";

export type MenuOption = {
  icon?: LucideIcon | boolean | "only";
  label?: string;
  ariaLabel: string;
  onClick?: () => void;
  showHoverLabel?: boolean;
  hoverLabel?: string;
};

type MenuButtonProps = {
  options: MenuOption[];
  triggerIcon?: LucideIcon | boolean | "only";
  triggerLabel?: string;
  direction?: "right" | "left";
  withText?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (option: MenuOption, index: number) => void;
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
  triggerLabel = "Menu",
  direction = "right",
  withText = false,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  className = "",
}: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const reduceMotion = useReducedMotion();

  // Right: menu enters from the left, exits back to the right.
  // Left: menu enters from the right, exits back to the left.
  const slideDirection = direction === "right" ? -1 : 1;
  const slideX = reduceMotion ? 0 : slideDirection;
  const showTriggerText = withText && Boolean(triggerLabel);

  const updateOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const handleSelect = useCallback(
    (option: MenuOption, index: number) => {
      option.onClick?.();
      onSelect?.(option, index);
      updateOpen(false);
    },
    [onSelect, updateOpen],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        updateOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        updateOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updateOpen]);

  const triggerStyle: CSSProperties = isOpen ? { borderRadius: "9999px" } : {};

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center gap-2 ${className}`}
    >
      <PortfolioButton
        icon={triggerIcon}
        text={showTriggerText}
        colour={isOpen ? "dark" : "light"}
        aria-label={showTriggerText ? undefined : triggerLabel}
        aria-expanded={isOpen}
        aria-controls={options.length > 0 ? menuId : undefined}
        onClick={() => updateOpen(!isOpen)}
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
