import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(
  "pk_test_51S8chEJ805TxhqiGs4DZuMVgLXwEwQ5nPjl74hg0D0MbEkNa0vINOy0kvxbVaeVgQwUDPudSwjnznDjv0IOnqfwV00I9JV02sP"
);

const Stripe = ({ orderId, price }) => {
  const [clientSecret, setClientSecret] = useState("");
  const appearance = { theme: "stripe" };

  const options = {
    appearance,
    clientSecret,
  };

  const create_payment = async () => {
    try {
      // console.log("Sending create-payment request...");
      const response = await axios.post(
        "http://localhost:5000/api/order/create-payment",
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
    }
  };

  return (
    <div className="mt-4">
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm orderId={orderId} />
        </Elements>
      ) : (
        <button
          onClick={create_payment}
          className="px-10 py-[6px] rounded-sm hover:shadow-green-700/30 hover:shadow-lg bg-green-700 text-white cursor-pointer"
        >
          Оплатити
        </button>
      )}
    </div>
  );
};

export default Stripe;
