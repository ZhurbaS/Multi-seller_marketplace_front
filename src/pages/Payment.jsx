import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LuChevronDown, LuLoaderCircle, LuLock } from "react-icons/lu";
import api from "../api/api";
import InvoiceChannelPick from "../components/InvoiceChannelPick";

const DESCRIPTIONS = {
  monobank:
    "Ви перейдете на захищену сторінку monobank (картка, Apple Pay, Google Pay). Після оплати повернетеся на сайт.",
  liqpay:
    "Ви перейдете на захищену сторінку LiqPay. Після оплати повернетеся на сайт.",
  mock: "Тестовий режим: гроші не списуються. Ви зможете імітувати успішну або невдалу оплату.",
  invoice:
    "Ми виставимо рахунок (PDF) з реквізитами й надішлемо його обраним вами способом (e-mail, Viber або WhatsApp); він також буде в кабінеті. Сплатіть його переказом на наш IBAN у будь-якому банківському застосунку або в касі, вказавши призначення платежу з рахунку. Додаткових комісій від магазину немає. Після надходження коштів замовлення піде в обробку. Рахунок дійсний обмежений час (вказано в рахунку); якщо оплата не надійде, замовлення скасується автоматично, а товар повернеться в продаж.",
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

const pluralItems = (n) =>
  n === 1 ? "товар" : n >= 2 && n <= 4 ? "товари" : "товарів";

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loading, setLoading] = useState(false);
  const [invoiceChannel, setInvoiceChannel] = useState("email");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    api
      .get("/pay/methods")
      .then(({ data }) => {
        const list = data.methods || [];
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
    setPayError("");
    try {
      const { data } = await api.post("/pay/start", {
        orderId,
        method: paymentMethod,
        invoiceChannel,
      });
      if (data.type === "invoice") {
        navigate(
          `/order/confirm?orderId=${orderId}&method=invoice&emailed=${data.emailed ? 1 : 0}&channel=${data.channel || "email"}&number=${encodeURIComponent(data.number || "")}`
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
      const msg = error.response?.data?.error || "Не вдалося почати оплату. Спробуйте ще раз";
      toast.error(msg);
      setPayError(msg);
      setLoading(false);
    }
  };

  const payLabel =
    paymentMethod === "cod"
      ? "Підтвердити замовлення"
      : paymentMethod === "invoice"
      ? "Виставити рахунок"
      : `Сплатити ₴${price}`;

  const payButton = (className = "") => (
    <button
      type="button"
      onClick={pay}
      disabled={loading || !paymentMethod}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 h-12 px-6 rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) text-base font-semibold disabled:bg-(--cta-disabled) disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <LuLoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" />
          Зачекайте...
        </>
      ) : (
        <>
          {paymentMethod !== "cod" && paymentMethod !== "invoice" && <LuLock size={18} aria-hidden="true" />}
          {payLabel}
        </>
      )}
    </button>
  );

  const showPay = !loadingMethods && methods.length > 0 && paymentMethod;

  return (
    <div className={showPay ? "pb-[calc(76px+var(--sab))] lg:pb-0" : ""}>
      <Header />
      <section className="bg-(--page)">
        <div className="container-x pt-4 pb-8 lg:pt-6 lg:pb-12">
          <h1 className="text-[1.375rem] leading-7 md:text-[1.75rem] md:leading-9 font-bold text-(--ink) mb-4">
            Оплата замовлення
          </h1>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
            {/* Зведення: на мобільних — згорнутий акордеон, від lg — праворуч, липке */}
            <aside
              aria-label="Зведення замовлення"
              className="lg:order-2 lg:sticky lg:top-[calc(var(--header-h)+16px)] self-start w-full"
            >
              <div className="bg-(--surface) border border-(--line) rounded-(--r-lg) text-(--ink)">
                <button
                  type="button"
                  onClick={() => setSummaryOpen((v) => !v)}
                  aria-expanded={summaryOpen}
                  aria-controls="pay-summary"
                  className="lg:hidden w-full min-h-14 px-4 flex items-center justify-between gap-3 text-left"
                >
                  <span className="font-semibold">
                    Замовлення · {items} {pluralItems(items)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="price font-bold">₴{price}</span>
                    <LuChevronDown
                      size={20}
                      aria-hidden="true"
                      className={`motion-safe:transition-transform ${summaryOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                <h2 className="hidden lg:block px-4 pt-4 text-lg md:text-[1.375rem] font-bold">Замовлення</h2>
                <div
                  id="pay-summary"
                  className={`${summaryOpen ? "flex" : "hidden"} lg:flex flex-col gap-2 px-4 pb-4 pt-1 lg:pt-3 border-t border-(--line) lg:border-t-0`}
                >
                  <dl className="flex flex-col gap-2 text-[0.9375rem] pt-2 lg:pt-0">
                    <div className="flex justify-between gap-3">
                      <dt>Товарів: {items}</dt>
                      <dd className="price">₴{price}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Доставка</dt>
                      <dd className="text-right text-(--ink-2)">окремо, при отриманні</dd>
                    </div>
                  </dl>
                  <div className="flex justify-between items-baseline gap-3 pt-3 border-t border-(--line)">
                    <span className="font-semibold">Всього</span>
                    <span className="price text-[1.375rem] font-bold text-(--price)">₴{price}</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="lg:order-1 min-w-0 flex flex-col gap-3">
              <fieldset className="flex flex-col gap-2">
                <legend className="font-bold text-lg text-(--ink) mb-2">Спосіб оплати</legend>

                {loadingMethods ? (
                  <div className="px-4 py-8 rounded-(--r-lg) bg-(--surface) border border-(--line) text-(--ink-2) flex items-center gap-2" role="status">
                    <LuLoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" />
                    Завантаження...
                  </div>
                ) : methods.length === 0 ? (
                  <div className="px-4 py-8 rounded-(--r-lg) bg-(--surface) border border-(--line) text-(--ink-2)" role="status">
                    Наразі способи оплати недоступні. Зверніться до адміністратора.
                  </div>
                ) : (
                  methods.map((m) => {
                    const active = paymentMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-start gap-3 min-h-14 p-4 rounded-(--r-lg) border cursor-pointer bg-(--surface) ${
                          active ? "border-(--brand) ring-1 ring-(--brand)" : "border-(--line) hover:border-(--line-strong)"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="mt-1 w-5 h-5 shrink-0 accent-(--brand)"
                          checked={active}
                          onChange={() => {
                            setPaymentMethod(m.id);
                            setPayError("");
                          }}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-(--ink)">{m.title}</span>
                          {active && DESCRIPTIONS[m.id] && (
                            <span className="block mt-1 text-sm text-(--ink-2)">{DESCRIPTIONS[m.id]}</span>
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </fieldset>

              {paymentMethod === "invoice" && (
                <div className="px-4 py-3 rounded-(--r-lg) bg-(--surface) border border-(--line) text-sm text-(--ink)">
                  <InvoiceChannelPick value={invoiceChannel} onChange={setInvoiceChannel} />
                </div>
              )}

              <p aria-live="polite" className="text-sm text-(--danger) min-h-0 empty:hidden">
                {payError}
              </p>

              {showPay && payButton("hidden lg:inline-flex self-start min-w-[260px]")}
            </div>
          </div>
        </div>
      </section>
      <Footer />

      {/* Липка кнопка оплати (мобільні/планшети) */}
      {showPay && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-(--surface) border-t border-(--line) shadow-(--shadow-3)"
          style={{ paddingBottom: "max(12px, var(--sab))" }}
        >
          <div className="container-x pt-3 min-h-16 flex">
            {payButton("w-full")}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
