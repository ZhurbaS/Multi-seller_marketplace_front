import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { INVOICE_STATUS, downloadInvoice } from "../../utils/invoice";
import {
  payLabel,
  deliveryLabel,
  DELIVERY_TYPE,
  formatAddress,
  recipientText,
  orderNo,
  formatDateTime,
  methodLabel,
  unitPriceOf,
} from "../../utils/statusLabels";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuCheck, LuFileDown, LuPencil, LuUndo2 } from "react-icons/lu";
import { get_orders_details } from "../../store/reducers/orderSlice";
import EditShipping from "./EditShipping";
import { Badge, PageHeader, Section } from "./Kit";
import { btnCta, btnSecondary, cardCls, deliveryTone, fullMobile } from "./ui";

const STEPS = ["Оформлено", "Оплачено", "Опрацьовується", "Відправлено", "Доставлено"];

// Поточний крок: 0 оформлено, 1 оплачено, 2 опрацьовується, 3 відправлено, 4 доставлено
const stepOf = (o) => {
  if (o.delivery_status === "delivered") return 4;
  if (o.delivery_status === "shipped") return 3;
  if (["processing", "packing"].includes(o.delivery_status)) return 2;
  if (o.payment_status === "paid") return 1;
  return 0;
};

const Card = ({ title, children }) => (
  <Section title={title} className="text-sm text-(--ink) gap-1.5">
    {children}
  </Section>
);

