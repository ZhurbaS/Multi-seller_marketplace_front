import React, { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { LuCircleAlert, LuEye, LuEyeOff, LuLoaderCircle } from "react-icons/lu";
import api from "../api/api";
import { set_token } from "../store/reducers/authSlice";

/* ============================================================
   Спільні елементи форм входу/реєстрації (Login, Register, OTP).
   Поля 48px, шрифт ≥16px, лейбл над полем, помилка під полем
   з aria-describedby; кнопки 48px, основна — --brand/--on-brand.
   ============================================================ */

const inputBase =
  "h-12 w-full rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 text-base text-(--ink) placeholder:text-(--ink-2) outline-none transition-colors focus:border-(--brand) focus:ring-2 focus:ring-(--brand-soft) aria-invalid:border-(--danger) aria-invalid:focus:ring-(--danger-soft)";

export const FieldError = ({ id, children }) =>
  children ? (
    <p id={id} className="flex items-start gap-1.5 text-sm text-(--danger)">
      <LuCircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  ) : null;

// Поле з лейблом над ним, підказкою та інлайн-помилкою
export const AuthField = React.forwardRef(function AuthField(
  { id, label, error, hint, optional, className = "", children, ...inputProps },
  ref
) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-(--ink)">
        {label}
        {optional && <span className="font-normal text-(--ink-2)"> (необов'язково)</span>}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${className}`}
          {...inputProps}
        />
        {children}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-(--ink-2)">
          {hint}
        </p>
      )}
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
});

// Пароль із кнопкою «показати/приховати» 44×44
export const PasswordField = React.forwardRef(function PasswordField(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <AuthField ref={ref} {...props} type={shown ? "text" : "password"} className="pr-12">
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Приховати пароль" : "Показати пароль"}
        aria-pressed={shown}
        aria-controls={props.id}
        className="tap absolute right-0.5 top-1/2 -translate-y-1/2 rounded-(--r-md) text-(--ink-2) hover:text-(--ink)"
      >
        {shown ? <LuEyeOff aria-hidden="true" className="size-5" /> : <LuEye aria-hidden="true" className="size-5" />}
      </button>
    </AuthField>
  );
});

