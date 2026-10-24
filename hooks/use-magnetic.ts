"use client";

// hooks/use-magnetic.ts
// Fungsi: hook "magnetic hover" reusable — elemen tertarik ke arah kursor +
//         membesar (+ opsional miring 3D), dengan fisika spring via
//         requestAnimationFrame. Transform ditulis imperatif ke
//         `element.style.transform` (bukan React state) sehingga aman hydration
//         (server merender tanpa inline transform).
// Asal: diekstrak dari components/ui/PortfolioButton.tsx agar PortfolioCard
//       memakai mesin magnet yang sama (satu sumber kebenaran).
// Catatan: mengabaikan pointerType "touch" & menghormati prefers-reduced-motion.

import { useCallback, useEffect, useRef, type PointerEvent } from "react";

const STIFFNESS = 190;
const DAMPING = 21;
const PERSPECTIVE = 900;

type MagneticState = {
  x: number;
  y: number;
  scale: number;
  rx: number;
  ry: number;
  vx: number;
  vy: number;
  vs: number;
  vrx: number;
  vry: number;
};

const INITIAL_STATE: MagneticState = {
  x: 0,
  y: 0,
  scale: 1,
  rx: 0,
  ry: 0,
  vx: 0,
  vy: 0,
  vs: 0,
  vrx: 0,
  vry: 0,
};

export type UseMagneticOptions = {
  /** Seberapa kuat elemen tertarik ke kursor (rasio dari jarak, mis. 0.12). */
  magnetStrength?: number;
  /** Batas maksimum pergeseran translate (px). */
  maxOffset?: number;
  /** Skala saat hover. */
  magnetScale?: number;
  /** Skala saat active/pressed. */
  activeScale?: number;
  /** Spring stiffness khusus untuk scale. Default STIFFNESS (190). */
  scaleStiffness?: number;
  /** Spring damping khusus untuk scale. Default DAMPING (21). */
  scaleDamping?: number;
  /** Maksimum kemiringan 3D mengikuti kursor (derajat). 0 = tanpa tilt. */
  tilt?: number;
  /** Nonaktifkan magnet + reset ke posisi netral. */
  disabled?: boolean;
};

