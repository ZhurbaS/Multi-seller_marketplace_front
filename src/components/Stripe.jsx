import React, { useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { LuLoaderCircle, LuLock } from "react-icons/lu";
import CheckoutForm from "./CheckoutForm";
import { getApiUrl } from "../utils/apiRoutes";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe Elements не розуміє CSS-змінні — читаємо фактичні значення токенів теми.
const token = (name, fallback) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
};

const Stripe = ({ orderId, price }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const appearance = useMemo(
    () => ({
      theme: "stripe",
      variables: {
        colorPrimary: token("--brand", "#1f5fd6"),
        colorBackground: token("--surface", "#ffffff"),
        colorText: token("--ink", "#0f172a"),
        colorTextSecondary: token("--ink-2", "#4a5568"),
        colorDanger: token("--danger", "#c62828"),
        fontFamily: "Inter, system-ui, sans-serif",
        fontSizeBase: "16px",
        borderRadius: "10px",
        spacingUnit: "4px",
      },
      rules: {
        // поле 48px
        ".Input": {
          padding: "13px 12px",
          borderColor: token("--line-strong", "#8b95a7"),
          boxShadow: "none",
        },
        ".Tab": { minHeight: "48px" },
        ".Label": { fontWeight: "500" },
      },
    }),
    []
  );

  const options = {
    appearance,
    clientSecret,
  };

  const create_payment = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      // console.log("Sending create-payment request...");
      const response = await axios.post(
        getApiUrl("/api/order/create-payment"),
        { price },
        { withCredentials: true }
      );

      // console.log("Response from server:", response);
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      if (error.response) {
        console.log(
          "Server responded with error:",
          error,
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        console.log("No response received:", error.request);
      } else {
        console.log("Axios error:", error.message);
      }
      setError(error.response?.data?.error || "Не вдалося підготувати оплату. Спробуйте ще раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm orderId={orderId} price={price} />
        </Elements>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={create_payment}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 w-full sm:w-auto rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) text-base font-semibold disabled:bg-(--cta-disabled) disabled:cursor-not-allowed"
          >
            {loading ? (
              <LuLoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <LuLock size={18} aria-hidden="true" />
            )}
            {loading ? "Зачекайте..." : price ? `Сплатити ₴${price}` : "Оплатити"}
          </button>
          <p aria-live="polite" className="text-sm text-(--danger) empty:hidden">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default Stripe;
