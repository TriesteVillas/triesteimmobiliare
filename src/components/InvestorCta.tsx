"use client";

import { useState } from "react";
import InvestorLeadModal from "./InvestorLeadModal";

// Investor CTA: pill button that opens the "profilo investitore" popup
// (off-market portfolio a reddito funnel → /api/lead tipo "investitore").
export default function InvestorCta({
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
      <InvestorLeadModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
