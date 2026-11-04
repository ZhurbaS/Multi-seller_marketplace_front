import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readConsent, saveConsent, applyConsent, initConsentMode, OPEN_EVENT } from "../utils/consent";
import useLegalStatus from "../hooks/useLegalStatus";

const Switch = ({ checked, onChange, disabled, label, hint }) => (
  <label className={`flex items-start gap-3 min-h-11 py-1 ${disabled ? "opacity-80" : "cursor-pointer"}`}>
    <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-(--brand)" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
    <span>
      <span className="font-semibold">{label}</span>
      <span className="block text-sm text-(--ink-2)">{hint}</span>
    </span>
  </label>
);

// Банер згоди на cookies: «Прийняти все» / «Відхилити все» / «Налаштувати» — кнопки рівнозначні.
const CookieBanner = () => {
  const legal = useLegalStatus();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [sel, setSel] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    initConsentMode();
    const c = readConsent();
    if (c) applyConsent(c);
    else setOpen(true);
    const show = () => {
      const cur = readConsent();
      setSel({ analytics: !!cur?.analytics, marketing: !!cur?.marketing });
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  if (!open) return null;
  const choose = (v) => {
    saveConsent(v);
    setOpen(false);
    setDetails(false);
  };
  const btn =
    "min-h-11 px-4 rounded-(--r-md) border border-(--line-strong) font-semibold text-[15px] flex-1 sm:flex-none";

  return (
    <div
      role="dialog"
      aria-label="Налаштування cookies"
      className="fixed left-0 right-0 z-50 px-2 sm:px-3 pointer-events-none"
      style={{ bottom: "calc(max(var(--bottomnav-h), var(--sab)) + 8px)" }}
    >
      <div className="pointer-events-auto max-w-[640px] mx-auto max-h-[70dvh] overflow-y-auto overscroll-contain bg-(--surface) text-(--ink) rounded-(--r-lg) shadow-(--shadow-3) border border-(--line) p-4 flex flex-col gap-3">
        <p className="text-sm text-center">
          Ми використовуємо необхідні cookies для роботи сайту.{" "}
          {legal.cookies?.published && (
            <Link to="/cookies" className="underline text-(--brand-ink)">
              Докладніше
            </Link>
          )}
        </p>
        {details && (
          <div className="flex flex-col gap-3 border-t border-(--line) pt-3">
            <Switch checked disabled label="Необхідні" hint="Вхід, кошик, збереження цього вибору. Завжди увімкнені." />
            <Switch
              checked={sel.analytics}
              onChange={(v) => setSel({ ...sel, analytics: v })}
              label="Аналітичні"
              hint="Допомагають зрозуміти, як використовують сайт."
            />
            <Switch
              checked={sel.marketing}
              onChange={(v) => setSel({ ...sel, marketing: v })}
              label="Маркетингові"
              hint="Вимірювання реклами й персональні пропозиції."
            />
          </div>
        )}
        <div className="flex gap-2 flex-wrap justify-center">
          <button className={`${btn} bg-(--ink) text-(--surface) border-(--ink)`} onClick={() => choose({ analytics: true, marketing: true })}>
            Прийняти все
          </button>
          <button className={btn} onClick={() => choose({ analytics: false, marketing: false })}>
            Відхилити все
          </button>
          {details ? (
            <button className={btn} onClick={() => choose(sel)}>
              Зберегти вибір
            </button>
          ) : (
            <button className={btn} onClick={() => setDetails(true)}>
              Налаштувати
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
