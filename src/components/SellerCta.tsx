"use client";

import { useState } from "react";
import SellerLeadModal from "./SellerLeadModal";

// Seller CTA ("Richiedi una valutazione riservata"): pill button that
// opens the seller intake popup.
export default function SellerCta({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <SellerLeadModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
