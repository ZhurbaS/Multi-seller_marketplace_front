import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation } from "react-router-dom";
import Stripe from "../components/Stripe";

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
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-[20%] border-r border-[var(--border-payStripe)] cursor-pointer py-8 px-12 ${
                      paymentMethod === "cod"
                        ? "bg-[var(--bg-stripe)]"
                        : "bbg-[var(--bg-notStripe)]"
                    }`}
                  >
                    <div className="flex flex-col gap-[3px] justify-center items-center">
                      <img
                        src="http://localhost:5173/images/payment/cod.jpg"
                        alt=""
                      />
                    </div>
                    <span className="text-[var(--text-pay)]">COD</span>
                  </div>
                </div>

                {paymentMethod === "stripe" && (
                  <div className="">
                    <Stripe />
                  </div>
                )}

                {paymentMethod === "cod" && (
                  <div className="w-full px-4 py-8 bg-[var(--bg-stripe)]">
                    <button className="px-10 py-[6px] rounded-sm hover:shadow-green-500/20 hover:shadow-lg bg-[var(--bg-payBtn)] text-[var(--text-payBtn)]">
                      Оплатити
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="w-5/12 max-md:w-full">
              <div className="pl-2 max-md:pl-0 max-md:mb-0">
                <div className="bg-[var(--bg-pay-rightSection)] shadow p-5 text-[var(--text-pay)] flex flex-col gap-3">
                  <h2 className="font-bold text-lg">Замовлення</h2>
                  <div className="flex justify-between items-center ">
                    <span>{items} Товари з доставкою</span>
                    <span>₴{price} </span>
                  </div>
                  <div className="flex justify-between items-center font-semibold">
                    <span>Всього</span>
                    <span className="text-lg text-[var(--text-payPrice)]">
                      ₴{price}
                    </span>
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
