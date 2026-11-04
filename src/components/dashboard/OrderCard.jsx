import React from "react";
import { Link } from "react-router-dom";
import { payLabel, deliveryLabel, orderNo, formatDate } from "../../utils/statusLabels";
import { INVOICE_STATUS } from "../../utils/invoice";
import { Badge } from "./Kit";
import { btnCta, btnSecondary, cardCls, deliveryTone } from "./ui";

// Картка замовлення (список замовлень на мобільних, останні замовлення на огляді)
const OrderCard = ({ o, canPay, onPay }) => (
  <article className={`${cardCls} p-4 flex flex-col gap-3`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <Link
          to={`/dashboard/order/details/${o._id}`}
          className="font-semibold text-(--ink) hover:underline"
        >
          Замовлення {orderNo(o)}
        </Link>
        {o.createdAt && <p className="text-sm text-(--ink-2)">від {formatDate(o.createdAt)}</p>}
      </div>
      <Badge tone={deliveryTone(o.delivery_status)}>{deliveryLabel(o.delivery_status)}</Badge>
    </div>

    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
      <dt className="text-(--ink-2)">Сума</dt>
      <dd className="price text-right font-semibold text-(--price)">₴{o.price}</dd>
      <dt className="text-(--ink-2)">Оплата</dt>
      <dd className={`text-right font-medium ${o.payment_status === "paid" ? "text-(--success)" : "text-(--ink)"}`}>
        {payLabel(o.payment_status)}
      </dd>
      {o.invoice?.number && (
        <>
          <dt className="text-(--ink-2)">Рахунок {o.invoice.number}</dt>
          <dd className="text-right">{INVOICE_STATUS[o.invoice.status] || ""}</dd>
        </>
      )}
    </dl>

    <div className="flex flex-col xs:flex-row gap-2">
      <Link to={`/dashboard/order/details/${o._id}`} className={`${btnSecondary} flex-1`}>
        Переглянути
      </Link>
      {canPay && (
        <button type="button" onClick={() => onPay(o)} className={`${btnCta} flex-1`}>
          Оплатити
        </button>
      )}
    </div>
  </article>
);

export default OrderCard;
