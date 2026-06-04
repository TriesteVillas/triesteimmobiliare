import type { Badge } from "@/lib/propertyView";

const VARIANT: Record<Badge["variant"], string> = {
  default: "bg-white/90 text-neutral-700",
  // Private Collection — elegant, refined: deep brand pill, hairline ring, spaced caps.
  private:
    "bg-brand-dark/85 text-white ring-1 ring-white/40 backdrop-blur-sm uppercase tracking-[0.12em]",
  cantiere: "bg-brand text-white uppercase tracking-[0.08em]",
};

export default function PropertyBadge({
  label,
  variant,
  className = "",
}: Badge & { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${VARIANT[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
