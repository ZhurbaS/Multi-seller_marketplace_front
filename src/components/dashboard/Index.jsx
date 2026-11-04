import React, { useEffect } from "react";
import { LuChevronRight, LuCircleX, LuClock, LuLogOut, LuShoppingBag } from "react-icons/lu";
import { Link, NavLink, useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { get_dashboard_index_data } from "../../store/reducers/dashboardSlice";
import { PageHeader, Section } from "./Kit";
import OrderCard from "./OrderCard";
import { canPayOrder, cardCls } from "./ui";

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

const Stat = ({ icon, value, label, tone, className = "" }) => {
  const Icon = icon;
  return (
  <div className={`${cardCls} p-4 flex items-center gap-3 min-w-0 ${className}`}>
    <span
      aria-hidden="true"
      className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-xl ${tone}`}
    >
      <Icon />
    </span>
    <div className="min-w-0">
      <p className="text-2xl md:text-3xl font-bold leading-tight text-(--ink) tabular-nums">{value}</p>
      <p className="text-sm text-(--ink-2) leading-5">{label}</p>
    </div>
  </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { nav = [], logout } = useOutletContext() || {};

  const { userInfo } = useSelector((state) => state.auth);
  const { recentOrders, totalOrders, pendingOrders, cancelledOrders } =
    useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(get_dashboard_index_data(userInfo.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirect = (customerOrder) => {
    const items = (customerOrder.products || []).reduce((s, p) => s + p.quantity, 0);
    navigate("/payment", {
      state: {
        price: customerOrder.price,
        items,
        orderId: customerOrder._id,
        buyerKind: customerOrder.buyer?.kind || "individual",
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader title="Особистий кабінет" subtitle={userInfo?.name ? `Вітаємо, ${userInfo.name}` : undefined} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Stat
          icon={LuShoppingBag}
          value={totalOrders}
          label={getOrderWord(totalOrders)}
          tone="bg-(--brand-soft) text-(--brand-ink)"
        />
        <Stat
          icon={LuClock}
          value={pendingOrders}
          label="Замовлення в обробці"
          tone="bg-(--success-soft) text-(--success)"
        />
        <Stat
          icon={LuCircleX}
          value={cancelledOrders}
          label="Скасовані замовлення"
          tone="bg-(--danger-soft) text-(--danger)"
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Хаб розділів на мобільних (нижче lg бічного меню немає) */}
      <nav aria-label="Розділи кабінету" className="lg:hidden">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {nav
            .filter((n) => !n.end)
            .map(({ to, label, icon }) => {
              const Icon = icon;
              return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={`${cardCls} h-full min-h-[88px] p-4 flex flex-col justify-between gap-2 text-(--ink) hover:bg-(--surface-2)`}
                >
                  <Icon aria-hidden="true" className="text-2xl text-(--brand-ink)" />
                  <span className="font-semibold text-[0.9375rem] leading-5">{label}</span>
                </NavLink>
              </li>
              );
            })}
          {logout && (
            <li>
              <button
                type="button"
                onClick={logout}
                className={`${cardCls} w-full h-full min-h-[88px] p-4 flex flex-col justify-between items-start gap-2 text-(--danger) hover:bg-(--danger-soft)`}
              >
                <LuLogOut aria-hidden="true" className="text-2xl" />
                <span className="font-semibold text-[0.9375rem] leading-5">Вийти</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <Section title="Останні замовлення">
        {recentOrders.length === 0 ? (
          <p className="text-(--ink-2)">У вас ще немає замовлень.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recentOrders.map((o) => (
              <OrderCard key={o._id} o={o} canPay={canPayOrder(o, { allowInvoice: true })} onPay={redirect} />
            ))}
          </div>
        )}
        <Link
          to="/dashboard/my-orders"
          className="tap self-start -ml-3 gap-1 px-3 text-sm font-semibold text-(--brand-ink) hover:underline"
        >
          Усі замовлення
          <LuChevronRight aria-hidden="true" />
        </Link>
      </Section>
    </div>
  );
};

export default Index;
