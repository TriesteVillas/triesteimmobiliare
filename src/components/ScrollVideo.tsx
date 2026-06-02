"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Apple-style scroll-scrubbed video: the clip does not autoplay; its frames
// are tied to how far the pinned section has been scrolled. The overlay
// reveals as the section enters view.
export default function ScrollVideo({
  src,
  poster,
  children,
  className = "h-[230vh]",
}: {
  src: string;
  poster?: string;
  children?: ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const readDuration = () => {
      if (video && Number.isFinite(video.duration)) {
        durationRef.current = video.duration;
      }
    };
    video?.addEventListener("loadedmetadata", readDuration);
    if (video && video.readyState >= 1) readDuration();

    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const p = scrollable > 0 ? scrolled / scrollable : 0;
      setProgress(p);
      const d = durationRef.current;
      if (video && d > 0) {
        const target = p * d;
        if (Math.abs(video.currentTime - target) > 0.04) {
          try {
            video.currentTime = target;
          } catch {
            // seeking can throw before the clip is seekable; ignore
          }
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      video?.removeEventListener("loadedmetadata", readDuration);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const reveal = Math.min(progress / 0.35, 1);
  const contentOpacity = Math.min(reveal, Math.max(0, 1 - (progress - 0.9) * 10));
  const contentTranslate = (1 - reveal) * 32;
  const videoScale = 1 + progress * 0.08;

  return (
    <section ref={sectionRef} className={`relative ${className}`}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-brand-dark">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `scale(${videoScale})` }}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-brand-dark/35 to-brand-dark/80" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div
            className="w-full"
            style={{
              opacity: contentOpacity,
              transform: `translateY(${contentTranslate}px)`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
