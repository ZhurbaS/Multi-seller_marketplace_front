import React, { useState } from "react";
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { LuLoaderCircle, LuLock, LuTriangleAlert } from "react-icons/lu";
import { getFrontendUrl } from "../api/api";

const CheckoutForm = ({ orderId, price }) => {
  localStorage.setItem("orderId", orderId);

  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const paymentElementOptions = {
    layout: "tabs",
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: getFrontendUrl("/order/confirm"),
      },
    });
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("Неочікувана помилка");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={submit} id="payment-form" className="flex flex-col gap-4" aria-describedby="payment-message">
      <LinkAuthenticationElement id="link-authentication-element" />
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <div id="payment-message" aria-live="polite" role="alert" className="empty:hidden">
        {message && (
          <p className="flex items-start gap-2 text-sm text-(--danger)">
            <LuTriangleAlert size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            {message}
          </p>
        )}
      </div>
      <div
        className="sticky bottom-0 -mx-4 px-4 pt-3 bg-(--surface) sm:static sm:mx-0 sm:px-0 sm:pt-0 sm:bg-transparent"
        style={{ paddingBottom: "max(12px, var(--sab))" }}
      >
        <button
          disabled={isLoading || !stripe || !elements}
          aria-busy={isLoading}
          id="submit"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 w-full sm:w-auto rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) text-base font-semibold disabled:bg-(--cta-disabled) disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <LuLoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <LuLock size={18} aria-hidden="true" />
          )}
          <span id="button-text">
            {isLoading ? "Завантаження..." : price ? `Сплатити ₴${price}` : "Оплатити"}
          </span>
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
