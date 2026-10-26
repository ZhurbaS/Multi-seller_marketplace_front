import React, { useEffect, useRef, useState } from "react";
import errorImg from "../assets/error.png";
import successImg from "../assets/success.png";
import { Link, useSearchParams } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import api from "../api/api";

// Сторінка, на яку покупець повертається після оплати (monobank/LiqPay/тест) або
// після вибору «Оплата при отриманні». Статус завжди перевіряємо на сервері
// (вебхук міг ще не дійти — тоді кілька разів перепитуємо).
const MAX_ATTEMPTS = 8;
const RETRY_MS = 2500;

const ConfirmOrder = () => {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const isCod = params.get("method") === "cod";

  // loading | paid | cod | failed | pending
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
    let timer;
    let cancelled = false;

    const check = async () => {
      try {
        const { data } = await api.get(`/pay/verify/${orderId}`);
        if (cancelled) return;
        if (data.payment_status === "paid") return setResult("paid");
        if (data.state === "failed") return setResult("failed");
      } catch (_) {
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
  }, [orderId, isCod]);

  const toDashboard = (
    <Link
      className="px-5 py-2 bg-green-500 rounded-sm text-white"
      to="/dashboard/my-orders"
    >
      До моїх замовлень
    </Link>
  );

  return (
    <div className="w-screen h-screen flex justify-center items-center flex-col gap-4 px-4 text-center">
      {result === "loading" && (
        <>
          <FadeLoader />
          <p>Перевіряємо оплату...</p>
        </>
      )}
      {result === "paid" && (
        <>
          <img src={successImg} alt="Оплата успішна" />
          <p>Оплату отримано. Дякуємо за замовлення!</p>
          {toDashboard}
        </>
      )}
      {result === "cod" && (
        <>
          <img src={successImg} alt="Замовлення оформлено" />
          <p>Замовлення оформлено. Оплата — при отриманні.</p>
          {toDashboard}
        </>
      )}
      {result === "pending" && (
        <>
          <p>
            Оплата ще обробляється. Статус оновиться в «Моїх замовленнях» протягом
            кількох хвилин.
          </p>
          {toDashboard}
        </>
      )}
      {result === "failed" && (
        <>
          <img src={errorImg} alt="Помилка оплати" />
          <p>Оплата не пройшла. Ви можете спробувати ще раз із розділу «Мої замовлення».</p>
          {toDashboard}
        </>
      )}
    </div>
  );
};

export default ConfirmOrder;
