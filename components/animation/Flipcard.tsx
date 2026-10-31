"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionStyle,
} from "motion/react";

export type FlipCardAxis = "x" | "y";

export interface FlipCardProps {
  front?: ReactNode;
  back?: ReactNode;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  axis?: FlipCardAxis;
  flipOnClick?: boolean;
  draggable?: boolean;
  dragDistance?: number;
  tilt?: boolean;
  tiltMax?: number;
  glare?: boolean;
  glareOpacity?: number;
  hoverScale?: number;
  perspective?: number;
  stiffness?: number;
  damping?: number;
  width?: number;
  height?: number;
  radius?: number;
  background?: string;
  color?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isBack = (angle: number) => Math.abs(Math.round(angle / 180)) % 2 === 1;

const FlipCard: React.FC<FlipCardProps> = ({
  front = null,
  back = null,
  flipped,
  defaultFlipped = false,
  onFlipChange,
  axis = "y",
  flipOnClick = true,
  glare = true,
  glareOpacity = 0.22,
  perspective = 1000,
  stiffness = 220,
  damping = 28,
  width = 300,
  height = 400,
  radius = 22,
  background = "#27272a",
  color = "#f5f5f5",
  shadow = true,
  shadowColor = "#000000",
  shadowOpacity = 0.18,
  disabled = false,
  ariaLabel = "Flip card",
  className = "",
}) => {
  const reduce = useReducedMotion();
  const controlled = flipped !== undefined;

  const [inner, setInner] = useState(defaultFlipped);
  const shown = controlled ? flipped : inner;

  const shownRef = useRef(shown);
  const targetRef = useRef(shown ? 180 : 0);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);

  // Throttle glare updates to at most one update per animation frame.
  const glareFrameRef = useRef<number | null>(null);
  const glarePositionRef = useRef({ x: 50, y: 35 });

  const turn = useMotionValue(shown ? 180 : 0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(35);

  const opacity = clamp(glareOpacity, 0, 1);

  const glareBackground = useMotionTemplate`
    radial-gradient(
      circle farthest-side at ${gx}% ${gy}%,
      rgba(255, 255, 255, ${opacity}) 0%,
      rgba(255, 255, 255, ${opacity * 0.7}) 14%,
      rgba(255, 255, 255, ${opacity * 0.35}) 34%,
      rgba(255, 255, 255, ${opacity * 0.12}) 55%,
      rgba(255, 255, 255, 0) 78%
    )
  `;

  const stopAnimation = () => {
    animationRef.current?.stop();
    animationRef.current = null;
  };

  const animateTo = (destination: number, instant = false) => {
    stopAnimation();
    targetRef.current = destination;

    if (instant || reduce) {
      turn.jump(destination);
      return;
    }

    animationRef.current = animate(turn, destination, {
      type: "spring",
      stiffness,
      damping,
      restDelta: 0.1,
      restSpeed: 0.1,
    });
  };

  const settle = (next: boolean, instant = false, notify = true) => {
    const currentTarget = targetRef.current;

    const destination =
      isBack(currentTarget) === next
        ? currentTarget
        : currentTarget + (next ? 180 : -180);

    shownRef.current = next;

    if (!controlled) {
      setInner(next);
    }

    if (notify) {
      onFlipChange?.(next);
    }

    animateTo(destination, instant);
  };

  const flip = (instant = false) => {
    if (disabled || !flipOnClick) return;

    settle(!shownRef.current, instant);
  };

  // Sync only controlled components with external prop changes.
  // Uncontrolled flips are already handled by settle().
  useEffect(() => {
    if (!controlled) return;

    shownRef.current = shown;

    if (isBack(targetRef.current) === shown) return;

    const currentTarget = targetRef.current;
    const destination =
      isBack(currentTarget) === shown
        ? currentTarget
        : currentTarget + (shown ? 180 : -180);

    animateTo(destination);
  }, [controlled, shown, reduce, stiffness, damping]);

  useEffect(() => {
    return () => {
      stopAnimation();

      if (glareFrameRef.current !== null) {
        cancelAnimationFrame(glareFrameRef.current);
      }
    };
  }, []);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!glare || disabled || event.pointerType === "touch") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    glarePositionRef.current = {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };

    if (glareFrameRef.current !== null) return;

    glareFrameRef.current = requestAnimationFrame(() => {
      glareFrameRef.current = null;

      gx.set(glarePositionRef.current.x);
      gy.set(glarePositionRef.current.y);
    });
  };

  const onPointerLeave = () => {
    if (glareFrameRef.current !== null) {
      cancelAnimationFrame(glareFrameRef.current);
      glareFrameRef.current = null;
    }

    // Return the highlight toward its resting position.
    gx.set(50);
    gy.set(35);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      disabled ||
      !flipOnClick ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();

    if (!event.repeat) {
      flip(true);
    }
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    // Keyboard activation is handled by onKeyDown.
    if (event.detail === 0) return;

    flip();
  };

  const rotorStyle: MotionStyle = {
    ...(axis === "y" ? { rotateY: turn } : { rotateX: turn }),
    transformStyle: "preserve-3d",
    willChange: "transform",
  };

  const cardStyle = {
    "--fc-w": `${width}px`,
    "--fc-h": `${height}px`,
    "--fc-radius": `${radius}px`,
    "--fc-bg": background,
    "--fc-ink": color,
    perspective: `${perspective}px`,
  } as CSSProperties;

  const faceClass = [
    "absolute inset-0 overflow-hidden",
    "[border-radius:var(--fc-radius)]",
    "[color:var(--fc-ink)]",
    "[background:var(--fc-bg)]",
    "[-webkit-backface-visibility:hidden]",
    "[backface-visibility:hidden]",
    "[&>img]:[-webkit-user-drag:none]",
  ].join(" ");

  const glareStyle: MotionStyle = {
    background: glareBackground,
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={shown}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={[
        "relative isolate inline-block max-w-full",
        "[width:var(--fc-w)]",
        "[height:var(--fc-h)]",
        "[border-radius:var(--fc-radius)]",
        "select-none",
        "touch-pan-y",
        "[-webkit-tap-highlight-color:transparent]",
        "[-webkit-touch-callout:none]",
        disabled ? "cursor-default opacity-60" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={cardStyle}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onDragStart={(event) => event.preventDefault()}
    >
      {shadow && (
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute",
            "inset-x-[9%] top-[12%] bottom-[-5%]",
            "-z-10 blur-xl",
            "[border-radius:var(--fc-radius)]",
          ].join(" ")}
          style={{
            background: shadowColor,
            opacity: clamp(shadowOpacity, 0, 1),
          }}
        />
      )}

      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={rotorStyle}
      >
        {/* Front face */}
        <div className={faceClass} aria-hidden={shown} inert={shown}>
          {front}

          {glare && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10"
              style={glareStyle}
            />
          )}
        </div>

        {/* Back face */}
        <div
          className={[
            faceClass,
            axis === "y"
              ? "[transform:rotateY(180deg)]"
              : "[transform:rotateX(180deg)]",
          ].join(" ")}
          aria-hidden={!shown}
          inert={!shown}
        >
          {back}

          {glare && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10"
              style={glareStyle}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
