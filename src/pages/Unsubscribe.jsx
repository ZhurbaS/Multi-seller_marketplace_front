import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuCircleAlert, LuCircleCheck, LuLoaderCircle, LuSlidersHorizontal } from "react-icons/lu";
import api from "../api/api";
import { subBtnBrand, subBtnGhost, useNoindex } from "../hooks/useMarketingConfig";
import { SubError, SubLoading, SubShell } from "./SubscribeConfirm";

// /unsubscribe?t= — відписка в один клік за посиланням із листа
const Unsubscribe = () => {
  useNoindex();
  const [params] = useSearchParams();
  const t = params.get("t") || "";
  const [state, setState] = useState(t ? "loading" : "error"); // loading | ok | error | resubscribed
  const [prefT, setPrefT] = useState(t);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const sent = useRef("");

  useEffect(() => {
    if (!t || sent.current === t) return;
    sent.current = t;
    setState("loading");
    api
      .post("/home/unsubscribe", { t }, { params: { t } })
      .then(({ data }) => {
        if (data?.prefToken) setPrefT(data.prefToken);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [t]);

  const resubscribe = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      await api.put("/home/preferences", { t: prefT, resubscribe: true });
      setState("resubscribed");
    } catch {
      setErr("Не вдалося повернути підписку. Спробуйте ще раз або налаштуйте теми вручну.");
    } finally {
      setBusy(false);
    }
  };

  const prefLink = `/preferences?t=${encodeURIComponent(prefT)}`;
  const h1 = "flex items-start gap-2 text-[1.375rem] font-bold leading-7 md:text-[1.75rem] md:leading-9";

  return (
    <SubShell>
      {state === "loading" && <SubLoading text="Відписуємо…" />}
      {state === "error" && (
        <SubError title="Не вдалося відписатися">
          Посилання недійсне або застаріле. Відписатися можна за посиланням у будь-якому свіжому листі або напишіть нам у
          підтримку — ми допоможемо.
        </SubError>
      )}
      {state === "ok" && (
        <div className="flex flex-col gap-4">
          <div role="status" aria-live="polite" className="flex flex-col gap-2">
            <h1 className={h1}>
              <LuCircleCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-(--success)" />
              Ви відписані від усіх розсилок TechScout
            </h1>
            <p className="text-(--ink-2)">
              Рекламних листів більше не буде. Повідомлення про ваші замовлення приходитимуть як і раніше. Якщо ж хотілося
              просто отримувати менше листів — можна залишити лише потрібні теми.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={resubscribe} disabled={busy} className={subBtnBrand}>
              {busy && <LuLoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
              Повернути підписку
            </button>
            <Link to={prefLink} className={subBtnGhost}>
              <LuSlidersHorizontal aria-hidden="true" /> Налаштувати теми
            </Link>
          </div>
          {err && (
            <p role="alert" className="flex items-start gap-1 text-sm text-(--danger)">
              <LuCircleAlert aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{err}</span>
            </p>
          )}
        </div>
      )}
      {state === "resubscribed" && (
        <div role="status" aria-live="polite" className="flex flex-col gap-4">
          <h1 className={h1}>
            <LuCircleCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-(--success)" />
            Раді, що ви з нами!
          </h1>
          <p className="text-(--ink-2)">Підписку повернуто. Теми й частоту листів можна змінити будь-коли.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link to={prefLink} className={subBtnBrand}>
              <LuSlidersHorizontal aria-hidden="true" /> Налаштувати теми
            </Link>
            <Link to="/" className={subBtnGhost}>
              До покупок
            </Link>
          </div>
        </div>
      )}
    </SubShell>
  );
};

export default Unsubscribe;
