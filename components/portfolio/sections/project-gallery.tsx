"use client";

import {
  ViewTransition,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";

import type { Project } from "@/types/project";

export type ProjectGalleryHandle = {
  scrollToFirstCard(options?: { smooth?: boolean }): Promise<void>;
  animateExtraCardsOut(): Promise<void>;
  cancelScroll: () => void;
};

type ProjectGalleryProps = {
  project: Project;
  view: "gallery" | "detail";
  onToggleView: () => void;
};

const TOP_OFFSET = 32;
const GALLERY_ENTER_DELAY = 0.9;
const GALLERY_ENTER_DURATION = 0.45;
const GALLERY_EXIT_DURATION = 0.34;

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

const COVER_TRANSITION_SHARE = {
  "project-open": "morph-open",
  "project-close": "morph-close",
  default: "none",
} as const;

const ProjectGallery = forwardRef<ProjectGalleryHandle, ProjectGalleryProps>(
  function ProjectGallery({ project, view, onToggleView }, ref) {
    const galleryRef = useRef<HTMLUListElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    const cancelScrollRef = useRef<(() => void) | null>(null);
    const galleryEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
    const extraExitTweenRef = useRef<gsap.core.Tween | null>(null);
    const extraExitResolveRef = useRef<(() => void) | null>(null);

    // Mencegah entrance gallery dibuat ulang ketika kembali dari detail.
    const hasPlayedGalleryEntrance = useRef(false);
    const previousSlugRef = useRef(project.slug);

    // Reset entrance hanya jika project benar-benar berganti.
    if (previousSlugRef.current !== project.slug) {
      previousSlugRef.current = project.slug;
      hasPlayedGalleryEntrance.current = false;
    }

    useImperativeHandle(ref, () => {
      const cancelScroll = () => {
        cancelScrollRef.current?.();
        cancelScrollRef.current = null;
      };

      function animateExtraCardsOut(): Promise<void> {
        const gallery = galleryRef.current;
        const extraCards = gallery?.querySelectorAll<HTMLElement>(
          "[data-gallery-extra]",
        );

        if (!extraCards || extraCards.length === 0) {
          return Promise.resolve();
        }

        // Jika entrance masih berjalan/menunggu delay, hentikan sebelum exit.
        galleryEntranceTweenRef.current?.kill();
        galleryEntranceTweenRef.current = null;

        // Jika extra cards belum terlihat (misalnya Back ditekan saat delay
        // entrance 1 detik), tidak perlu menunggu exit yang tidak akan terlihat.
        const hasVisibleCard = Array.from(extraCards).some((card) => {
          const opacity = Number(gsap.getProperty(card, "opacity"));
          return (
            window.getComputedStyle(card).visibility !== "hidden" &&
            opacity > 0.02
          );
        });

        if (!hasVisibleCard) {
          gsap.set(extraCards, {
            autoAlpha: 0,
            y: 56,
          });
          return Promise.resolve();
        }

        // Amankan pemanggilan berulang tanpa meninggalkan Promise sebelumnya.
        extraExitTweenRef.current?.kill();
        extraExitResolveRef.current?.();
        extraExitResolveRef.current = null;

        return new Promise<void>((resolve) => {
          let settled = false;

          const finish = () => {
            if (settled) return;
            settled = true;

            extraExitTweenRef.current = null;
            extraExitResolveRef.current = null;
            resolve();
          };

          extraExitResolveRef.current = finish;

          extraExitTweenRef.current = gsap.to(extraCards, {
            autoAlpha: 0,
            y: 56,
            duration: GALLERY_EXIT_DURATION,
            stagger: 0,
            ease: "power2.in",
            overwrite: "auto",
            onComplete: finish,
            onInterrupt: finish,
          });
        });
      }

      function scrollToFirstCard(options?: {
        smooth?: boolean;
      }): Promise<void> {
        // Hentikan tween sebelumnya sebelum membuat tween baru.
        cancelScroll();

        return new Promise<void>((resolve) => {
          const root = contentRef.current;

          if (!root) {
            resolve();
            return;
          }

          const firstCard =
            root.querySelector<HTMLElement>("[data-gallery-item]") ??
            root.querySelector<HTMLElement>("[data-detail-item]");

          if (!firstCard) {
            resolve();
            return;
          }

          const isDesktop = window.matchMedia("(min-width: 768px)").matches;

          const scroller: HTMLElement | null = isDesktop
            ? root.closest<HTMLElement>(".project-gallery-scroll")
            : null;

          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;

          const smooth = options?.smooth !== false && !reduceMotion;

          const getPosition = () =>
            scroller ? scroller.scrollTop : window.scrollY;

          const getMaxScroll = () =>
            scroller
              ? Math.max(0, scroller.scrollHeight - scroller.clientHeight)
              : Math.max(
                  0,
                  document.documentElement.scrollHeight - window.innerHeight,
                );

          const getTarget = () => {
            const rect = firstCard.getBoundingClientRect();

            const rawTarget = scroller
              ? scroller.scrollTop +
                rect.top -
                scroller.getBoundingClientRect().top -
                scroller.clientTop -
                TOP_OFFSET
              : window.scrollY + rect.top - window.innerHeight;

            return Math.max(0, Math.min(getMaxScroll(), rawTarget));
          };

          const setPosition = (position: number) => {
            if (scroller) {
              scroller.scrollTop = position;
            } else {
              window.scrollTo({
                top: position,
                left: 0,
                behavior: "auto",
              });
            }
          };

          /**
           * Kunci input manual selama auto-scroll.
           * Ini mencegah wheel/touch/key scrolling berebut dengan GSAP.
           */
          const lockUserScroll = () => {
            const scrollStyleElement = scroller ?? document.documentElement;
            const previousScrollBehavior =
              scrollStyleElement.style.scrollBehavior;

            scrollStyleElement.style.scrollBehavior = "auto";

            const preventScroll = (event: Event) => {
              if (event.cancelable) event.preventDefault();
            };

            const handleKeyDown = (event: KeyboardEvent) => {
              if (!SCROLL_KEYS.has(event.key)) return;

              const target = event.target;

              // Tetap izinkan interaksi normal pada field input.
              if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                  target.matches(
                    "input, textarea, select, [contenteditable='true']",
                  ))
              ) {
                return;
              }

              event.preventDefault();
            };

            window.addEventListener("wheel", preventScroll, {
              capture: true,
              passive: false,
            });

            window.addEventListener("touchmove", preventScroll, {
              capture: true,
              passive: false,
            });

            window.addEventListener("keydown", handleKeyDown, true);

            let released = false;

            return () => {
              if (released) return;
              released = true;

              window.removeEventListener("wheel", preventScroll, true);
              window.removeEventListener("touchmove", preventScroll, true);
              window.removeEventListener("keydown", handleKeyDown, true);

              scrollStyleElement.style.scrollBehavior = previousScrollBehavior;
            };
          };

          if (!smooth) {
            setPosition(getTarget());
            resolve();
            return;
          }

          // Ambil alih scroll sebelum menghitung target.
          const releaseScrollLock = lockUserScroll();
          const start = getPosition();
          const target = getTarget();

          if (Math.abs(start - target) <= 2) {
            setPosition(target);
            releaseScrollLock();
            resolve();
            return;
          }

          const scrollObj = { y: start };
          let settled = false;

          const finish = () => {
            if (settled) return;
            settled = true;
            releaseScrollLock();

            if (cancelScrollRef.current === cancel) {
              cancelScrollRef.current = null;
            }

            resolve();
          };

          const cancel = () => {
            gsap.killTweensOf(scrollObj);
            finish();
          };

          cancelScrollRef.current = cancel;

          gsap.to(scrollObj, {
            y: target,
            duration: 0.5,
            ease: "power2.inOut",
            overwrite: "auto",
            onUpdate: () => setPosition(scrollObj.y),
            onComplete: finish,
          });
        });
      }

      return {
        scrollToFirstCard,
        animateExtraCardsOut,
        cancelScroll,
      };
    }, []);

    // Detail text entrance animation — dipertahankan seperti sebelumnya.
    useLayoutEffect(() => {
      if (view !== "detail" || !detailRef.current) {
        return;
      }

      const container = detailRef.current;
      const textElements =
        container.querySelectorAll<HTMLElement>("[data-detail-text]");

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(textElements, { clearProps: "all" });
        return;
      }

      const context = gsap.context(() => {
        gsap.fromTo(
          textElements,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
          },
        );
      }, container);

      return () => context.revert();
    }, [project.slug, view]);

    /*
     * Extra gallery cards baru muncul setelah shared first card selesai morph.
     * Main card morph + panel/back entrance = 1000ms.
     * Sesudah itu extra cards masuk dari bawah selama 450ms.
     */
    useLayoutEffect(() => {
      if (
        view !== "gallery" ||
        !galleryRef.current ||
        hasPlayedGalleryEntrance.current
      ) {
        return;
      }

      hasPlayedGalleryEntrance.current = true;

      const gallery = galleryRef.current;
      const extraCards = gallery.querySelectorAll<HTMLElement>(
        "[data-gallery-extra]",
      );

      if (extraCards.length === 0) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(extraCards, {
          autoAlpha: 1,
          y: 0,
          clearProps: "transform,opacity,visibility",
        });
        return;
      }

      const context = gsap.context(() => {
        // useLayoutEffect + gsap.set mencegah extra cards flash sebelum delay.
        gsap.set(extraCards, {
          autoAlpha: 0,
          y: 48,
        });

        galleryEntranceTweenRef.current = gsap.to(extraCards, {
          autoAlpha: 1,
          y: 0,
          duration: GALLERY_ENTER_DURATION,
          delay: GALLERY_ENTER_DELAY,
          stagger: 0,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        });
      }, gallery);

      return () => {
        galleryEntranceTweenRef.current?.kill();
        galleryEntranceTweenRef.current = null;

        // Jika user membuka Detail sebelum entrance selesai, jangan tinggalkan
        // extra cards dalam keadaan tersembunyi ketika kembali ke Gallery.
        gsap.set(extraCards, {
          clearProps: "transform,opacity,visibility",
        });

        context.revert();
      };
    }, [project.slug, view]);

    // Bersihkan tween saat component unmount.
    useLayoutEffect(() => {
      return () => {
        cancelScrollRef.current?.();
        cancelScrollRef.current = null;

        galleryEntranceTweenRef.current?.kill();
        galleryEntranceTweenRef.current = null;

        extraExitTweenRef.current?.kill();
        extraExitTweenRef.current = null;
        extraExitResolveRef.current?.();
        extraExitResolveRef.current = null;
      };
    }, []);

    const detailSections = [
      { title: "About project", body: project.about },
      { title: "Challenge", body: project.challenge },
      { title: "Solution", body: project.solution },
      { title: "Result", body: project.result },
    ];

    const handleCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onToggleView();
      }
    };

    // Harus sama urutannya dengan media di PortfolioCard.
    const galleryMedia = [
      ...(project.videos ?? []).map((src) => ({
        src,
        type: "video" as const,
      })),
      ...(project.images ?? []).map((src) => ({
        src,
        type: "image" as const,
      })),
    ];

    const renderGalleryCard = (
      src: string,
      type: "video" | "image",
      index: number,
      extra = false,
    ) => (
      <motion.li
        key={`${type}-${src}`}
        data-gallery-item
        data-gallery-extra={extra ? "" : undefined}
        role="button"
        tabIndex={0}
        aria-label={`Beralih ke detail project ${project.name}`}
        onClick={onToggleView}
        onKeyDown={handleCardKeyDown}
        className="relative aspect-square w-full shrink-0 cursor-pointer overflow-hidden rounded-[44px]"
      >
        {type === "video" ? (
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${project.name} video preview ${index + 1}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={src}
            alt={`${project.name} — gambar ${index + 1}`}
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-cover"
          />
        )}
      </motion.li>
    );

    return (
      <div
        ref={contentRef}
        className="flex w-full flex-col gap-3 pb-24 md:pt-8 md:pb-8"
      >
        {view === "gallery" ? (
          <ul
            ref={galleryRef}
            className="bg-surface flex w-full flex-col gap-3 md:pl-6"
          >
            {/* First card: shared element carousel ⇄ gallery. */}
            {galleryMedia.length > 0 && (
              <ViewTransition
                key={`project-cover-${project.slug}`}
                name={`project-cover-${project.slug}`}
                default="none"
                share={COVER_TRANSITION_SHARE}
              >
                {renderGalleryCard(
                  galleryMedia[0].src,
                  galleryMedia[0].type,
                  0,
                )}
              </ViewTransition>
            )}

            {/* Extra cards: ditandai agar dapat dianimasikan terpisah dari morph. */}
            {galleryMedia
              .slice(1)
              .map(({ src, type }, index) =>
                renderGalleryCard(src, type, index + 1, true),
              )}
          </ul>
        ) : (
          <div ref={detailRef} className="flex w-full flex-col gap-3">
            {detailSections.map(({ title, body }) => (
              <article
                key={title}
                data-detail-item
                role="button"
                tabIndex={0}
                aria-label={`Kembali ke gallery ${project.name}`}
                onClick={onToggleView}
                onKeyDown={handleCardKeyDown}
                className="bg-solid text-foreground relative flex aspect-square w-full shrink-0 cursor-pointer flex-col overflow-hidden rounded-[44px] p-6 shadow-sm sm:p-8 md:p-9 lg:p-10"
              >
                <h3
                  data-detail-text
                  className="text-foreground/60 text-[10px] md:text-[clamp(0.9rem,1vw,1.1rem)]"
                >
                  {title}
                </h3>

                <p
                  data-detail-text
                  className="mt-3 text-sm leading-relaxed md:mt-6 md:text-[clamp(1.2rem,1.5vw,1.6rem)] md:leading-[1.55]"
                >
                  {body}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  },
);

ProjectGallery.displayName = "ProjectGallery";

export default ProjectGallery;
