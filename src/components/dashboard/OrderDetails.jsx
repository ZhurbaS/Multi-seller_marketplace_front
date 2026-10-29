import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { INVOICE_STATUS, downloadInvoice } from "../../utils/invoice";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get_orders_details } from "../../store/reducers/orderSlice";

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const { myOrder } = useSelector((state) => state.order);

  const [el, setEl] = useState(null); // можливість повернення/скасування
  const { cabinetVisible } = useSelector((state) => state.returns);

  useEffect(() => {
    dispatch(get_orders_details(orderId));
    api
      .get(`/home/returns/eligibility/${orderId}`)
      .then(({ data }) => setEl(data.eligibility))
      .catch(() => setEl(null));
  }, [orderId]);

  return (
    <div className="bg-[var(--bg-ordDet)] p-5">
      <h2 className="text-[var(--text-ordDet)] font-semibold">
        #{myOrder._id}, <span className="pl-1">{myOrder.date}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 ">
          <h2 className="text-[var(--text-ordDet)] font-semibold font-sans">
            Отримувач: {myOrder.shippingInfo?.name}
          </h2>
          <p>
            <span className="bg-[var(--bg-ordDet-home)] text-[var(--text-ordDet-home)] text-xs font-medium mr-2 px-2 py-2 rounded">
              Адреса
            </span>
            <span className="text-[var(--text-ordDet)] text-sm ">
              {myOrder.shippingInfo?.post}, {myOrder.shippingInfo?.district},{" "}
              {myOrder.shippingInfo?.area}, {myOrder.shippingInfo?.city},{" "}
              {myOrder.shippingInfo?.address}, {myOrder.shippingInfo?.phone}
            </span>
          </p>
          <p className="text-[var(--text-ordDet)] text-md font-semibold">
            Email: {userInfo.email}
          </p>
          {myOrder.buyer?.kind === "company" && (
            <p className="text-[var(--text-ordDet)] text-sm">
              Платник: {myOrder.buyer.companyName}, ЄДРПОУ {myOrder.buyer.edrpou}
              {myOrder.buyer.ipn ? `, ІПН ${myOrder.buyer.ipn}` : ""}
            </p>
          )}
        </div>

        <div className="text-[var(--text-ordDet)]">
          <h2 className="font-mono">Сума до сплати: ₴{myOrder.price}</h2>
          {myOrder.order_discount?.amount > 0 && (
            <p className="font-mono text-green-700">
              Знижка за сумою: −₴{myOrder.order_discount.amount}
            </p>
          )}
          {myOrder.coupon?.amount > 0 && (
            <p className="font-mono text-green-700">
              Купон {myOrder.coupon.code}: −₴{myOrder.coupon.amount}
            </p>
          )}
          {myOrder.refunded_total > 0 && (
            <p className="font-mono">Повернено: ₴{myOrder.refunded_total}</p>
          )}
          <p className="text-xs opacity-70">Доставка оплачується перевізнику при отриманні.</p>
          <p className="font-mono">
            Статус платежу:{" "}
            <span
              className={`py-[1px] text-xs px-3 ${
                myOrder.payment_status === "paid"
                  ? "bg-[var(--bg-ordDet-paid)] text-[var(--text-ordDet-paid)]"
                  : "bg-[var(--bg-ordDet-NotPaid)] text-[var(--text-ordDet-NotPaid)]"
              } rounded-md`}
            >
              {myOrder.payment_status}
            </span>
          </p>

          <p className="font-mono">
            Статус замовлення:{" "}
            <span
              className={`py-[1px] text-xs px-3 ${
                myOrder.delivery_status === "paid"
                  ? "bg-[var(--bg-ordDet-paid)] text-[var(--text-ordDet-paid)]"
                  : "bg-[var(--bg-ordDet-NotPaid)] text-[var(--text-ordDet-NotPaid)]"
              } rounded-md`}
            >
              {myOrder.delivery_status}
            </span>
          </p>
        </div>
      </div>

      {myOrder.invoice?.number && (
        <div className="mt-4 p-3 border border-slate-300 rounded text-[var(--text-ordDet)] text-sm flex flex-col gap-1">
          <div className="font-semibold">Рахунок на оплату {myOrder.invoice.number}</div>
          <div>{INVOICE_STATUS[myOrder.invoice.status] || ""}</div>
          {["awaiting", "sent"].includes(myOrder.invoice.status) && myOrder.delivery_status !== "cancelled" && myOrder.invoice.dueAt && (
            <div>Дійсний до: {new Date(myOrder.invoice.dueAt).toLocaleDateString("uk-UA")}</div>
          )}
          {myOrder.invoice.sentTo && myOrder.invoice.status === "sent" && <div>Надіслано на: {myOrder.invoice.sentTo}</div>}
          {myOrder.invoice.company &&
            ["awaiting", "sent"].includes(myOrder.invoice.status) &&
            myOrder.delivery_status !== "cancelled" && (
            <div>
              Реквізити для оплати: {myOrder.invoice.company.name}, IBAN {myOrder.invoice.company.iban}
            </div>
          )}
          <button
            onClick={() => downloadInvoice(orderId, myOrder.invoice.number)}
            className="self-start mt-1 px-3 py-1 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] rounded"
          >
            Завантажити рахунок (PDF)
          </button>
        </div>
      )}

      {el && el.enabled && (el.canCancel || el.canReturn) && (
        <div className="mt-4">
          <Link
            to={`/dashboard/returns/new/${orderId}`}
            className="inline-block px-4 py-2 bg-[var(--bg-card-processBtn)] text-[var(--text-card)] rounded"
          >
            {el.canCancel ? "Скасувати замовлення" : "Повернути товар"}
          </Link>
          {cabinetVisible && (
            <Link to="/dashboard/returns" className="ml-4 text-sm underline text-[var(--text-ordDet)]">
              Мої повернення
            </Link>
          )}
        </div>
      )}
      {el && !el.canCancel && !el.canReturn && el.message && (
        <p className="mt-3 text-sm text-[var(--text-ordDet)] opacity-80">{el.message}</p>
      )}

      <div className="mt-4 ">
        <h2 className="text-[var(--text-ordDet)] text-lg pb-2 font-sans font-bold">
          Замовлені товари
        </h2>
        <div className="flex gap-5 flex-col ">
          {myOrder.products?.map((p, i) => {
            const memoizedPrice = p.price;
            return (
              <div key={i}>
                <div className="flex gap-5 justify-start items-center text-[var(--text-ordDet)] ">
                  <div className="flex gap-2">
                    <img
                      className="w-[55px] h-[55px] object-cover"
                      src={p.images[0]}
                      alt=""
                    />
                    <div className="flex text-sm flex-col justify-start items-start">
                      <Link>{p.name}</Link>
                      <p>
                        <span>Бренд: {p.brand}</span>
                      </p>
                      <p>
                        <span>Кількість: {p.quantity}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pl-4 flex flex-col">
                    {p.discount !== 0 ? (
                      <>
                        <h2 className="text-md text-[var(--text-ordDet-paid)]">
                          ₴{memoizedPrice -
                            Math.floor((memoizedPrice * p.discount) / 100)}
                        </h2>
                        <p className="line-through">{memoizedPrice}</p>
                        <p>-{p.discount}%</p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-md text-[var(--text-ordDet-paid)]">
                          ₴{memoizedPrice}
                        </h2>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