// Кнопка 48px зі станом завантаження. variant: primary (--brand) | secondary (нейтральна)
export const AuthButton = ({ loading, loadingText, variant = "primary", className = "", children, disabled, ...rest }) => {
  const look =
    variant === "primary"
      ? "bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)"
      : "border border-(--line-strong) bg-(--surface) text-(--ink) hover:bg-(--surface-2)";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-(--r-md) px-4 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${look} ${className}`}
    >
      {loading && <LuLoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
};

export const OrDivider = ({ children = "або" }) => (
  <div className="flex items-center gap-3 py-1 text-sm text-(--ink-2)" role="separator" aria-label={String(children)}>
    <span aria-hidden="true" className="h-px flex-1 bg-(--line)" />
    <span aria-hidden="true">{children}</span>
    <span aria-hidden="true" className="h-px flex-1 bg-(--line)" />
  </div>
);

// Обгортка сторінки: на мобільних — повноекранна колонка без рамок, від md — картка по центру (max-w 440px)
export const AuthCard = ({ title, subtitle, children }) => (
  <main id="main" className="flex-1 bg-(--surface) md:bg-(--page) md:py-10">
    <div className="mx-auto w-full px-4 py-6 md:max-w-[440px] md:rounded-(--r-lg) md:border md:border-(--line) md:bg-(--surface) md:px-8 md:py-8 md:shadow-(--shadow-2)">
      <h1 className="text-[1.375rem] leading-7 font-bold text-(--ink) md:text-[1.75rem] md:leading-9">{title}</h1>
      {subtitle && <p className="mt-1 text-base text-(--ink-2)">{subtitle}</p>}
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </div>
  </main>
);

// Згоди з тап-зоною ≥44px (стилізуємо ConsentCheckboxes зовні, не змінюючи компонент)
export const ConsentBox = ({ children, innerRef }) => (
  <div
    ref={innerRef}
    className="text-(--ink-2) [&_a]:text-(--brand-ink) [&_input]:mt-0.5 [&_input]:size-5 [&_input]:shrink-0 [&_input]:cursor-pointer [&_input]:accent-(--brand) [&_label]:min-h-11 [&_label]:items-start [&_label]:gap-3 [&_label]:py-2.5"
  >
    {children}
  </div>
);

// Посилання для продавців — нейтральні вторинні, без кольорових літералів
export const SellerLinks = () => {
  const base = import.meta.env.VITE_DASHBOARD_PRODUCTION;
  const cls =
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-(--r-md) border border-(--line) px-3 text-sm font-medium text-(--brand-ink) hover:bg-(--surface-2)";
  return (
    <div className="border-t border-(--line) pt-5">
      <p className="mb-2 text-sm text-(--ink-2)">Ви продавець?</p>
      <div className="flex flex-col gap-2 xs:flex-row">
        <a target="_blank" rel="noopener noreferrer" href={`${base}/login`} className={cls}>
          Вхід для продавця
        </a>
        <a target="_blank" rel="noopener noreferrer" href={`${base}/register`} className={cls}>
          Реєстрація продавця
        </a>
      </div>
    </div>
  );
};

const isEmail =(v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

const RESEND_SECONDS = 60;
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Вхід за одноразовим кодом з e-mail (без пароля): для акаунтів, створених під час оформлення без реєстрації, і для всіх інших.
const OtpLogin = ({ onDone }) => {
  const dispatch = useDispatch();
  const uid = useId();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(0);
  const codeRef = useRef(null);
  const emailRef = useRef(null);

  // Таймер повторної відправки
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // Автофокус на полі коду після відправки
  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const request = async (e) => {
    e?.preventDefault();
    if (busy) return;
    if (!isEmail(email)) {
      setError(email.trim() ? "Перевірте формат e-mail, наприклад name@gmail.com" : "Вкажіть e-mail");
      emailRef.current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/customer/otp/request", { email });
      toast.success(data.message || "Код надіслано");
      setStep("code");
      setCode("");
      setLeft(RESEND_SECONDS);
    } catch (err) {
      setError(err.response?.data?.error || "Не вдалося надіслати код");
    }
    setBusy(false);
  };

  const verify = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setError("Введіть 6 цифр коду з листа");
      codeRef.current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/customer/otp/verify", { email, code });
      dispatch(set_token(data.token));
      toast.success(data.message || "Вхід виконано");
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.error || "Не вдалося увійти");
      setBusy(false);
      codeRef.current?.select();
    }
  };

  return (
    <section aria-labelledby={`${uid}-t`} className="flex flex-col gap-3">
      <div>
        <h2 id={`${uid}-t`} className="text-base font-semibold text-(--ink)">
          Вхід за кодом з e-mail
        </h2>
        <p className="mt-0.5 text-sm text-(--ink-2)">
          Без пароля: надішлемо одноразовий код на пошту. Підходить і для замовлень, оформлених без реєстрації.
        </p>
      </div>
      {step === "email" ? (
        <form onSubmit={request} noValidate className="flex flex-col gap-3">
          <AuthField
            ref={emailRef}
            id={`${uid}-email`}
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@gmail.com"
            value={email}
            error={error}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
          />
          <AuthButton type="submit" variant="secondary" loading={busy} loadingText="Надсилаємо…">
            Отримати код
          </AuthButton>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-3">
          <p className="text-sm text-(--ink-2)" aria-live="polite">
            Код надіслано на <strong className="font-semibold text-(--ink)">{email}</strong>
          </p>
          <AuthField
            ref={codeRef}
            id={`${uid}-code`}
            label="Код з листа"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="••••••"
            value={code}
            error={error}
            className="text-center text-xl font-semibold tracking-[0.5em] tabular-nums"
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (error) setError("");
            }}
          />
          <AuthButton type="submit" loading={busy} loadingText="Перевіряємо…" disabled={code.length !== 6}>
            Увійти
          </AuthButton>
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <button
              type="button"
              onClick={() => request()}
              disabled={left > 0 || busy}
              className="min-h-11 text-sm font-medium text-(--brand-ink) underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-(--ink-2) disabled:no-underline"
            >
              {left > 0 ? `Надіслати ще раз через ${fmt(left)}` : "Надіслати код ще раз"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
                setLeft(0);
              }}
              className="min-h-11 text-sm font-medium text-(--brand-ink) underline-offset-2 hover:underline"
            >
              Змінити e-mail
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default OtpLogin;
