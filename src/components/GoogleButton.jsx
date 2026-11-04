import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { LuLoaderCircle } from "react-icons/lu";
import api from "../api/api";
import { set_token } from "../store/reducers/authSlice";

const SRC = "https://accounts.google.com/gsi/client";

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    let s = document.querySelector(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", reject);
  });
}

// Офіційний логотип «G» (кольори — фірмовий знак Google, змінювати не можна за брендбуком)
const GLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

// Кнопка «Продовжити з Google» (Google Identity Services). Показується лише коли на бекенді задано GOOGLE_CLIENT_ID.
// ID-токен перевіряє сервер. Для нового акаунта потрібна згода (галочка біля кнопки) — acceptLegal.
// Поки скрипт GSI вантажиться — плейсхолдер 48px у фірмовому вигляді (білий фон, рамка, «G»); потім його замінює
// офіційна кнопка Google на всю ширину контейнера (до 400px — обмеження GSI).
const GoogleButton = ({ clientId, acceptLegal, marketing, onDone }) => {
  const box = useRef(null);
  const dispatch = useDispatch();
  const accept = useRef(acceptLegal);
  const mkt = useRef(marketing);
  accept.current = acceptLegal;
  mkt.current = marketing;
  const [status, setStatus] = useState("loading"); // loading | ready | failed
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setBusy(true);
            try {
              const { data } = await api.post("/customer/google", {
                credential,
                acceptLegal: accept.current === true,
                marketing: mkt.current === true,
              });
              dispatch(set_token(data.token));
              toast.success(data.message || "Вхід виконано");
              onDone?.();
            } catch (e) {
              toast.error(e.response?.data?.error || "Не вдалося увійти через Google");
            }
            setBusy(false);
          },
        });
        const w = Math.round(box.current.parentElement?.clientWidth || 320);
        window.google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.max(200, Math.min(400, w)),
          text: "continue_with",
          locale: "uk",
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));
    return () => {
      cancelled = true;
    };
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "failed") {
    return <p className="text-sm text-(--ink-2)">Вхід через Google зараз недоступний. Скористайтеся e-mail.</p>;
  }

  return (
    <div className="relative" aria-busy={status === "loading" || busy || undefined}>
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-base font-medium text-(--ink)"
        >
          <GLogo />
          <span>Продовжити з Google</span>
        </div>
      )}
      <div
        ref={box}
        className={status === "ready" ? "flex min-h-12 w-full items-center justify-center" : "pointer-events-none absolute inset-0 opacity-0"}
      />
      {busy && (
        <p role="status" className="mt-2 flex items-center justify-center gap-2 text-sm text-(--ink-2)">
          <LuLoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
          Входимо через Google…
        </p>
      )}
    </div>
  );
};

export default GoogleButton;
