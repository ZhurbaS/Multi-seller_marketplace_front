import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readConsent, saveConsent, applyConsent, initConsentMode, OPEN_EVENT, GA_ID, META_PIXEL_ID } from "../utils/consent";
import useLegalStatus from "../hooks/useLegalStatus";

const Switch = ({ checked, onChange, disabled, label, hint }) => (
  <label className={`flex items-start gap-3 ${disabled ? "opacity-80" : "cursor-pointer"}`}>
    <input type="checkbox" className="mt-1" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
    <span>
      <span className="font-semibold">{label}</span>
      <span className="block text-sm opacity-75">{hint}</span>
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
  const hasTrackers = !!(GA_ID || META_PIXEL_ID);
  const btn = "px-4 py-2 rounded-md border border-[var(--border-myOrders,#94a3b8)] font-semibold text-sm";

  return (
    <div role="dialog" aria-label="Налаштування cookies" className="fixed bottom-0 left-0 right-0 z-[1000] p-3">
      <div className="max-w-[900px] mx-auto bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-300 p-4 flex flex-col gap-3">
        <p className="text-sm">
          Ми використовуємо необхідні cookies для роботи сайту (вхід, кошик).{" "}
          {hasTrackers ? "За вашою згодою — також аналітичні й маркетингові, щоб покращувати сайт і показувати релевантні пропозиції. " : ""}
          {legal.cookies?.published && (
            <>
              Докладніше —{" "}
              <Link to="/cookies" className="underline">
                Політика cookies
              </Link>
              .
            </>
          )}
        </p>
        {details && (
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-3">
            <Switch checked disabled label="Необхідні" hint="Вхід, кошик, збереження цього вибору. Завжди увімкнені." />
            <Switch
              checked={sel.analytics}
              onChange={(v) => setSel({ ...sel, analytics: v })}
              label="Аналітичні"
              hint="Допомагають зрозуміти, як використовують сайт (Google Analytics)."
            />
            <Switch
              checked={sel.marketing}
              onChange={(v) => setSel({ ...sel, marketing: v })}
              label="Маркетингові"
              hint="Вимірювання реклами й персональні пропозиції."
            />
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <button className={`${btn} bg-slate-900 text-white`} onClick={() => choose({ analytics: true, marketing: true })}>
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
