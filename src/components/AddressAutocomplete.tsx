"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/geocode";

/* Address field with suggestions from /api/geocode.

   Deliberately a plain text input underneath: the suggestions are a
   convenience, never a gate. Whatever someone types is submitted as-is
   if they ignore the dropdown, so an address the geocoder has never
   heard of still gets through. */

export default function AddressAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
  className,
  listClassName = "",
  itemClassName = "",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Fired only when a suggestion is chosen — carries postcode and coords. */
  onPick?: (s: AddressSuggestion) => void;
  placeholder?: string;
  className: string;
  listClassName?: string;
  itemClassName?: string;
  id?: string;
}) {
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Set when the user picks a suggestion, so the effect below does not
  // immediately re-query with the text it just wrote into the field.
  const justPicked = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      // Close stale suggestions in the same tick; deferring leaves the menu visible for a frame.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      // Start the spinner with the request, not while the debounce is still waiting.
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { results?: AddressSuggestion[] };
        setItems(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
        setActive(-1);
      } catch {
        /* aborted or offline — the field still works as free text */
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const pick = (s: AddressSuggestion) => {
    justPicked.current = true;
    onChange(s.label);
    onPick?.(s);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={box} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => items.length && setOpen(true)}
      />

      {loading && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-current/25 border-t-current/80"
        />
      )}

      {open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl py-1 shadow-2xl ${listClassName}`}
        >
          {items.map((s, i) => (
            <li
              key={s.label + i}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2 text-sm ${itemClassName} ${
                i === active ? "is-active" : ""
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
