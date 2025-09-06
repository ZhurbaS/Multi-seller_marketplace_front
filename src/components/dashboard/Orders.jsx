import React, { useState } from "react";
import { Link } from "react-router-dom";

const Orders = () => {
  const [state, setState] = useState("all");

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
              <tr className="bg-[var(--bg-indexTableSec)] border-b border-[var(--border-indexTable)]">
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  #344
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  ₴18990
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  в очікуванні
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  в очікуванні
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  <Link>
                    <span className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] text-md font-semibold mr-2 px-3 py-[2px] rounded">
                      Переглянути
                    </span>
                  </Link>

                  <Link>
                    <span className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] text-md font-semibold mr-2 px-3 py-[2px] rounded">
                      Оплатити
                    </span>
                  </Link>
                </td>
              </tr>

              <tr className="bg-[var(--bg-indexTableSec)] border-b border-[var(--border-indexTable)]">
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  #344
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  ₴18990
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  в очікуванні
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  в очікуванні
                </td>
                <td
                  scope="row"
                  className="px-6 py-4 font-medium whitespace-nowrap"
                >
                  <Link>
                    <span className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] text-md font-semibold mr-2 px-3 py-[2px] rounded">
                      Переглянути
                    </span>
                  </Link>

                  <Link>
                    <span className="bg-[var(--bg-indexViewBtn)] text-[var(--text-index)] text-md font-semibold mr-2 px-3 py-[2px] rounded">
                      Оплатити
                    </span>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
