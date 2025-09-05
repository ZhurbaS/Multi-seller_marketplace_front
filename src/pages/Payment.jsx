import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation } from "react-router-dom";

const Payment = () => {
  const {
    state: { price, items, orderId },
  } = useLocation();

  const [paymentMethod, setPaymentMethod] = useState("stripe");

  return (
    <div>
      <Header />
      <section className="bg-[var(--bg-pay)] ">
        <div className="w-[85%] max-lg:w-[90%] max-md:w-[90%] max-sm:w-[90%] mx-auto py-16 mt-4">
          <div className="flex flex-wrap max-md:flex-col-reverse">
            <div className="w-7/12 max-md:w-full">
              <div className="pr-2 max-md:pr-0">
                <div className="flex flex-wrap">
                  <div
                    onClick={() => setPaymentMethod("stripe")}
                    className={`w-[20%] border-r border-[var(--border-payStripe)] cursor-pointer py-8 px-12 ${
                      paymentMethod === "stripe"
                        ? "bg-[var(--bg-stripe)]"
                        : "bbg-[var(--bg-notStripe)]"
                    }`}
                  >
                    <div className="flex flex-col gap-[3px] justify-center items-center">
                      <img
                        src="http://localhost:5173/images/payment/stripe.png"
                        alt=""
                      />
                    </div>
                    <span className="text-[var(--text-pay)]">Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Payment;
