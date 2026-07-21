"use client";

import Image from "next/image";

// Image with a per-user diagonal watermark (name/email/date) tiled across it,
// plus right-click/drag deterrents. This does NOT prevent screenshots — nothing
// on the web can — but it makes any leaked image traceable to the account.
export default function ProtectedImage({
  src,
  alt,
  watermark,
}: {
  src: string;
  alt: string;
  watermark: string;
}) {
  return (
    <div
      className="absolute inset-0 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        draggable={false}
        className="pointer-events-none object-cover select-none [-webkit-user-drag:none]"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-[-25%] flex flex-wrap content-center gap-x-10 gap-y-12 rotate-[-24deg] opacity-[0.13]">
          {Array.from({ length: 56 }).map((_, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-[10px] font-medium tracking-wider text-[#a9c8e0]"
            >
              {watermark}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