export type UseMagneticHandlers<T extends HTMLElement> = {
  onPointerEnter: (event: PointerEvent<T>) => void;
  onPointerMove: (event: PointerEvent<T>) => void;
  onPointerLeave: (event: PointerEvent<T>) => void;
  onPointerDown: (event: PointerEvent<T>) => void;
  onPointerUp: (event: PointerEvent<T>) => void;
  onPointerCancel: (event: PointerEvent<T>) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function useMagnetic<T extends HTMLElement = HTMLElement>(
  options: UseMagneticOptions = {},
): { ref: (node: T | null) => void; handlers: UseMagneticHandlers<T> } {
  const {
    magnetStrength = 0.12,
    maxOffset = 6,
    magnetScale = 1.025,
    activeScale = 0.97,
    scaleStiffness = STIFFNESS,
    scaleDamping = DAMPING,
    tilt = 0,
    disabled = false,
  } = options;

  const nodeRef = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const currentRef = useRef<MagneticState>({ ...INITIAL_STATE });
  const targetRef = useRef<MagneticState>({ ...INITIAL_STATE });

  const hoveredRef = useRef(false);
  const pressedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  // Opsi terbaru (disinkronkan lewat effect, bukan saat render).
  const optionsRef = useRef({
    magnetStrength,
    maxOffset,
    magnetScale,
    activeScale,
    scaleStiffness,
    scaleDamping,
    tilt,
    disabled,
  });

  const setRef = useCallback((node: T | null) => {
    nodeRef.current = node;
  }, []);

  const writeTransform = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;

    const { x, y, scale, rx, ry } = currentRef.current;

    node.style.transform =
      optionsRef.current.tilt !== 0
        ? `perspective(${PERSPECTIVE}px) translate3d(${x}px, ${y}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`
        : `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  const animateRef = useRef<() => void>(() => {});

  const animate = useCallback(() => {
    if (!nodeRef.current || optionsRef.current.disabled) {
      frameRef.current = null;
      previousTimeRef.current = null;
      return;
    }

    const current = currentRef.current;
    const target = targetRef.current;

    if (reducedMotionRef.current) {
      current.x = target.x;
      current.y = target.y;
      current.scale = target.scale;
      current.rx = target.rx;
      current.ry = target.ry;
      current.vx = 0;
      current.vy = 0;
      current.vs = 0;
      current.vrx = 0;
      current.vry = 0;

      writeTransform();

      frameRef.current = null;
      previousTimeRef.current = null;
      return;
    }

    const now = performance.now();

    const delta = Math.min(
      previousTimeRef.current === null
        ? 1 / 60
        : (now - previousTimeRef.current) / 1000,
      0.032,
    );

    previousTimeRef.current = now;

    const steps = Math.max(1, Math.ceil(delta / (1 / 120)));
    const step = delta / steps;

    const spring = (
      position: number,
      velocity: number,
      destination: number,
      stiffness: number,
      damping: number,
    ) => {
      const acceleration =
        stiffness * (destination - position) - damping * velocity;
      const nextVelocity = velocity + acceleration * step;

      return {
        position: position + nextVelocity * step,
        velocity: nextVelocity,
      };
    };

    for (let i = 0; i < steps; i++) {
      const x = spring(current.x, current.vx, target.x, STIFFNESS, DAMPING);
      const y = spring(current.y, current.vy, target.y, STIFFNESS, DAMPING);
      const scale = spring(
        current.scale,
        current.vs,
        target.scale,
        optionsRef.current.scaleStiffness,
        optionsRef.current.scaleDamping,
      );
      const rx = spring(current.rx, current.vrx, target.rx, STIFFNESS, DAMPING);
      const ry = spring(current.ry, current.vry, target.ry, STIFFNESS, DAMPING);

      current.x = x.position;
      current.vx = x.velocity;

      current.y = y.position;
      current.vy = y.velocity;

      current.scale = scale.position;
      current.vs = scale.velocity;

      current.rx = rx.position;
      current.vrx = rx.velocity;

      current.ry = ry.position;
      current.vry = ry.velocity;
    }

    writeTransform();

    const settled =
      Math.abs(target.x - current.x) < 0.01 &&
      Math.abs(target.y - current.y) < 0.01 &&
      Math.abs(target.scale - current.scale) < 0.0001 &&
      Math.abs(target.rx - current.rx) < 0.01 &&
      Math.abs(target.ry - current.ry) < 0.01 &&
      Math.abs(current.vx) < 0.02 &&
      Math.abs(current.vy) < 0.02 &&
      Math.abs(current.vs) < 0.001 &&
      Math.abs(current.vrx) < 0.02 &&
      Math.abs(current.vry) < 0.02;

    if (settled) {
      current.x = target.x;
      current.y = target.y;
      current.scale = target.scale;
      current.rx = target.rx;
      current.ry = target.ry;
      current.vx = 0;
      current.vy = 0;
      current.vs = 0;
      current.vrx = 0;
      current.vry = 0;

      writeTransform();

      frameRef.current = null;
      previousTimeRef.current = null;
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      animateRef.current();
    });
  }, [writeTransform]);

  // Sinkronkan opsi & fungsi animate terbaru setiap commit (ref tidak ditulis saat render).
  useEffect(() => {
    optionsRef.current = {
      magnetStrength,
      maxOffset,
      magnetScale,
      activeScale,
      scaleStiffness,
      scaleDamping,
      tilt,
      disabled,
    };
    animateRef.current = animate;
  });

  const wakeAnimation = useCallback(() => {
    if (optionsRef.current.disabled) return;

    if (reducedMotionRef.current) {
      currentRef.current = {
        ...targetRef.current,
        vx: 0,
        vy: 0,
        vs: 0,
        vrx: 0,
        vry: 0,
      };

      writeTransform();
      return;
    }

    if (frameRef.current !== null) return;

    previousTimeRef.current = null;

    frameRef.current = requestAnimationFrame(() => {
      animateRef.current();
    });
  }, [writeTransform]);

  const updateTarget = useCallback(
    (x: number, y: number, scale: number, rx: number, ry: number) => {
      targetRef.current.x = x;
      targetRef.current.y = y;
      targetRef.current.scale = scale;
      targetRef.current.rx = rx;
      targetRef.current.ry = ry;

      wakeAnimation();
    },
    [wakeAnimation],
  );

  const resetMagnet = useCallback(
    (scale = 1) => {
      updateTarget(0, 0, scale, 0, 0);
    },
    [updateTarget],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleMotionPreference = () => {
      reducedMotionRef.current = mediaQuery.matches;

      if (!mediaQuery.matches) return;

      currentRef.current = {
        ...targetRef.current,
        vx: 0,
        vy: 0,
        vs: 0,
        vrx: 0,
        vry: 0,
      };

      writeTransform();

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    handleMotionPreference();

    mediaQuery.addEventListener("change", handleMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionPreference);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [writeTransform]);

  useEffect(() => {
    if (!disabled) return;

    hoveredRef.current = false;
    pressedRef.current = false;

    currentRef.current = { ...INITIAL_STATE };
    targetRef.current = { ...INITIAL_STATE };

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    writeTransform();
  }, [disabled, writeTransform]);

  const onPointerEnter = useCallback(
    (event: PointerEvent<T>) => {
      if (optionsRef.current.disabled || event.pointerType === "touch") return;

      hoveredRef.current = true;

      updateTarget(
        targetRef.current.x,
        targetRef.current.y,
        pressedRef.current ? optionsRef.current.activeScale : optionsRef.current.magnetScale,
        targetRef.current.rx,
        targetRef.current.ry,
      );
    },
    [updateTarget],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<T>) => {
      if (
        optionsRef.current.disabled ||
        !hoveredRef.current ||
        event.pointerType === "touch" ||
        reducedMotionRef.current
      ) {
        return;
      }

      const node = nodeRef.current;
      if (!node) return;

      const { magnetStrength, maxOffset, magnetScale, activeScale, tilt } =
        optionsRef.current;

      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);

      let x = dx * magnetStrength;
      let y = dy * magnetStrength;

      const distance = Math.hypot(x, y);
      const limit = Math.max(0, maxOffset);

      if (distance > limit && distance > 0) {
        const ratio = limit / distance;
        x *= ratio;
        y *= ratio;
      }

      const nx = clamp(rect.width > 0 ? dx / (rect.width / 2) : 0, -1, 1);
      const ny = clamp(rect.height > 0 ? dy / (rect.height / 2) : 0, -1, 1);

      updateTarget(
        x,
        y,
        pressedRef.current ? activeScale : magnetScale,
        -ny * tilt,
        nx * tilt,
      );
    },
    [updateTarget],
  );

  const onPointerLeave = useCallback(
    (event: PointerEvent<T>) => {
      void event;
      hoveredRef.current = false;
      resetMagnet(1);
    },
    [resetMagnet],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<T>) => {
      if (optionsRef.current.disabled || event.button !== 0) return;

      pressedRef.current = true;

      updateTarget(
        targetRef.current.x,
        targetRef.current.y,
        optionsRef.current.activeScale,
        targetRef.current.rx,
        targetRef.current.ry,
      );
    },
    [updateTarget],
  );

  const releasePointer = useCallback(() => {
    if (!pressedRef.current) return;

    pressedRef.current = false;

    resetMagnet(hoveredRef.current ? optionsRef.current.magnetScale : 1);
  }, [resetMagnet]);

  const onPointerUp = useCallback(
    (event: PointerEvent<T>) => {
      void event;
      releasePointer();
    },
    [releasePointer],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<T>) => {
      void event;
      releasePointer();
    },
    [releasePointer],
  );

  return {
    ref: setRef,
    handlers: {
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    },
  };
}
