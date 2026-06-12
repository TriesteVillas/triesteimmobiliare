import { ViewTransition } from "react";

// Remounts on every navigation, so the page content enters/exits through a
// view transition while the header/footer (in layout.tsx) stay put.
// Untyped navigations crossfade; links tagged nav-forward / nav-back
// (property cards, back links) slide directionally. CSS in globals.css.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-fade",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-fade",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
