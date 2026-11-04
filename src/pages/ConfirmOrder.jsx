import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuCheck, LuCircleCheck, LuCircleX, LuClock, LuCopy, LuLoaderCircle } from "react-icons/lu";
import api from "../api/api";
import { orderNo } from "../utils/statusLabels";

// Сторінка, на яку покупець повертається після оплати (monobank/LiqPay/тест) або
// після вибору «Оплата при отриманні». Статус завжди перевіряємо на сервері
// (вебхук міг ще не дійти — тоді кілька разів перепитуємо).
const MAX_ATTEMPTS = 8;
const RETRY_MS = 2500;

// Кнопка копіювання (≥44px) з підтвердженням для скрінрідера
const CopyButton = ({ value, label }) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* копіювання недоступне */
      }
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? "Скопійовано" : label}
      className="tap rounded-(--r-md) text-(--brand-ink) hover:bg-(--brand-soft)"
    >
      {done ? <LuCheck size={20} aria-hidden="true" /> : <LuCopy size={20} aria-hidden="true" />}
      <span className="sr-only" aria-live="polite">
        {done ? "Скопійовано" : ""}
      </span>
    </button>
  );
};

const ConfirmOrder = () => {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const isCod = params.get("method") === "cod";
  const isInvoice = params.get("method") === "invoice";
  const emailed = params.get("emailed") === "1";
  const invoiceNumber = params.get("number") || "";
  const channel = params.get("channel") || "email";

  // loading | paid | cod | invoice | failed | pending
  const [result, setResult] = useState("loading");
  const attempts = useRef(0);

  useEffect(() => {
    if (!orderId) {
      setResult("failed");
      return;
    }
    if (isCod) {
      setResult("cod");
      return;
    }
    if (isInvoice) {
      setResult("invoice");
      return;
    }
    let timer;
    let cancelled = false;

    const check = async () => {
      try {
        const { data } = await api.get(`/pay/verify/${orderId}`);
        if (cancelled) return;
        if (data.payment_status === "paid") return setResult("paid");
        if (data.state === "failed") return setResult("failed");
      } catch {
        /* тимчасова помилка — пробуємо ще */
      }
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) return setResult("pending");
      timer = setTimeout(check, RETRY_MS);
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, isCod, isInvoice]);

  const number = orderId ? orderNo({ _id: orderId }) : "";
  const messenger = channel === "viber" ? "Viber" : "WhatsApp";

  const STATUS = {
    paid: { tone: "success", icon: LuCircleCheck, title: "Оплату отримано", text: "Дякуємо за замовлення!" },
    cod: { tone: "success", icon: LuCircleCheck, title: "Замовлення оформлено", text: "Оплата — при отриманні." },
    invoice: { tone: "success", icon: LuCircleCheck, title: "Рахунок виставлено", text: null },
    pending: {
      tone: "warning",
      icon: LuClock,
      title: "Оплата ще обробляється",
      text: "Статус оновиться в «Моїх замовленнях» протягом кількох хвилин.",
    },
    failed: {
      tone: "danger",
      icon: LuCircleX,
      title: "Оплата не пройшла",
      text: "Ви можете спробувати ще раз із розділу «Мої замовлення».",
    },
  };
  const s = STATUS[result];
  const toneCls = {
    success: "bg-(--success-soft) text-(--success)",
    warning: "bg-(--surface-2) text-(--warning)",
    danger: "bg-(--danger-soft) text-(--danger)",
  };

  const primaryBtn =
    "inline-flex items-center justify-center h-12 px-6 rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) font-semibold";
  const secondaryBtn =
    "inline-flex items-center justify-center h-12 px-6 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) font-semibold hover:bg-(--surface-2)";

  return (
    <main className="min-h-dvh bg-(--page) flex items-start sm:items-center justify-center px-4 py-8">
      <div className="w-full max-w-[520px] bg-(--surface) border border-(--line) rounded-(--r-lg) shadow-(--shadow-2) p-5 sm:p-8 flex flex-col items-center gap-4 text-center text-(--ink)">
        {result === "loading" ? (
          <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-6">
            <LuLoaderCircle size={48} className="text-(--brand-ink) motion-safe:animate-spin" aria-hidden="true" />
            <p className="text-(--ink-2)">Перевіряємо оплату...</p>
          </div>
        ) : (
          <>
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
              <span className={`w-16 h-16 rounded-full flex items-center justify-center ${toneCls[s.tone]}`}>
                <s.icon size={36} aria-hidden="true" />
              </span>
              <h1 className="text-[1.375rem] leading-7 md:text-[1.75rem] md:leading-9 font-bold">{s.title}</h1>
              {s.text && <p className="text-(--ink-2)">{s.text}</p>}
            </div>

            {orderId && (
              <div className="w-full flex items-center justify-between gap-2 pl-4 pr-1 py-1 rounded-(--r-md) bg-(--surface-2)">
                <span className="text-sm text-(--ink-2)">Номер замовлення</span>
                <span className="flex items-center gap-1">
                  <span className="font-bold tabular-nums">{number}</span>
                  <CopyButton value={number} label="Скопіювати номер замовлення" />
                </span>
              </div>
            )}

            {result === "invoice" && (
              <>
                {invoiceNumber && (
                  <div className="w-full flex items-center justify-between gap-2 pl-4 pr-1 py-1 rounded-(--r-md) bg-(--surface-2)">
                    <span className="text-sm text-(--ink-2)">Рахунок</span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold tabular-nums">{invoiceNumber}</span>
                      <CopyButton value={invoiceNumber} label="Скопіювати номер рахунку" />
                    </span>
                  </div>
                )}
                <p>
                  Замовлення оформлено. Рахунок {invoiceNumber}{" "}
                  {channel !== "email"
                    ? emailed
                      ? `надіслано у ${messenger} на номер, указаний у замовленні.`
                      : `сформовано. Менеджер надішле його у ${messenger} на номер, указаний у замовленні, — також його можна одразу завантажити в «Моїх замовленнях».`
                    : emailed
                    ? "надіслано на вашу електронну пошту."
                    : "сформовано, але лист поки не надіслано — ми надішлемо його найближчим часом."}
                </p>
                <p className="text-sm text-(--ink-2) max-w-[60ch]">
                  Сплатіть його протягом строку, вказаного в рахунку, і обов'язково вкажіть призначення платежу з
                  рахунку. Рахунок також можна завантажити в «Моїх замовленнях» (деталі замовлення). Замовлення піде в
                  обробку після надходження коштів на наш рахунок.
                </p>
              </>
            )}

            <div className="w-full flex flex-col sm:flex-row gap-2 sm:justify-center pt-2">
              {orderId && result !== "failed" ? (
                <Link className={primaryBtn} to={`/dashboard/order/details/${orderId}`}>
                  До замовлення
                </Link>
              ) : (
                <Link className={primaryBtn} to="/dashboard/my-orders">
                  До моїх замовлень
                </Link>
              )}
              <Link className={secondaryBtn} to="/shops">
                Продовжити покупки
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ConfirmOrder;
