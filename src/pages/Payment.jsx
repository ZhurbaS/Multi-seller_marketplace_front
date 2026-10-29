import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";

const DESCRIPTIONS = {
  monobank:
    "Ви перейдете на захищену сторінку monobank (картка, Apple Pay, Google Pay). Після оплати повернетеся на сайт.",
  liqpay:
    "Ви перейдете на захищену сторінку LiqPay. Після оплати повернетеся на сайт.",
  mock: "Тестовий режим: гроші не списуються. Ви зможете імітувати успішну або невдалу оплату.",
  invoice:
    "Ми виставимо рахунок на оплату (PDF) і надішлемо його на вашу електронну пошту; він також буде доступний у вашому кабінеті. Сплатіть його переказом на наш IBAN — після надходження коштів замовлення піде в обробку. Рахунок дійсний обмежений час (вказано в рахунку); якщо оплата не надійде, замовлення скасується автоматично.",
  cod: "Оплата готівкою або карткою при отриманні замовлення. Замовлення буде передано в обробку одразу.",
};

// Створює й автоматично відправляє POST-форму (потрібно для LiqPay Checkout).
const submitForm = (url, fields) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.acceptCharset = "utf-8";
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/pay/methods")
      .then(({ data }) => {
        const list = (data.methods || []).filter(
          (m) => !m.businessOnly || state?.buyerKind === "company"
        );
        setMethods(list);
        if (list.length) setPaymentMethod(list[0].id);
      })
      .catch(() => toast.error("Не вдалося завантажити способи оплати"))
      .finally(() => setLoadingMethods(false));
  }, []);

  // Сторінку відкрили напряму (без оформленого замовлення)
  if (!state?.orderId) return <Navigate to="/card" replace />;
  const { price, items, orderId } = state;

  const pay = async () => {
    if (!paymentMethod || loading) return;
    setLoading(true);
    try {
      const { data } = await api.post("/pay/start", {
        orderId,
        method: paymentMethod,
      });
      if (data.type === "invoice") {
        navigate(
          `/order/confirm?orderId=${orderId}&method=invoice&emailed=${data.emailed ? 1 : 0}&number=${encodeURIComponent(data.number || "")}`
        );
      } else if (data.type === "cod") {
        navigate(`/order/confirm?orderId=${orderId}&method=cod`);
      } else if (data.type === "form") {
        submitForm(data.url, data.fields);
      } else if (data.type === "redirect") {
        if (data.internal) {
          navigate(`/pay/mock?orderId=${orderId}`);
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Не вдалося почати оплату. Спробуйте ще раз"
      );
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <section className="bg-[var(--bg-pay)] ">
        <div className="w-[85%] max-lg:w-[90%] max-md:w-[90%] max-sm:w-[90%] mx-auto py-16 mt-4">
          <div className="flex flex-wrap max-md:flex-col-reverse">
            <div className="w-7/12 max-md:w-full">
              <div className="pr-2 max-md:pr-0">
                <h2 className="font-bold text-lg mb-3 text-[var(--text-pay)]">
                  Спосіб оплати
                </h2>

                {loadingMethods ? (
                  <div className="px-4 py-8 bg-[var(--bg-stripe)]">
                    Завантаження...
                  </div>
                ) : methods.length === 0 ? (
                  <div className="px-4 py-8 bg-[var(--bg-stripe)]">
                    Наразі способи оплати недоступні. Зверніться до адміністратора.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {methods.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 border border-[var(--border-payStripe)] cursor-pointer p-4 ${
                          paymentMethod === m.id
                            ? "bg-[var(--bg-stripe)]"
                            : "bg-[var(--bg-notStripe)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                        />
                        <span className="text-[var(--text-pay)]">{m.title}</span>
                      </label>
                    ))}
                  </div>
                )}

                {paymentMethod && (
                  <div className="w-full px-4 py-6 bg-[var(--bg-stripe)] mt-2">
                    <p className="text-sm text-[var(--text-pay)] mb-4">
                      {DESCRIPTIONS[paymentMethod]}
                    </p>
                    <button
                      onClick={pay}
                      disabled={loading}
                      className="px-10 py-[6px] rounded-sm hover:shadow-green-500/20 hover:shadow-lg bg-[var(--bg-payBtn)] text-[var(--text-payBtn)] disabled:opacity-60"
                    >
                      {loading
                        ? "Зачекайте..."
                        : paymentMethod === "cod"
                        ? "Підтвердити замовлення"
                        : paymentMethod === "invoice"
                        ? "Виставити рахунок"
                        : "Оплатити"}
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
                    <span>Товарів: {items} (доставка — окремо, при отриманні)</span>
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
