import React, { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
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

// Кнопка «Увійти через Google» (Google Identity Services). Показується лише коли на бекенді задано GOOGLE_CLIENT_ID.
// ID-токен перевіряє сервер. Для нового акаунта потрібна згода (галочка біля кнопки) — acceptLegal.
const GoogleButton = ({ clientId, acceptLegal, marketing, onDone }) => {
  const box = useRef(null);
  const dispatch = useDispatch();
  const accept = useRef(acceptLegal);
  const mkt = useRef(marketing);
  accept.current = acceptLegal;
  mkt.current = marketing;

  useEffect(() => {
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
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
          },
        });
        window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", width: 280, text: "continue_with", locale: "uk" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className="flex justify-center min-h-[44px]" />;
};

export default GoogleButton;
