import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { LuCheck, LuCircleAlert, LuCircleCheck, LuLoaderCircle } from "react-icons/lu";
import api from "../api/api";
import useMarketingConfig, { EMAIL_RE, FALLBACK_CONSENT } from "../hooks/useMarketingConfig";

// Підписка на розсилку у футері (double opt-in: бекенд надсилає лист підтвердження).
// Відповідь сервера однакова для будь-якої адреси — нічого не розкриваємо.
const SubscribeForm = ({ source = "footer" }) => {
  const uid = useId();
  const { consentText } = useMarketingConfig();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [fieldErr, setFieldErr] = useState("");
  const [msg, setMsg] = useState("");

  const text = consentText?.footer || FALLBACK_CONSENT;
  const errId = `${uid}-err`;

  const submit = async (e) => {
    e.preventDefault();
    if (state === "loading" || !consent) return;
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setFieldErr("Вкажіть коректну адресу, наприклад name@example.com");
      return;
    }
    setFieldErr("");
    setState("loading");
    setMsg("");
    try {
      await api.post("/home/subscribe", { email: value, consent: true, source, website });
      setState("success");
      setMsg("Перевірте пошту — надіслали посилання для підтвердження.");
    } catch (err) {
      setState("error");
      setMsg(
        err.response?.status === 429
          ? "Забагато спроб. Спробуйте трохи пізніше."
          : "Не вдалося надіслати. Перевірте з'єднання і спробуйте ще раз."
      );
    }
  };

  if (state === "success") {
    return (
      <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-(--r-md) border border-(--line) p-3 text-sm text-(--on-footer)">
        <LuCircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-(--success)" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{msg}</span>
          <span>Якщо листа немає кілька хвилин — загляньте в «Спам» або «Промоакції».</span>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setMsg("");
            }}
            className="self-start inline-flex items-center min-h-11 underline underline-offset-2"
          >
            Вказати іншу адресу
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="relative flex w-full flex-col gap-2 text-(--on-footer)" aria-describedby={`${uid}-status`}>
      <label htmlFor={`${uid}-email`} className="text-sm font-medium">
        Ваш e-mail
      </label>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <input
          id={`${uid}-email`}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErr) setFieldErr("");
          }}
          aria-invalid={fieldErr ? true : undefined}
          aria-describedby={fieldErr ? errId : undefined}
          className="h-12 w-full min-w-0 flex-1 rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 text-base text-(--ink) outline-0 placeholder:text-(--ink-2) focus:border-(--brand) aria-[invalid=true]:border-(--danger)"
        />
        <button
          type="submit"
          disabled={!consent || state === "loading"}
          aria-busy={state === "loading" || undefined}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-(--r-md) bg-(--brand) px-5 text-base font-semibold text-(--on-brand) hover:bg-(--brand-hover) disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {state === "loading" && <LuLoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
          {state === "loading" ? "Надсилаємо…" : "Підписатися"}
        </button>
      </div>
      {fieldErr && (
        <p id={errId} className="flex items-start gap-1 text-sm text-(--danger)">
          <LuCircleAlert aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{fieldErr}</span>
        </p>
      )}

      {/* Згода — не попередньо поставлена; тап-зона ≥44px */}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-sm leading-5">
        <span className="relative -my-0.5 inline-flex size-6 shrink-0">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="peer absolute inset-0 m-0 size-6 cursor-pointer appearance-none rounded-(--r-sm) border-2 border-(--line-strong) bg-(--surface) checked:border-(--brand) checked:bg-(--brand) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)"
          />
          <LuCheck aria-hidden="true" strokeWidth={3} className="pointer-events-none relative m-auto size-4 text-(--on-brand) opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="pt-0.5">
          {text}{" "}
          <Link to="/privacy" target="_blank" className="font-medium underline underline-offset-2">
            Політика конфіденційності
          </Link>
        </span>
      </label>

      {/* Honeypot: люди його не бачать і не заповнюють */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>Сайт</label>
        <input
          id={`${uid}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <p id={`${uid}-status`} aria-live="polite" className={state === "error" ? "flex items-start gap-1 text-sm text-(--danger)" : "sr-only"}>
        {state === "error" && <LuCircleAlert aria-hidden="true" className="mt-0.5 shrink-0" />}
        <span>{state === "loading" ? "Надсилаємо…" : msg}</span>
      </p>
    </form>
  );
};

export default SubscribeForm;
