import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Модальна панель (гайд, розділ 7): Esc / backdrop / «✕» 44px, блокування скролу (ts-sheet-open),
 * role="dialog" aria-modal, фокус всередині (з поверненням), 100dvh / 85dvh, safe-area.
 * variant: "full" — повноекранна (фільтри), "bottom" — нижній лист (сортування).
 */
const FilterSheet = ({ open, onClose, title, children, footer, variant = "full" }) => {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const node = ref.current;
    const prevFocus = document.activeElement;
    const html = document.documentElement;
    html.classList.add("ts-sheet-open");
    (node.querySelector("[data-autofocus]") || node).focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.classList.remove("ts-sheet-open");
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const panel =
    variant === "full"
      ? "h-[100dvh] w-full pt-(--sat)"
      : "max-h-[85dvh] w-full rounded-t-(--r-lg) sm:max-w-lg sm:rounded-(--r-lg) sm:mb-6";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-(--overlay)"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex flex-col bg-(--surface) text-(--ink) shadow-(--shadow-3) outline-none ${panel}`}
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-(--line) pl-4 pr-1">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="tap rounded-(--r-md) text-(--ink-2) hover:bg-(--surface-2)"
          >
            <LuX size={24} aria-hidden="true" />
          </button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 ${footer ? "" : "safe-b"}`}
        >
          {children}
        </div>
        {footer && (
          <div className="safe-b shrink-0 border-t border-(--line) bg-(--surface) px-4 pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FilterSheet;
