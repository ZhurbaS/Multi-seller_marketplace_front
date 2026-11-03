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
  statusBadge,
  unitPriceOf,
} from "../../utils/statusLabels";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get_orders_details } from "../../store/reducers/orderSlice";
import EditShipping from "./EditShipping";

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
  <div className="border border-[var(--border-myOrders)] rounded-md p-4 flex flex-col gap-1 text-sm">
    <h3 className="font-semibold text-base mb-1">{title}</h3>
    {children}
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
  }, [orderId]);

  if (!myOrder?._id) return <div className="bg-[var(--bg-ordDet)] p-5">Завантаження...</div>;

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

  return (
    <div className="bg-[var(--bg-ordDet)] p-5 rounded-md text-[var(--text-ordDet)] flex flex-col gap-5">
      <div>
        <Link to="/dashboard/my-orders" className="text-sm underline opacity-80">
          ← Усі замовлення
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <div>
            <h1 className="text-2xl font-bold">Замовлення {orderNo(o)}</h1>
            <p className="text-sm opacity-70">від {formatDateTime(o.createdAt)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge(o.delivery_status)}`}>
            {deliveryLabel(o.delivery_status)}
          </span>
        </div>
      </div>

      {cancelled ? (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          Замовлення скасовано.
          {o.payment_status === "paid" && " Кошти буде повернено тим самим способом, яким здійснювалась оплата."}
        </div>
      ) : (
        <ol className="flex items-start">
          {STEPS.map((t, i) => (
            <li key={t} className="flex-1 flex flex-col items-center text-center relative">
              {i > 0 && (
                <span className={`absolute top-3 right-1/2 w-full h-0.5 ${i <= step ? "bg-green-500" : "bg-slate-300"}`} />
              )}
              <span
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                  i <= step ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                {i <= step ? "✓" : i + 1}
              </span>
              <span className={`text-xs mt-1 ${i <= step ? "font-semibold" : "opacity-60"}`}>{t}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
        <Card title="Отримувач">
          <p className="font-semibold">
            {recipientText(o.shippingInfo) || `${o.shippingInfo?.name}, ${o.shippingInfo?.phone}`}
          </p>
          {recipientText(o.shippingInfo) && (
            <p className="opacity-80">
              Замовник: {o.shippingInfo?.name}, {o.shippingInfo?.phone}
            </p>
          )}
          {userInfo?.email && <p className="opacity-80">Email: {userInfo.email}</p>}
          {o.buyer?.kind === "company" && (
            <p className="opacity-80">
              Платник: {o.buyer.companyName}, ЄДРПОУ {o.buyer.edrpou}
              {o.buyer.ipn ? `, ІПН ${o.buyer.ipn}` : ""}
            </p>
          )}
        </Card>

        <Card title="Доставка">
          <p className="font-semibold">{DELIVERY_TYPE[o.shippingInfo?.deliveryType] || "—"}</p>
          <p>{formatAddress(o.shippingInfo)}</p>
          {o.trackingNumber && <p>Накладна (ТТН): <span className="font-semibold">{o.trackingNumber}</span></p>}
          <p className="opacity-70">Вартість доставки — за тарифами перевізника, оплачується при отриманні.</p>
          {editInfo.allowed && (
            <div className="mt-2 flex flex-col gap-1">
              <button onClick={() => setEditing(true)} className="self-start px-4 py-2 border border-[var(--border-myOrders)] rounded hover:bg-slate-100">
                Змінити отримувача та доставку
              </button>
              <span className="text-xs opacity-70">Доступно, поки замовлення не відправлено. Зміна може потребувати додаткового часу на опрацювання.</span>
            </div>
          )}
        </Card>

        <Card title="Оплата">
          <p className="font-semibold">{methodLabel(o.payment_method)}</p>
          <p>
            <span
              className={`px-2 py-[1px] rounded text-xs ${
                o.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {payLabel(o.payment_status)}
            </span>
          </p>
          {o.refunded_total > 0 && <p>Повернено: ₴{o.refunded_total}</p>}
          {canPay && (
            <button onClick={pay} className="self-start mt-2 px-4 py-2 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] rounded">
              Оплатити ₴{o.price}
            </button>
          )}
        </Card>

        {o.comment && (
          <Card title="Коментар до замовлення">
            <p className="whitespace-pre-wrap">{o.comment}</p>
          </Card>
        )}
      </div>

      {o.invoice?.number && (
        <Card title={`Рахунок на оплату ${o.invoice.number}`}>
          <p>{INVOICE_STATUS[o.invoice.status] || ""}</p>
          {["awaiting", "sent"].includes(o.invoice.status) && !cancelled && o.invoice.dueAt && (
            <p>Дійсний до: {new Date(o.invoice.dueAt).toLocaleDateString("uk-UA")}</p>
          )}
          {o.invoice.sentTo && o.invoice.status === "sent" && <p>Надіслано на: {o.invoice.sentTo}</p>}
          {o.invoice.company && ["awaiting", "sent"].includes(o.invoice.status) && !cancelled && (
            <p>
              Реквізити для оплати: {o.invoice.company.name}, IBAN {o.invoice.company.iban}
            </p>
          )}
          <button
            onClick={() => downloadInvoice(orderId, o.invoice.number)}
            className="self-start mt-1 px-3 py-1 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] rounded"
          >
            Завантажити рахунок (PDF)
          </button>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-bold pb-2">Товари в замовленні ({goodsCount})</h2>
        <div className="border border-[var(--border-myOrders)] rounded-md divide-y divide-[var(--border-myOrders)]">
          {o.products?.map((p, i) => {
            const unit = unitPriceOf(p);
            return (
              <div key={i} className="flex gap-3 p-3 items-center text-sm">
                <img className="w-[56px] h-[56px] object-contain" src={p.images?.[0]} alt="" />
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  {p.preorder && <div className="text-xs text-orange-600">Передзамовлення</div>}
                </div>
                <div className="text-right whitespace-nowrap">
                  <div>
                    {p.quantity} шт × ₴{unit}
                    {p.discount > 0 && <span className="line-through opacity-50 ml-2">₴{p.price}</span>}
                  </div>
                  <div className="font-semibold">₴{Math.round(unit * p.quantity * 100) / 100}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-3">
          <div className="w-[320px] max-sm:w-full text-sm flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Товарів на суму</span>
              <span>₴{o.goods_total ?? o.price}</span>
            </div>
            {o.order_discount?.amount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Знижка за сумою (−{o.order_discount.percent}%)</span>
                <span>−₴{o.order_discount.amount}</span>
              </div>
            )}
            {o.coupon?.amount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Промокод {o.coupon.code}</span>
                <span>−₴{o.coupon.amount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Доставка</span>
              <span>за тарифами перевізника</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-[var(--border-myOrders)] pt-2 mt-1">
              <span>{o.payment_status === "paid" ? "Сплачено" : "Разом до сплати"}</span>
              <span className={o.payment_status === "paid" ? "text-green-700" : ""}>₴{o.price}</span>
            </div>
          </div>
        </div>
      </div>

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

      {el && el.enabled && (el.canCancel || el.canReturn) && (
        <div>
          <Link
            to={`/dashboard/returns/new/${orderId}`}
            className="inline-block px-4 py-2 border border-[var(--border-myOrders)] rounded hover:bg-slate-100"
          >
            {el.canCancel ? "Скасувати замовлення" : "Повернути товар"}
          </Link>
          {cabinetVisible && (
            <Link to="/dashboard/returns" className="ml-4 text-sm underline">
              Мої повернення
            </Link>
          )}
        </div>
      )}
      {el && !el.canCancel && !el.canReturn && el.message && <p className="text-sm opacity-80">{el.message}</p>}
    </div>
  );
};

export default OrderDetails;
