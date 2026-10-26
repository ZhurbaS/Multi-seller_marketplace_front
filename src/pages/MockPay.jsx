import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";

// ТЕСТОВА сторінка оплати (працює лише коли бекенд не в production).
// Імітує платіжну систему: гроші не списуються.
const MockPay = () => {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const finish = async (success) => {
    setLoading(true);
    try {
      await api.post("/pay/mock/complete", { orderId, success });
      navigate(`/order/confirm?orderId=${orderId}`, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || "Помилка тестової оплати");
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-100 px-4">
      <div className="bg-white shadow p-8 max-w-md w-full flex flex-col gap-4 text-center">
        <span className="text-xs uppercase tracking-wide text-orange-600">
          Тестовий режим — гроші не списуються
        </span>
        <h1 className="text-xl font-bold">Імітація оплати</h1>
        <p className="text-sm text-gray-600">
          Замовлення №{orderId?.slice(-8).toUpperCase()}
        </p>
        <button
          disabled={loading}
          onClick={() => finish(true)}
          className="px-5 py-2 bg-green-500 rounded-sm text-white disabled:opacity-60"
        >
          Імітувати успішну оплату
        </button>
        <button
          disabled={loading}
          onClick={() => finish(false)}
          className="px-5 py-2 bg-red-500 rounded-sm text-white disabled:opacity-60"
        >
          Імітувати відмову банку
        </button>
      </div>
    </div>
  );
};

export default MockPay;
