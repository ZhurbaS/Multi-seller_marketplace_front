import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { get_my_returns, get_return_policy } from "../../store/reducers/returnSlice";
import { orderNo } from "../../utils/statusLabels";
import { RETURN_STATUS, RETURN_REASON, fmtDate } from "../../utils/returnLabels";
import { Badge, Field, PageHeader } from "./Kit";
import { btnDanger, btnPrimary, cardCls, fullMobile, inputCls, returnTone } from "./ui";

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
    <article className={`${cardCls} p-4 md:p-5 text-(--ink) flex flex-col gap-3`}>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold">
            Заявка {r.number} <span className="text-sm font-normal text-(--ink-2)">від {fmtDate(r.createdAt)}</span>
          </h2>
          <div className="text-sm text-(--ink-2)">
            {r.kind === "cancellation" ? "Скасування замовлення" : "Повернення товару"} ·{" "}
            {RETURN_REASON[r.reason] || r.reason}
          </div>
        </div>
        <Badge wrap tone={returnTone(r.status)} className="shrink-0 max-w-[45%] text-right">
          {r.kind === "cancellation" && r.status === "refunded" && !(r.refund?.amount > 0)
            ? "Замовлення скасовано"
            : RETURN_STATUS[r.status] || r.status}
        </Badge>
      </div>

      <ul className="text-sm divide-y divide-(--line) border-y border-(--line)">
        {r.items.map((i, k) => (
          <li key={k} className="flex justify-between gap-3 py-2">
            <span className="min-w-0 break-words">
              {i.name} <span className="text-(--ink-2)">× {i.quantity}</span>
            </span>
            <span className="price font-semibold whitespace-nowrap">₴{i.value}</span>
          </li>
        ))}
      </ul>
      <div className="text-sm">
        Замовлення:{" "}
        <Link className="font-semibold text-(--brand-ink) underline" to={`/dashboard/order/details/${r.orderId}`}>
          {orderNo({ orderNumber: r.orderNumber, _id: r.orderId })}
        </Link>
      </div>

      {r.decision?.rejectReason && (
        <p className="text-sm text-(--danger)">Причина відмови: {r.decision.rejectReason}</p>
      )}
      {r.decision?.note && <p className="text-sm">Коментар магазину: {r.decision.note}</p>}

      {r.status === "shipped" && r.shipment?.ttn && (
        <p className="text-sm">
          Накладна: {r.shipment.carrier} {r.shipment.ttn}
        </p>
      )}
      {r.status === "approved" && r.kind === "return" && (
        <div className="text-sm bg-(--brand-soft) p-3 rounded-(--r-md)">
          <p className="font-semibold">Надішліть товар за адресою:</p>
          <p className="whitespace-pre-line">{returnAddress || "Адресу уточніть у підтримки"}</p>
          <p className="mt-1">
            Товар має бути в незміненому стані та в комплекті. Після відправлення вкажіть номер накладної.
          </p>
        </div>
      )}

      {canShip && (
        <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)_auto] gap-3 md:items-end">
          <Field label="Перевізник">
            {(a) => (
              <select {...a} value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputCls}>
                <option>Нова пошта</option>
                <option>Укрпошта</option>
                <option>Інший перевізник</option>
              </select>
            )}
          </Field>
          <Field label="Номер накладної (ТТН)">
            {(a) => (
              <input
                {...a}
                value={ttn}
                inputMode="numeric"
                autoComplete="off"
                onChange={(e) => setTtn(e.target.value)}
                className={inputCls}
              />
            )}
          </Field>
          <button
            type="button"
            disabled={busy || ttn.trim().length < 5}
            onClick={() => act(() => api.put(`/home/returns/${r._id}/shipment`, { carrier, ttn: ttn.trim() }))}
            className={`${btnPrimary} ${fullMobile} min-h-12`}
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
        <p className="text-sm text-(--ink-2)">Кошти будуть повернені не пізніше {fmtDate(r.refundDueAt)}.</p>
      )}
      {contactInfo && <p className="text-sm text-(--ink-2)">Питання: {contactInfo}</p>}

      {canCancel && (
        <button
          disabled={busy}
          onClick={() => window.confirm("Відкликати заявку?") && act(() => api.put(`/home/returns/${r._id}/cancel`))}
          className={`${btnDanger} ${fullMobile} self-start`}
        >
          Відкликати заявку
        </button>
      )}
    </article>
  );
};

const Returns = () => {
  const dispatch = useDispatch();
  const { requests, cabinetVisible, loaded, policy } = useSelector((s) => s.returns);

  const load = () => dispatch(get_my_returns());
  useEffect(() => {
    load();
    dispatch(get_return_policy());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Мої повернення" />
      {!cabinetVisible ? (
        <p className={`${cardCls} p-5 text-(--ink-2)`}>
          Перегляд заявок у кабінеті наразі недоступний. З питань повернення зверніться до підтримки магазину.
        </p>
      ) : !loaded ? null : requests.length === 0 ? (
        <p className={`${cardCls} p-5 text-(--ink-2)`}>
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
