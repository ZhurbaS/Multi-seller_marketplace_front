import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get_orders } from "../../store/reducers/orderSlice";
import { FadeLoader } from "react-spinners";

const Orders = () => {
  const [state, setState] = useState("all");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { myOrders, errorMessage, loading } = useSelector(
    (state) => state.order
  );
  useEffect(() => {
    if (userInfo?.id) {
      dispatch(get_orders({ status: state, customerId: userInfo.id }));
    }
  }, [state]);

  const redirect = (customerOrder) => {
    const items = customerOrder.products.reduce(
      (sum, p) => sum + p.quantity,
      0
    );

    navigate("/payment", {
      state: {
        price: customerOrder.price,
        items,
        orderId: customerOrder._id,
      },
    });
  };

  // if (loading) {
  //   return (
  //     <div className="w-screen h-screen flex justify-center items-center fixed left-0 top-0 bg-[var(--bg--regLoader)] z-[999]">
  //       <FadeLoader />
  //     </div>
  //   );
  // }

  // // Виведення помилки, якщо є
  // if (errorMessage) {
  //   return (
  //     <div className="bg-[var(--bg-myOrders)] p-4 rounded-md">
  //       <h2 className="text-xl font-semibold text-[var(--text-myOrders)]">
  //         Помилка
  //       </h2>
  //       <p>{errorMessage}</p>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-[var(--bg-myOrders)] p-4 rounded-md">
      <div className="flex justify-between items-center ">
        <h2 className="text-xl font-semibold text-[var(--text-myOrders)]">
          Мої замовлення
        </h2>
        <select
          className="outline-none px-3 py-1 border border-[var(--border-myOrders)] rounded-md text-[var(--text-myOrders)]"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="all">--статус замовлення--</option>
          <option value="placed">розміщений</option>
          <option value="pending">очікується оплата</option>
          <option value="processing">комплектується</option>
          <option value="sent">відправлений</option>
          <option value="cancelled">скасований</option>
        </select>
      </div>

      {myOrders.length === 0 && !loading && !errorMessage && (
        <div className="mt-4 text-center text-[var(--text-myOrders)]">
          У вас немає замовлень для цього статусу.
        </div>
      )}

      {myOrders.length > 0 && (
        <div className="pt-4">
          <div className="relative overflow-x-auto rounded-md">
            <table className="w-full text-sm text-left text-[var(--text-indexTable)] ">
              <thead className="text-xs text-[var(--text-indexTableSec)] uppercase bg-[var(--bg-indexTable)] rounded-md">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Id замовлення
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Ціна
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Статус платежу
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Статус замовлення
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Дія
                  </th>
                </tr>
              </thead>

              <tbody>
                {myOrders.map((o, i) => (
                  <tr
                    key={o._id}
                    className="bg-[var(--bg-indexTableSec)] border-b border-[var(--border-indexTable)]"
                  >
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium whitespace-nowrap"
                    >
                      #{o._id}
                    </td>
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium whitespace-nowrap"
                    >
                      ₴{o.price}
                    </td>
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium whitespace-nowrap"
                    >
                      {o.payment_status}
                    </td>
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium whitespace-nowrap"
                    >
                      {o.delivery_status}
                    </td>
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium whitespace-nowrap"
                    >
                      <Link to={`/dashboard/order/details/${o._id}`}>
                        <span className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] text-md font-semibold mr-2 px-3 py-[2px] rounded">
                          Переглянути
                        </span>
                      </Link>

                      {o.payment_status !== "paid" && (
                        <span
                          onClick={() => redirect(o)}
                          className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] text-md font-semibold mr-2 px-3 py-[2px] rounded cursor-pointer"
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
