import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import api from "../api/api";
import { set_token } from "../store/reducers/authSlice";

const inputCls =
  "w-full px-3 py-2 border border-[var(--border-reg)] outline-none focus:border-[var(--border-regFoc)] rounded-md bg-transparent";

// Вхід за одноразовим кодом з e-mail (без пароля): для акаунтів, створених під час оформлення без реєстрації, і для всіх інших.
const OtpLogin = ({ onDone }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/customer/otp/request", { email });
      toast.success(data.message || "Код надіслано");
      setStep("code");
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося надіслати код");
    }
    setBusy(false);
  };

  const verify = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/customer/otp/verify", { email, code });
      dispatch(set_token(data.token));
      toast.success(data.message || "Вхід виконано");
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося увійти");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-[var(--text-reg)]">
      <h3 className="font-semibold">Вхід за кодом з e-mail</h3>
      <p className="text-sm opacity-75">Без пароля: ми надішлемо одноразовий код на вашу пошту. Підходить і для замовлень, оформлених без реєстрації.</p>
      {step === "email" ? (
        <form onSubmit={request} className="flex flex-col gap-2">
          <input className={inputCls} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={busy} className="px-8 w-full py-2 border border-[var(--border-reg)] rounded-md disabled:opacity-60">
            Отримати код
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-2">
          <input
            className={inputCls}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            placeholder="6-значний код"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button disabled={busy || code.length !== 6} className="px-8 w-full py-2 bg-[var(--bg-regBtn)] text-[var(--text-regBtn)] rounded-md disabled:opacity-60">
            Увійти
          </button>
          <button type="button" onClick={() => { setStep("email"); setCode(""); }} className="text-sm underline self-start">
            Інша адреса / надіслати ще раз
          </button>
        </form>
      )}
    </div>
  );
};

export default OtpLogin;
