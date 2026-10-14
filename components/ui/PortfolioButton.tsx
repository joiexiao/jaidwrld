"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMagnetic } from "@/hooks/use-magnetic";

type PortfolioButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "children"
  | "onClick"
  | "onPointerEnter"
  | "onPointerMove"
  | "onPointerLeave"
  | "onPointerDown"
  | "onPointerUp"
  | "onPointerCancel"
> & {
  children?: ReactNode;
  text?: boolean;
  icon?: LucideIcon | boolean | "only";
  colour?: "light" | "dark";
  magnetStrength?: number;
  maxOffset?: number;
  magnetScale?: number;

  /** Tampilkan label saat tombol di-hover. Default false. */
  showHoverLabel?: boolean;

  /** Teks label yang muncul di bawah tombol. */
  hoverLabel?: string;

  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onPointerEnter?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLButtonElement>) => void;
};

const PortfolioButton = forwardRef<HTMLButtonElement, PortfolioButtonProps>(
  function PortfolioButton(
    {
      children,
      text = true,
      icon = true,
      colour = "light",
      disabled = false,
      type = "button",
      className = "",
      style,
      magnetStrength = 0.12,
      maxOffset = 6,
      magnetScale = 1.025,
      showHoverLabel = false,
      hoverLabel = "",
      onClick,
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    forwardedRef,
  ) {
    const isDisabled = disabled;

    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const { ref: magnetRef, handlers: magnetHandlers } =
      useMagnetic<HTMLButtonElement>({
        disabled: isDisabled,
        magnetStrength,
        maxOffset,
        magnetScale,
      });

    const isCustomIcon = icon !== true && icon !== false && icon !== "only";

    const IconComponent = isCustomIcon ? (icon as LucideIcon) : null;

    const showDefaultIcon = icon === true || icon === "only";
    const showIcon = icon !== false;
    const isIconOnly = icon === "only" || (!text && icon !== false);
    const showText = text && !isIconOnly;

    const shouldShowHoverLabel =
      showHoverLabel && Boolean(hoverLabel) && isHovered && !isDisabled;

    const setButtonRef = useCallback(
      (node: HTMLButtonElement | null) => {
        magnetRef(node);

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef, magnetRef],
    );

    useEffect(() => {
      if (!isDisabled) return;

      setIsHovered(false);
      setIsPressed(false);
    }, [isDisabled]);

    const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(event);

      if (isDisabled || event.pointerType === "touch") return;

      setIsHovered(true);
      magnetHandlers.onPointerEnter(event);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerMove?.(event);
      magnetHandlers.onPointerMove(event);
    };

    const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(event);

      setIsHovered(false);
      magnetHandlers.onPointerLeave(event);
    };

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);

      if (isDisabled || event.button !== 0) return;

      setIsPressed(true);
      magnetHandlers.onPointerDown(event);
    };

    const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerUp?.(event);

      setIsPressed(false);
      magnetHandlers.onPointerUp(event);
    };

    const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerCancel?.(event);

      setIsPressed(false);
      magnetHandlers.onPointerCancel(event);
    };

    const visualState = isDisabled
      ? "disabled"
      : isPressed
        ? "focused"
        : isHovered
          ? "hover"
          : "default";

    const colourClasses =
      colour === "light"
        ? "border-foreground/8 bg-background text-foreground"
        : "border-foreground/8 bg-foreground text-background";

    const baseClasses = [
      "portfolio-button",
      "relative inline-flex h-12 shrink-0 items-center justify-center",
      "gap-3 overflow-hidden",
      "border",
      "text-sm font-regular",
      "select-none",
      "transition-[border-radius,background-color,color,border-color,box-shadow,opacity]",
      "duration-500 ease-out",
      "focus-visible:outline-none",
      "cursor-pointer rounded-xl px-5",
      colourClasses,
      isPressed
        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
        : "",
      isIconOnly ? "aspect-square w-12 p-0" : "",
      isDisabled ? "pointer-events-none cursor-not-allowed opacity-40" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const buttonStyle: CSSProperties = {
      ...style,
      transformOrigin: "center center",
      willChange: isDisabled ? "auto" : "transform",
    };

    return (
      <span className="relative inline-flex shrink-0">
        <button
          {...props}
          ref={setButtonRef}
          type={type}
          disabled={isDisabled}
          data-state={visualState}
          className={baseClasses}
          style={buttonStyle}
          onClick={onClick}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {showText && children}

          {showIcon && (
            <span className="inline-flex shrink-0 items-center justify-center text-current">
              {IconComponent ? (
                <IconComponent
                  aria-hidden="true"
                  className="block h-5 w-5 shrink-0"
                  color="currentColor"
                  strokeWidth={1.75}
                />
              ) : showDefaultIcon ? (
                <svg
                  aria-hidden="true"
                  className="block h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 12L12 4M5 4H12V11"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
          )}
        </button>

        <AnimatePresence>
          {shouldShowHoverLabel && (
            <motion.span
              key="hover-label"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-hidden="true"
              className="text-foreground/60 font-regular pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 text-xs whitespace-nowrap"
            >
              {hoverLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    );
  },
);

PortfolioButton.displayName = "PortfolioButton";

export default PortfolioButton;
