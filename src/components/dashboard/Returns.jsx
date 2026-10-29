import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { get_my_returns, get_return_policy } from "../../store/reducers/returnSlice";
import { RETURN_STATUS, RETURN_REASON, RETURN_STATUS_COLOR, fmtDate } from "../../utils/returnLabels";

const Card = ({ r, onChanged, returnAddress, contactInfo }) => {
  const [ttn, setTtn] = useState(r.shipment?.ttn || "");
  const [carrier, setCarrier] = useState(r.shipment?.carrier || "Нова пошта");
  const [busy, setBusy] = useState(false);

  const act = async (fn) => {
    setBusy(true);
    try {
      const { data } = await fn();
      toast.success(data.message || "Готово");
      onChanged();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося виконати дію");
    } finally {
      setBusy(false);
    }
  };

  const canShip = r.status === "approved" && r.kind === "return";
  const canCancel = ["requested", "approved"].includes(r.status);

  return (
    <div className="border border-slate-300 rounded-md p-4 text-[var(--text-myOrders)] flex flex-col gap-2">
      <div className="flex justify-between flex-wrap gap-2">
        <div>
          <span className="font-semibold">{r.number}</span>{" "}
          <span className="text-sm opacity-70">від {fmtDate(r.createdAt)}</span>
          <div className="text-sm">
            {r.kind === "cancellation" ? "Скасування замовлення" : "Повернення товару"} ·{" "}
            {RETURN_REASON[r.reason] || r.reason}
          </div>
        </div>
        <span className={`h-fit px-3 py-1 text-xs rounded-md ${RETURN_STATUS_COLOR[r.status] || "bg-gray-200"}`}>
          {r.kind === "cancellation" && r.status === "refunded" && !(r.refund?.amount > 0)
            ? "Замовлення скасовано"
            : RETURN_STATUS[r.status] || r.status}
        </span>
      </div>

      <ul className="text-sm list-disc pl-5">
        {r.items.map((i, k) => (
          <li key={k}>
            {i.name} × {i.quantity} — ₴{i.value}
          </li>
        ))}
      </ul>
      <div className="text-sm">
        Замовлення:{" "}
        <Link className="underline" to={`/dashboard/order/details/${r.orderId}`}>
          #{String(r.orderId).slice(-8).toUpperCase()}
        </Link>
      </div>

      {r.decision?.rejectReason && (
        <p className="text-sm text-red-700">Причина відмови: {r.decision.rejectReason}</p>
      )}
      {r.decision?.note && <p className="text-sm">Коментар магазину: {r.decision.note}</p>}

      {r.status === "shipped" && r.shipment?.ttn && (
        <p className="text-sm">
          Накладна: {r.shipment.carrier} {r.shipment.ttn}
        </p>
      )}
      {r.status === "approved" && r.kind === "return" && (
        <div className="text-sm bg-blue-50 p-3 rounded">
          <p className="font-semibold">Надішліть товар за адресою:</p>
          <p className="whitespace-pre-line">{returnAddress || "Адресу уточніть у підтримки"}</p>
          <p className="mt-1">
            Товар має бути в незміненому стані та в комплекті. Після відправлення вкажіть номер накладної.
          </p>
        </div>
      )}

      {canShip && (
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          >
            <option>Нова пошта</option>
            <option>Укрпошта</option>
            <option>Інший перевізник</option>
          </select>
          <input
            value={ttn}
            onChange={(e) => setTtn(e.target.value)}
            placeholder="Номер накладної (ТТН)"
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          />
          <button
            disabled={busy || ttn.trim().length < 5}
            onClick={() => act(() => api.put(`/home/returns/${r._id}/shipment`, { carrier, ttn: ttn.trim() }))}
            className="px-3 py-1 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] text-sm rounded disabled:opacity-50"
          >
            Зберегти ТТН
          </button>
        </div>
      )}

      {(r.refund?.status === "success" || r.refund?.amount > 0) && (
        <div className="text-sm">
          {r.status === "refunded" ? "Повернено" : "До повернення"}: <b>₴{r.refund.amount}</b>
          {r.refund.deduction > 0 && (
            <span> (утримано ₴{r.refund.deduction}: {r.refund.deductionReason || "—"})</span>
          )}
          {r.refund.shippingCost > 0 && <span> (зворотна доставка ₴{r.refund.shippingCost})</span>}
          {r.refund.refundedAt && <span> · {fmtDate(r.refund.refundedAt)}</span>}
        </div>
      )}
      {r.refundDueAt && r.status === "refund_pending" && (
        <p className="text-xs opacity-70">Кошти будуть повернені не пізніше {fmtDate(r.refundDueAt)}.</p>
      )}
      {contactInfo && <p className="text-xs opacity-70">Питання: {contactInfo}</p>}

      {canCancel && (
        <button
          disabled={busy}
          onClick={() => window.confirm("Відкликати заявку?") && act(() => api.put(`/home/returns/${r._id}/cancel`))}
          className="self-start px-3 py-1 border text-sm rounded"
        >
          Відкликати заявку
        </button>
      )}
    </div>
  );
};

const Returns = () => {
  const dispatch = useDispatch();
  const { requests, cabinetVisible, loaded, policy } = useSelector((s) => s.returns);

  const load = () => dispatch(get_my_returns());
  useEffect(() => {
    load();
    dispatch(get_return_policy());
  }, []);

  return (
    <div className="bg-[var(--bg-myOrders)] p-4 rounded-md flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-[var(--text-myOrders)]">Мої повернення</h2>
      {!cabinetVisible ? (
        <p className="text-[var(--text-myOrders)]">
          Перегляд заявок у кабінеті наразі недоступний. З питань повернення зверніться до підтримки магазину.
        </p>
      ) : !loaded ? null : requests.length === 0 ? (
        <p className="text-[var(--text-myOrders)]">
          У вас ще немає заявок. Подати заявку можна на сторінці замовлення («Мої замовлення» → замовлення).
        </p>
      ) : (
        requests.map((r) => (
          <Card
            key={r._id}
            r={r}
            onChanged={load}
            returnAddress={policy?.returnAddress}
            contactInfo={policy?.contactInfo}
          />
        ))
      )}
    </div>
  );
};

export default Returns;
