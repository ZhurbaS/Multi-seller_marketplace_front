import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get_orders_details } from "../../store/reducers/orderSlice";

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const { myOrder } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(get_orders_details(orderId));
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
        </div>

        <div className="text-[var(--text-ordDet)]">
          <h2 className="font-mono">
            Ціна: ₴{myOrder.price}, включаючи доставку
          </h2>
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
                      className="w-[55px] h-[55px]"
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
                          {memoizedPrice} ₴
                          {memoizedPrice -
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
