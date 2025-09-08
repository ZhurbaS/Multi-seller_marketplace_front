import React, { useEffect } from "react";
import { IoIosCart } from "react-icons/io";
import { MdRemoveShoppingCart } from "react-icons/md";
import { FaCartArrowDown } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { get_dashboard_index_data } from "../../store/reducers/dashboardSlice";

const getOrderWord = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "Замовлень";
  }

  if (lastDigit === 1) return "Замовлення";
  if (lastDigit >= 2 && lastDigit <= 4) return "Замовлення";

  return "Замовлень";
};

const Index = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const { recentOrders, totalOrders, pendingOrders, cancelledOrders } =
    useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(get_dashboard_index_data(userInfo.id));
  }, []);

  const redirect = (customerOrder) => {
    let items = 0;
    for (let i = 0; i < customerOrder.length; i++) {
      items = customerOrder.products[i].quantity + items;
    }
    navigate("/payment", {
      state: {
        price: customerOrder.price,
        items,
        orderId: customerOrder._id,
      },
    });
  };

  return (
    <div>
      <div className="grid grid-cols-3 max-md:grid-cols-1 gap-5">
        <div className="flex justify-center items-center p-5 bg-[var(--bg-index)] rounded-md gap-5">
          <div className="bg-[var(--bg-indexSec)] w-[47px] h-[47px] rounded-full flex justify-center items-center text-xl">
            <span className="text-xl text-[var(--text-index)]">
              <IoIosCart />
            </span>
          </div>
          <div className="flex flex-col justify-start items-start text-[var(--text-indexSec)]">
            <h2 className="text-3xl font-bold">{totalOrders}</h2>
            <span>{getOrderWord(totalOrders)}</span>
          </div>
        </div>

        <div className="flex justify-center items-center p-5 bg-[var(--bg-index)] rounded-md gap-5">
          <div className="bg-[var(--bg-indexSec)] w-[47px] h-[47px] rounded-full flex justify-center items-center text-xl">
            <span className="text-xl text-[var(--text-index)]">
              <FaCartArrowDown />
            </span>
          </div>
          <div className="flex flex-col justify-start items-start text-[var(--text-indexSec)]">
            <h2 className="text-3xl font-bold">{pendingOrders}</h2>
            <span>Замовлення в обробці</span>
          </div>
        </div>

        <div className="flex justify-center items-center p-5 bg-[var(--bg-index)] rounded-md gap-5">
          <div className="bg-[var(--bg-indexSec)] w-[47px] h-[47px] rounded-full flex justify-center items-center text-xl">
            <span className="text-xl text-[var(--text-index)]">
              <MdRemoveShoppingCart />
            </span>
          </div>
          <div className="flex flex-col justify-start items-start text-[var(--text-indexSec)]">
            <h2 className="text-3xl font-bold">{cancelledOrders}</h2>
            <span>Скасовані замовлення</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-index)] p-5 mt-5 rounded-md ">
        <h2>Останні замовлення</h2>
        <div className="pt-4">
          <div className="relative overflow-x-auto rounded-md">
            <table className="w-full text-sm text-left text-[var(--text-indexTable)] ">
              <thead className="text-чі text-[var(--text-indexTableSec)] uppercase bg-[var(--bg-indexTable)] rounded-md">
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
                {recentOrders.map((o, i) => (
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
      </div>
    </div>
  );
};

export default Index;
