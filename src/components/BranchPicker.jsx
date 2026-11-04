import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown, LuLoaderCircle, LuMapPin, LuSearch, LuX } from "react-icons/lu";
import Autocomplete from "./Autocomplete";
import { inputCls, labelCls, FieldError } from "./CheckoutUi";

// Від lg (1080px) — звичайний випадаючий список (Autocomplete), нижче — повноекранна панель пошуку.
const MQ = "(min-width: 67.5rem)";
const subscribe = (cb) => {
  const m = window.matchMedia(MQ);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(MQ).matches, () => true);

// Вибір відділення / поштомата Нової пошти.
// kind: "warehouse" | "postomat"; onKind(kind) — перемикач «Відділення / Поштомат» у панелі.
const BranchPicker = ({ id, label, value, disabled, placeholder, kind, onKind, onText, onPick, fetcher, error, onBlur }) => {
  const desktop = useDesktop();
  const [open, setOpen] = useState(false);

  if (desktop) {
    return (
      <Autocomplete
        id={id}
        label={label}
        value={value}
        disabled={disabled}
        loadOnFocus
        placeholder={placeholder}
        onText={onText}
        onPick={onPick}
        fetcher={fetcher}
        error={error}
        onBlur={onBlur}
      />
    );
  }

  const errId = `${id}-err`;
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      <span id={`${id}-label`} className={labelCls}>
        {label}
      </span>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={errId}
        aria-invalid={error ? true : undefined}
        onClick={() => setOpen(true)}
        className={`${inputCls} h-auto min-h-12 py-2.5 flex items-center gap-2 text-left`}
      >
        <LuMapPin aria-hidden="true" className="size-5 shrink-0 text-(--ink-2)" />
        <span className={`flex-1 min-w-0 leading-5 ${value ? "text-(--ink)" : "text-(--ink-2)"}`}>{value || placeholder}</span>
        <LuChevronDown aria-hidden="true" className="size-5 shrink-0 text-(--ink-2)" />
      </button>
      <FieldError id={errId}>{error}</FieldError>
      {open && (
        <BranchSheet
          title={label.replace(/\s*\*$/, "")}
          kind={kind}
          onKind={onKind}
          fetcher={fetcher}
          onClose={() => {
            setOpen(false);
            onBlur?.();
            requestAnimationFrame(() => document.getElementById(id)?.focus());
          }}
          onPick={(w) => {
            onPick(w);
            setOpen(false);
            requestAnimationFrame(() => document.getElementById(id)?.focus());
          }}
        />
      )}
    </div>
  );
};

const KINDS = [
  ["warehouse", "Відділення"],
  ["postomat", "Поштомат"],
];

// Повноекранна панель: пошук, фільтр «Відділення / Поштомат», пункти ≥56px, ✕ / Esc, 100dvh
const BranchSheet = ({ title, kind, onKind, fetcher, onClose, onPick }) => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const input = useRef(null);
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // блокування скролу під панеллю + Esc + утримання фокуса
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("ts-sheet-open");
    input.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === "Tab" && dialog.current) {
        const f = dialog.current.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      html.classList.remove("ts-sheet-open");
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // пошук з дебаунсом; fetcher змінюється разом із типом (відділення / поштомат)
  useEffect(() => {
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetcher(q.trim());
        if (my === seq.current) setItems(r || []);
      } catch {
        if (my === seq.current) setItems([]);
      } finally {
        if (my === seq.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, fetcher]);

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-sheet-title"
      className="fixed inset-0 z-[1000] flex flex-col h-dvh bg-(--page) text-(--ink) overscroll-contain"
    >
      <div className="bg-(--surface) border-b border-(--line) pt-[max(8px,var(--sat))]">
        <div className="flex items-center gap-2 px-2">
          <h2 id="branch-sheet-title" className="flex-1 px-2 text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Закрити" className="tap rounded-(--r-md) text-(--ink) text-xl">
            <LuX aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 pb-3 flex flex-col gap-3">
          <div className="relative">
            <LuSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-(--ink-2)" />
            <input
              ref={input}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              aria-label="Пошук за номером або адресою"
              aria-controls="branch-sheet-list"
              placeholder="Номер або адреса"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          {onKind && (
            <div role="radiogroup" aria-label="Тип пункту видачі" className="grid grid-cols-2 gap-1 p-1 rounded-(--r-md) bg-(--surface-2)">
              {KINDS.map(([k, t]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => kind !== k && onKind(k)}
                  className={`min-h-11 rounded-(--r-sm) text-[15px] font-semibold ${
                    kind === k ? "bg-(--surface) text-(--brand-ink) shadow-(--shadow-1)" : "text-(--ink-2)"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain pb-[max(12px,var(--sab))]" aria-busy={loading}>
        <p className="sr-only" aria-live="polite">
          {loading ? "Пошук..." : `Знайдено: ${items.length}`}
        </p>
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-(--ink-2)">
            <LuLoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" /> Пошук...
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-(--ink-2)">Нічого не знайдено. Спробуйте інший номер або вулицю.</p>
        ) : (
          <ul id="branch-sheet-list" className="bg-(--surface) divide-y divide-(--line)">
            {items.map((w) => (
              <li key={w.ref}>
                <button type="button" onClick={() => onPick(w)} className="w-full min-h-14 px-4 py-3 text-left flex flex-col justify-center active:bg-(--surface-2)">
                  <span className="text-[15px] leading-5 font-medium">{w.title}</span>
                  {w.address && w.address !== w.title && <span className="text-sm text-(--ink-2) leading-5 mt-0.5">{w.address}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BranchPicker;
