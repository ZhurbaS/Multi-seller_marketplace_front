import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { get_orders } from "../../store/reducers/orderSlice";
import { INVOICE_STATUS } from "../../utils/invoice";
import { payLabel, deliveryLabel, orderNo, formatDate, statusBadge } from "../../utils/statusLabels";

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
  ["30", "Останні 30 днів"],
  ["90", "Останні 3 місяці"],
  ["365", "Останній рік"],
];

const ymd = (d) => d.toISOString().slice(0, 10);

const selectCls =
  "outline-none px-3 py-2 border border-[var(--border-myOrders)] rounded-md text-[var(--text-myOrders)] bg-transparent text-sm";

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
    <div className="bg-[var(--bg-myOrders)] p-4 rounded-md">
      <h2 className="text-xl font-semibold text-[var(--text-myOrders)] mb-3">Мої замовлення</h2>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          inputMode="numeric"
          placeholder="Пошук за номером"
          className={`${selectCls} w-[180px]`}
        />
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
          {STATUSES.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        <select className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Період">
          {PERIODS.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        {filtered && (
          <button
            onClick={() => {
              setStatus("all");
              setPeriod("all");
              setQ("");
            }}
            className="text-sm underline text-[var(--text-myOrders)]"
          >
            Скинути
          </button>
        )}
      </div>

      {myOrders.length === 0 && !loading && !errorMessage && (
        <div className="mt-6 text-center text-[var(--text-myOrders)]">
          {filtered ? "За вибраними умовами замовлень не знайдено." : "У вас ще немає замовлень."}
        </div>
      )}

      {myOrders.length > 0 && (
        <div className="pt-4">
          <div className="relative overflow-x-auto rounded-md">
            <table className="w-full text-sm text-left text-[var(--text-indexTable)]">
              <thead className="text-xs text-[var(--text-indexTableSec)] uppercase bg-[var(--bg-indexTable)]">
                <tr>
                  <th className="px-4 py-3">Замовлення</th>
                  <th className="px-4 py-3">Сума</th>
                  <th className="px-4 py-3">Оплата</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o) => (
                  <tr key={o._id} className="bg-[var(--bg-indexTableSec)] border-b border-[var(--border-indexTable)]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={`/dashboard/order/details/${o._id}`} className="font-semibold underline">
                        {orderNo(o)}
                      </Link>
                      <div className="text-xs opacity-70">{formatDate(o.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">₴{o.price}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {payLabel(o.payment_status)}
                      {o.invoice?.number && (
                        <div className="text-xs opacity-80">
                          Рахунок {o.invoice.number}: {INVOICE_STATUS[o.invoice.status] || ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-[2px] rounded-full text-xs font-semibold ${statusBadge(o.delivery_status)}`}>
                        {deliveryLabel(o.delivery_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link to={`/dashboard/order/details/${o._id}`}>
                        <span className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] font-semibold mr-2 px-3 py-[2px] rounded">
                          Переглянути
                        </span>
                      </Link>
                      {o.payment_status !== "paid" &&
                        o.payment_method !== "cod" &&
                        o.payment_method !== "invoice" &&
                        o.delivery_status !== "cancelled" && (
                          <span
                            onClick={() => redirect(o)}
                            className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] font-semibold px-3 py-[2px] rounded cursor-pointer"
                          >
                            Оплатити
                          </span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
