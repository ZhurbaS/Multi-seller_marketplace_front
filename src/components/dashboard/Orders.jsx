import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
import { get_orders } from "../../store/reducers/orderSlice";
import { INVOICE_STATUS } from "../../utils/invoice";
import { payLabel, deliveryLabel, orderNo, formatDate } from "../../utils/statusLabels";
import { Badge, PageHeader } from "./Kit";
import OrderCard from "./OrderCard";
import { btnCta, btnSecondary, canPayOrder, cardCls, chipCls, deliveryTone, inputCls } from "./ui";

const STATUSES = [
  ["all", "Усі статуси"],
  ["pending", "Очікує обробки"],
  ["placed", "Розміщено"],
  ["processing", "Опрацьовується"],
  ["packing", "Готується до відправки"],
  ["shipped", "Відправлено"],
  ["delivered", "Доставлено"],
  ["cancelled", "Скасовано"],
];

const PERIODS = [
  ["all", "Увесь час"],
  ["7", "7 днів"],
  ["14", "14 днів"],
  ["30", "30 днів"],
  ["90", "3 місяці"],
  ["365", "Рік"],
];

const ymd = (d) => d.toISOString().slice(0, 10);

const ChipGroup = ({ label, options, value, onChange }) => (
  <div role="group" aria-label={label} className="flex flex-col gap-1 min-w-0">
    <span className="text-sm font-medium text-(--ink)">{label}</span>
    {/* Мобільні — рядок зі скролом (лише всередині рядка), від md — перенос */}
    <div className="no-scrollbar flex gap-2 overflow-x-auto snap-x snap-proximity overscroll-x-contain *:shrink-0 *:snap-start -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
      {options.map(([v, t]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={chipCls(value === v)}>
          {t}
        </button>
      ))}
    </div>
  </div>
);

const Orders = () => {
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { myOrders, errorMessage, loading } = useSelector((state) => state.order);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!userInfo?.id) return;
    const from = period === "all" ? "" : ymd(new Date(Date.now() - Number(period) * 24 * 3600 * 1000));
    dispatch(get_orders({ status, customerId: userInfo.id, from, q: qDebounced }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, period, qDebounced]);

  const redirect = (o) => {
    const items = o.products.reduce((sum, p) => sum + p.quantity, 0);
    navigate("/payment", {
      state: { price: o.price, items, orderId: o._id, buyerKind: o.buyer?.kind || "individual" },
    });
  };

  const filtered = status !== "all" || period !== "all" || qDebounced;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Мої замовлення" />

      <div className={`${cardCls} p-4 flex flex-col gap-4`}>
        <div className="flex flex-col gap-1 md:max-w-[320px]">
          <label htmlFor="orders-q" className="text-sm font-medium text-(--ink)">
            Пошук за номером
          </label>
          <div className="relative">
            <LuSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-(--ink-2)" />
            <input
              id="orders-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputMode="numeric"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Наприклад, 10234"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>
        <ChipGroup label="Період" options={PERIODS} value={period} onChange={setPeriod} />
        <ChipGroup label="Статус" options={STATUSES} value={status} onChange={setStatus} />
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setPeriod("all");
              setQ("");
            }}
            className="tap self-start -ml-3 px-3 text-sm font-semibold text-(--brand-ink) underline"
          >
            Скинути фільтри
          </button>
        )}
      </div>

      {myOrders.length === 0 && !loading && !errorMessage && (
        <div className={`${cardCls} p-6 text-center text-(--ink-2)`}>
          {filtered ? "За вибраними умовами замовлень не знайдено." : "У вас ще немає замовлень."}
        </div>
      )}

      {myOrders.length > 0 && (
        <>
          {/* Мобільні: картки */}
          <ul className="md:hidden flex flex-col gap-3">
            {myOrders.map((o) => (
              <li key={o._id}>
                <OrderCard o={o} canPay={canPayOrder(o)} onPay={redirect} />
              </li>
            ))}
          </ul>

          {/* Від md: таблиця */}
          <div className={`hidden md:block ${cardCls} overflow-hidden`}>
            <table className="w-full text-sm text-left text-(--ink)">
              <thead className="text-xs uppercase text-(--ink-2) bg-(--surface-2)">
                <tr>
                  <th scope="col" className="px-4 py-3">Замовлення</th>
                  <th scope="col" className="px-4 py-3">Сума</th>
                  <th scope="col" className="px-4 py-3">Оплата</th>
                  <th scope="col" className="px-4 py-3">Статус</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Дії</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--line)">
                {myOrders.map((o) => (
                  <tr key={o._id} className="bg-(--surface)">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={`/dashboard/order/details/${o._id}`} className="font-semibold text-(--brand-ink) hover:underline">
                        {orderNo(o)}
                      </Link>
                      <div className="text-xs text-(--ink-2)">{formatDate(o.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold price">₴{o.price}</td>
                    <td className="px-4 py-3">
                      {payLabel(o.payment_status)}
                      {o.invoice?.number && (
                        <div className="text-xs text-(--ink-2)">
                          Рахунок {o.invoice.number}: {INVOICE_STATUS[o.invoice.status] || ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={deliveryTone(o.delivery_status)}>{deliveryLabel(o.delivery_status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end flex-wrap gap-2">
                        <Link to={`/dashboard/order/details/${o._id}`} className={`${btnSecondary} px-3`}>
                          Переглянути
                        </Link>
                        {canPayOrder(o) && (
                          <button type="button" onClick={() => redirect(o)} className={`${btnCta} px-3`}>
                            Оплатити
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
