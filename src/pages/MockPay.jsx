import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { LuFlaskConical, LuLoaderCircle } from "react-icons/lu";
import api from "../api/api";
import { orderNo } from "../utils/statusLabels";

// ТЕСТОВА сторінка оплати (працює лише коли бекенд не в production).
// Імітує платіжну систему: гроші не списуються.
const MockPay = () => {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // null | "ok" | "fail"
  const [error, setError] = useState("");

  const finish = async (success) => {
    setLoading(success ? "ok" : "fail");
    setError("");
    try {
      await api.post("/pay/mock/complete", { orderId, success });
      navigate(`/order/confirm?orderId=${orderId}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || "Помилка тестової оплати";
      toast.error(msg);
      setError(msg);
      setLoading(null);
    }
  };

  const spinner = <LuLoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" />;

  return (
    <main className="min-h-dvh flex items-start sm:items-center justify-center bg-(--page) px-4 py-8">
      <div className="bg-(--surface) border border-(--line) rounded-(--r-lg) shadow-(--shadow-2) p-5 sm:p-8 max-w-md w-full flex flex-col gap-4 text-center text-(--ink)">
        <span className="self-center inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--surface-2) text-xs font-semibold uppercase tracking-wide text-(--warning)">
          <LuFlaskConical size={16} aria-hidden="true" />
          Тестовий режим — гроші не списуються
        </span>
        <h1 className="text-[1.375rem] leading-7 font-bold">Імітація оплати</h1>
        <p className="text-sm text-(--ink-2)">
          Оплата замовлення{orderId ? ` ${orderNo({ _id: orderId })}` : ""}
        </p>
        <button
          type="button"
          disabled={!!loading}
          aria-busy={loading === "ok"}
          onClick={() => finish(true)}
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) font-semibold disabled:bg-(--cta-disabled) disabled:cursor-not-allowed"
        >
          {loading === "ok" && spinner}
          Імітувати успішну оплату
        </button>
        <button
          type="button"
          disabled={!!loading}
          aria-busy={loading === "fail"}
          onClick={() => finish(false)}
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-(--r-md) bg-(--danger) text-(--on-danger) font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading === "fail" && spinner}
          Імітувати відмову банку
        </button>
        <p aria-live="polite" className="text-sm text-(--danger) empty:hidden">
          {error}
        </p>
      </div>
    </main>
  );
};

export default MockPay;
