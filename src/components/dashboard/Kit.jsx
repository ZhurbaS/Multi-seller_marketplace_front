import React, { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { LuChevronLeft, LuCircleAlert, LuX } from "react-icons/lu";
import { TONE, cardCls } from "./ui";

// Бейдж статусу: колір + текст (колір не єдиний носій інформації)
export const Badge = ({ tone = "neutral", className = "", wrap = false, children }) => (
  <span
    className={`inline-flex items-center h-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${wrap ? "" : "whitespace-nowrap"} ${
      TONE[tone] || TONE.neutral
    } ${className}`}
  >
    {children}
  </span>
);

// Заголовок розділу; `back` — шлях кнопки «Назад» на вкладених екранах
export const PageHeader = ({ title, back, backLabel = "Назад", subtitle, aside }) => (
  <div className="flex flex-col gap-2">
    {back && (
      <Link
        to={back}
        className="tap -ml-3 self-start gap-1 px-3 text-sm font-medium text-(--brand-ink) hover:underline"
      >
        <LuChevronLeft aria-hidden="true" className="text-xl" />
        {backLabel}
      </Link>
    )}
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] leading-7 md:text-[1.75rem] md:leading-9 font-bold text-(--ink)">{title}</h1>
        {subtitle && <p className="text-sm text-(--ink-2)">{subtitle}</p>}
      </div>
      {aside}
    </div>
  </div>
);

// Секція-картка
export const Section = ({ title, hint, children, className = "", as = "section" }) => {
  const Tag = as;
  return (
  <Tag className={`${cardCls} p-4 md:p-5 flex flex-col gap-3 ${className}`}>
    {(title || hint) && (
      <div>
        {title && <h2 className="text-lg leading-6 font-semibold text-(--ink)">{title}</h2>}
        {hint && <p className="text-sm text-(--ink-2)">{hint}</p>}
      </div>
    )}
    {children}
  </Tag>
  );
};

// Поле форми: лейбл над полем, підказка й помилка під ним (aria-describedby).
// children — функція ({ id, describedBy, invalid }) => <input …/>
export const Field = ({ label, error, hint, required, className = "", children }) => {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex flex-col gap-1 w-full min-w-0 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-(--ink)">
        {label}
        {required && <span className="text-(--danger)"> *</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-(--ink-2)">
          {hint}
        </p>
      )}
      {error && <FieldError id={errId}>{error}</FieldError>}
    </div>
  );
};

export const FieldError = ({ id, children }) => (
  <p id={id} role="alert" className="flex items-start gap-1 text-sm text-(--danger)">
    <LuCircleAlert aria-hidden="true" className="mt-0.5 shrink-0" />
    <span>{children}</span>
  </p>
);

// Модалка: bottom sheet на мобільних, діалог по центру від sm.
// Esc / backdrop / ✕ закривають; скрол під нею заблоковано; фокус у діалозі.
export const Sheet = ({ title, onClose, children, footer }) => {
  const panel = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const prev = document.activeElement;
    const root = document.documentElement;
    root.classList.add("ts-sheet-open");
    panel.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.classList.remove("ts-sheet-open");
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] bg-(--overlay) flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[640px] max-h-[90dvh] sm:max-h-[85dvh] flex flex-col bg-(--surface) text-(--ink) rounded-t-(--r-lg) sm:rounded-(--r-lg) shadow-(--shadow-3) outline-none"
      >
        <div className="flex items-center justify-between gap-2 pl-4 pr-1 py-1 border-b border-(--line)">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Закрити" className="tap rounded-full hover:bg-(--surface-2)">
            <LuX aria-hidden="true" className="text-2xl" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-4">{children}</div>
        {footer && (
          <div className="border-t border-(--line) px-4 pt-3 pb-[max(12px,var(--sab))] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
