"use client";

import { useState } from "react";
import BuyerLeadModal from "./BuyerLeadModal";

// Buyer CTA: looks like the standard pill button but opens the buyer
// popup instead of navigating. `fonteCta` tags the lead with which CTA
// generated it.
export default function BuyerCta({
  label,
  fonteCta,
  className,
}: {
  label: string;
  fonteCta: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <BuyerLeadModal open={open} onClose={() => setOpen(false)} fonteCta={fonteCta} />
    </>
  );
}
