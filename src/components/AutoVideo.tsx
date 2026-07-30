"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  ariaLabel: string;
  className?: string;
  lazy?: boolean;
};

export default function AutoVideo({
  src,
  poster,
  ariaLabel,
  className,
  lazy = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInViewportRef = useRef(!lazy);
  const prefersReducedMotionRef = useRef(false);
  const sourceMountedRef = useRef(!lazy);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(!lazy);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const tryPlay = useCallback(() => {
    const video = videoRef.current;

    if (
      !video ||
      prefersReducedMotionRef.current ||
      (lazy && !isInViewportRef.current)
    ) {
      return;
    }

    void video.play().catch(() => undefined);
  }, [lazy]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => {
      prefersReducedMotionRef.current = motionQuery.matches;
      setPrefersReducedMotion(motionQuery.matches);

      if (motionQuery.matches) {
        videoRef.current?.pause();
      } else if (!lazy || isInViewportRef.current) {
        tryPlay();
      }
    };

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);

    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
    };
  }, [lazy, tryPlay]);

  useEffect(() => {
    sourceMountedRef.current = hasEnteredViewport && !prefersReducedMotion;

    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
      video.load();
      return;
    }

    if (hasEnteredViewport) {
      tryPlay();
    }
  }, [hasEnteredViewport, prefersReducedMotion, tryPlay]);

  useEffect(() => {
    if (!lazy) return;

    const video = videoRef.current;
    if (!video) return;

    if (!("IntersectionObserver" in window)) {
      const loadFallback = globalThis.setTimeout(() => {
        isInViewportRef.current = true;
        setHasEnteredViewport(true);
      }, 0);

      return () => {
        globalThis.clearTimeout(loadFallback);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isInViewportRef.current = true;

          if (sourceMountedRef.current) {
            tryPlay();
          } else {
            setHasEnteredViewport(true);
          }
        } else {
          isInViewportRef.current = false;
          video.pause();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [lazy, tryPlay]);

  const shouldMountSource = hasEnteredViewport && !prefersReducedMotion;

  return (
    <video
      ref={videoRef}
      src={shouldMountSource ? src : undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload={lazy ? "none" : "metadata"}
      aria-label={ariaLabel}
      role="img"
      className={className}
    />
  );
}
