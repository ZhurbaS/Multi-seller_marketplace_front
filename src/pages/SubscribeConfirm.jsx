import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuCircleCheck, LuCircleX, LuLoaderCircle, LuSend, LuSlidersHorizontal } from "react-icons/lu";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../api/api";
import { useNoindex, subBtnBrand as btnBrand, subBtnGhost as btnGhost } from "../hooks/useMarketingConfig";


// Оболонка публічних сторінок підписки: шапка, вузька картка по центру, футер
export const SubShell = ({ children }) => (
  <div className="flex min-h-dvh flex-col bg-(--page)">
    <Header />
    <main className="flex-1">
      <div className="container-x py-6 md:py-10">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 text-(--ink) md:p-6">
          {children}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export const SubLoading = ({ text }) => (
  <div role="status" aria-live="polite" className="flex items-center gap-3 py-6 text-(--ink-2)">
    <LuLoaderCircle aria-hidden="true" className="size-6 motion-safe:animate-spin" />
    <span>{text}</span>
  </div>
);

export const SubError = ({ title = "Посилання недійсне або прострочене", children }) => (
  <div role="alert" className="flex flex-col gap-3">
    <h1 className="flex items-start gap-2 text-[1.375rem] font-bold leading-7 md:text-[1.75rem] md:leading-9">
      <LuCircleX aria-hidden="true" className="mt-1 size-6 shrink-0 text-(--danger)" />
      {title}
    </h1>
    <p className="text-(--ink-2)">{children || "Підпишіться ще раз — форма є внизу будь-якої сторінки магазину."}</p>
    <Link to="/" className={`${btnBrand} self-start`}>
      На головну
    </Link>
  </div>
);

// /subscribe/confirm?t= — підтвердження підписки з листа (double opt-in)
const SubscribeConfirm = () => {
  useNoindex();
  const [params] = useSearchParams();
  const t = params.get("t") || "";
  const [state, setState] = useState(t ? "loading" : "error");
  const [res, setRes] = useState(null);
  const sent = useRef("");

  useEffect(() => {
    if (!t || sent.current === t) return;
    sent.current = t; // StrictMode / повторний рендер — не підтверджуємо двічі
    setState("loading");
    api
      .post("/home/subscribe/confirm", { t })
      .then(({ data }) => {
        setRes(data || {});
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [t]);

  return (
    <SubShell>
      {state === "loading" && <SubLoading text="Підтверджуємо підписку…" />}
      {state === "error" && <SubError />}
      {state === "ok" && (
        <div role="status" aria-live="polite" className="flex flex-col gap-4">
          <h1 className="flex items-start gap-2 text-[1.375rem] font-bold leading-7 md:text-[1.75rem] md:leading-9">
            <LuCircleCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-(--success)" />
            Дякуємо! Підписку підтверджено
          </h1>
          <p className="text-(--ink-2)">
            {res?.email ? (
              <>
                Листи надходитимуть на <span className="break-all font-medium text-(--ink)">{res.email}</span>.
              </>
            ) : (
              "Листи вже в дорозі."
            )}{" "}
            Відписатися можна будь-коли — посилання є в кожному листі.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {res?.telegramLink && (
              <a href={res.telegramLink} target="_blank" rel="noopener noreferrer" className={btnBrand}>
                <LuSend aria-hidden="true" /> Підписатися також у Telegram
              </a>
            )}
            {res?.prefToken && (
              <Link to={`/preferences?t=${encodeURIComponent(res.prefToken)}`} className={res?.telegramLink ? btnGhost : btnBrand}>
                <LuSlidersHorizontal aria-hidden="true" /> Налаштувати теми
              </Link>
            )}
            <Link to="/" className={btnGhost}>
              До покупок
            </Link>
          </div>
        </div>
      )}
    </SubShell>
  );
};

export default SubscribeConfirm;