const Row = ({ label, children, strong }) => (
  <div className="flex justify-between gap-3">
    <span className="text-(--ink-2)">{label}</span>
    <span className={`text-right price ${strong ? "font-semibold text-(--ink)" : ""}`}>{children}</span>
  </div>
);

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.auth);
  const { myOrder } = useSelector((state) => state.order);

  const [el, setEl] = useState(null); // можливість повернення/скасування
  const [editInfo, setEditInfo] = useState({ allowed: false, reason: "" }); // чи можна змінити отримувача/доставку
  const [editing, setEditing] = useState(false);
  const { cabinetVisible } = useSelector((state) => state.returns);

  useEffect(() => {
    dispatch(get_orders_details(orderId));
    api
      .get(`/home/returns/eligibility/${orderId}`)
      .then(({ data }) => setEl(data.eligibility))
      .catch(() => setEl(null));
    api
      .get(`/home/customer/orders/${orderId}/shipping-edit`)
      .then(({ data }) => setEditInfo(data))
      .catch(() => setEditInfo({ allowed: false, reason: "" }));
  }, [orderId, dispatch]);

  if (!myOrder?._id)
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Замовлення" back="/dashboard/my-orders" backLabel="Усі замовлення" />
        <div className={`${cardCls} p-5 text-(--ink-2)`} role="status">
          Завантаження...
        </div>
      </div>
    );

  const o = myOrder;
  const cancelled = o.delivery_status === "cancelled";
  const step = stepOf(o);
  const goodsCount = (o.products || []).reduce((s, p) => s + p.quantity, 0);
  const canPay = o.payment_status !== "paid" && o.payment_method !== "cod" && !cancelled && o.payment_method !== "invoice";
  const pay = () =>
    navigate("/payment", {
      state: {
        price: o.price,
        items: goodsCount,
        orderId: o._id,
        buyerKind: o.buyer?.kind || "individual",
      },
    });
  const canReturnAct = el && el.enabled && (el.canCancel || el.canReturn);
  const hasActions = editInfo.allowed || canReturnAct || canPay;

  return (
    <div className="flex flex-col gap-4 md:gap-5 text-(--ink)">
      <PageHeader
        title={`Замовлення ${orderNo(o)}`}
        subtitle={`від ${formatDateTime(o.createdAt)}`}
        back="/dashboard/my-orders"
        backLabel="Усі замовлення"
        aside={
          <Badge tone={deliveryTone(o.delivery_status)} className="text-sm px-3 py-1">
            {deliveryLabel(o.delivery_status)}
          </Badge>
        }
      />

      {cancelled ? (
        <div role="status" className="p-4 rounded-(--r-lg) bg-(--danger-soft) text-(--danger) text-sm">
          Замовлення скасовано.
          {o.payment_status === "paid" && " Кошти буде повернено тим самим способом, яким здійснювалась оплата."}
        </div>
      ) : (
        <Section as="div">
          <h2 className="sr-only">Етапи замовлення</h2>
          {/* Мобільні: вертикальна шкала; від sm — горизонтальна */}
          <ol className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:items-start">
            {STEPS.map((t, i) => {
              const done = i <= step;
              return (
                <li
                  key={t}
                  aria-current={i === step ? "step" : undefined}
                  className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-1 sm:text-center"
                >
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={`hidden sm:block absolute top-3 right-1/2 w-full h-0.5 ${done ? "bg-(--success)" : "bg-(--line)"}`}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                      done ? "bg-(--success) text-(--on-brand)" : "bg-(--surface-2) text-(--ink-2) border border-(--line)"
                    }`}
                  >
                    {done ? <LuCheck /> : i + 1}
                  </span>
                  <span className={`text-sm sm:text-xs ${done ? "font-semibold text-(--ink)" : "text-(--ink-2)"}`}>
                    {t}
                    <span className="sr-only">{done ? " — виконано" : " — очікується"}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card title="Отримувач">
          <p className="font-semibold">
            {recipientText(o.shippingInfo) || `${o.shippingInfo?.name}, ${o.shippingInfo?.phone}`}
          </p>
          {recipientText(o.shippingInfo) && (
            <p className="text-(--ink-2)">
              Замовник: {o.shippingInfo?.name}, {o.shippingInfo?.phone}
            </p>
          )}
          {userInfo?.email && <p className="text-(--ink-2) break-words">Email: {userInfo.email}</p>}
          {o.buyer?.kind === "company" && (
            <p className="text-(--ink-2)">
              Платник: {o.buyer.companyName}, ЄДРПОУ {o.buyer.edrpou}
              {o.buyer.ipn ? `, ІПН ${o.buyer.ipn}` : ""}
            </p>
          )}
        </Card>

        <Card title="Доставка">
          <p className="font-semibold">{DELIVERY_TYPE[o.shippingInfo?.deliveryType] || "—"}</p>
          <p>{formatAddress(o.shippingInfo)}</p>
          {o.trackingNumber && (
            <p>
              Накладна (ТТН): <span className="font-semibold tabular-nums">{o.trackingNumber}</span>
            </p>
          )}
          <p className="text-(--ink-2)">Вартість доставки — за тарифами перевізника, оплачується при отриманні.</p>
        </Card>

        <Card title="Оплата">
          <p className="font-semibold">{methodLabel(o.payment_method)}</p>
          <p>
            <Badge tone={o.payment_status === "paid" ? "success" : "neutral"}>{payLabel(o.payment_status)}</Badge>
          </p>
          {o.refunded_total > 0 && <p>Повернено: ₴{o.refunded_total}</p>}
        </Card>

        {o.comment && (
          <Card title="Коментар до замовлення">
            <p className="whitespace-pre-wrap break-words">{o.comment}</p>
          </Card>
        )}

        {o.invoice?.number && (
          <Card title={`Рахунок на оплату ${o.invoice.number}`}>
            <p>{INVOICE_STATUS[o.invoice.status] || ""}</p>
            {["awaiting", "sent"].includes(o.invoice.status) && !cancelled && o.invoice.dueAt && (
              <p>Дійсний до: {new Date(o.invoice.dueAt).toLocaleDateString("uk-UA")}</p>
            )}
            {o.invoice.sentTo && o.invoice.status === "sent" && <p className="break-words">Надіслано на: {o.invoice.sentTo}</p>}
            {o.invoice.company && ["awaiting", "sent"].includes(o.invoice.status) && !cancelled && (
              <p className="break-words">
                Реквізити для оплати: {o.invoice.company.name}, IBAN {o.invoice.company.iban}
              </p>
            )}
            <button
              type="button"
              onClick={() => downloadInvoice(orderId, o.invoice.number)}
              className={`${btnSecondary} ${fullMobile} self-start mt-2`}
            >
              <LuFileDown aria-hidden="true" className="text-lg" />
              Завантажити рахунок (PDF)
            </button>
          </Card>
        )}
      </div>

      <Section title={`Товари в замовленні (${goodsCount})`}>
        <ul className="divide-y divide-(--line) -my-1">
          {o.products?.map((p, i) => {
            const unit = unitPriceOf(p);
            return (
              <li key={i} className="flex gap-3 py-3 items-start text-sm">
                <img
                  className="w-16 h-16 shrink-0 object-contain rounded-(--r-sm) bg-(--surface-2)"
                  src={p.images?.[0]}
                  alt={p.name || ""}
                  width={64}
                  height={64}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold line-clamp-2">{p.name}</div>
                    {p.preorder && <div className="text-xs font-semibold text-(--warning)">Передзамовлення</div>}
                  </div>
                  <div className="sm:text-right whitespace-nowrap price">
                    <div className="text-(--ink-2)">
                      {p.quantity} шт × ₴{unit}
                      {p.discount > 0 && <span className="line-through ml-2">₴{p.price}</span>}
                    </div>
                    <div className="font-semibold text-(--price)">₴{Math.round(unit * p.quantity * 100) / 100}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-(--line) pt-3 sm:ml-auto sm:w-[340px] text-sm flex flex-col gap-1.5">
          <Row label="Товарів на суму">₴{o.goods_total ?? o.price}</Row>
          {o.order_discount?.amount > 0 && (
            <div className="flex justify-between gap-3 text-(--success)">
              <span>Знижка за сумою (−{o.order_discount.percent}%)</span>
              <span className="price">−₴{o.order_discount.amount}</span>
            </div>
          )}
          {o.coupon?.amount > 0 && (
            <div className="flex justify-between gap-3 text-(--success)">
              <span>Промокод {o.coupon.code}</span>
              <span className="price">−₴{o.coupon.amount}</span>
            </div>
          )}
          <Row label="Доставка">за тарифами перевізника</Row>
          <div className="flex justify-between gap-3 text-lg font-bold border-t border-(--line) pt-2 mt-1">
            <span>{o.payment_status === "paid" ? "Сплачено" : "Разом до сплати"}</span>
            <span className={`price ${o.payment_status === "paid" ? "text-(--success)" : "text-(--price)"}`}>₴{o.price}</span>
          </div>
        </div>
      </Section>

      {hasActions && (
        <Section title="Дії із замовленням">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            {editInfo.allowed && (
              <button type="button" onClick={() => setEditing(true)} className={`${btnSecondary} ${fullMobile}`}>
                <LuPencil aria-hidden="true" className="text-lg" />
                Змінити отримувача та доставку
              </button>
            )}
            {canReturnAct && (
              <Link to={`/dashboard/returns/new/${orderId}`} className={`${btnSecondary} ${fullMobile}`}>
                <LuUndo2 aria-hidden="true" className="text-lg" />
                {el.canCancel ? "Скасувати замовлення" : "Повернути товар"}
              </Link>
            )}
            {canPay && (
              <button type="button" onClick={pay} className={`hidden lg:inline-flex ${btnCta}`}>
                Оплатити ₴{o.price}
              </button>
            )}
          </div>
          {editInfo.allowed && (
            <p className="text-sm text-(--ink-2)">
              Змінити отримувача й доставку можна, поки замовлення не відправлено. Зміна може потребувати додаткового часу на опрацювання.
            </p>
          )}
          {canReturnAct && cabinetVisible && (
            <Link to="/dashboard/returns" className="tap self-start -ml-3 px-3 text-sm font-semibold text-(--brand-ink) underline">
              Мої повернення
            </Link>
          )}
        </Section>
      )}
      {el && !el.canCancel && !el.canReturn && el.message && <p className="text-sm text-(--ink-2)">{el.message}</p>}

      {/* Липка панель головної дії на мобільних — над нижньою навігацією */}
      {canPay && (
        <div className="lg:hidden sticky bottom-(--bottomnav-h) z-30 -mx-4 px-4 pt-3 pb-3 bg-(--surface) border-t border-(--line) shadow-(--shadow-2)">
          <button type="button" onClick={pay} className={`${btnCta} w-full min-h-12`}>
            Оплатити <span className="price">₴{o.price}</span>
          </button>
        </div>
      )}

      {editing && (
        <EditShipping
          order={o}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            dispatch(get_orders_details(orderId));
          }}
        />
      )}
    </div>
  );
};

export default OrderDetails;
