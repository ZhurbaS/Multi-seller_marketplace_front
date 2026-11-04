import React, { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LuHeart,
  LuHouse,
  LuLock,
  LuLogOut,
  LuMessageCircle,
  LuPackage,
  LuSettings,
  LuUndo2,
} from "react-icons/lu";
import api from "../api/api";
import { useDispatch, useSelector } from "react-redux";
import { get_return_policy } from "../store/reducers/returnSlice";
import { user_reset } from "../store/reducers/authSlice";
import { reset_count } from "../store/reducers/cardSlice";

// Вкладені екрани (з кнопкою «Назад») — на мобільних без рядка вкладок
const NESTED = [/^\/dashboard\/order\/details\//, /^\/dashboard\/returns\/new\//, /^\/dashboard\/chat\/.+/];

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const cabinetVisible = useSelector((s) => s.returns.cabinetVisible);
  useEffect(() => {
    dispatch(get_return_policy());
  }, [dispatch]);

  const logout = async () => {
    try {
      await api.get("/customer/logout");
      localStorage.removeItem("customerToken");
      dispatch(user_reset());
      dispatch(reset_count());
      navigate("/login");
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  const nav = [
    { to: "/dashboard", end: true, label: "Особистий кабінет", short: "Огляд", icon: LuHouse },
    { to: "/dashboard/my-orders", label: "Мої замовлення", short: "Замовлення", icon: LuPackage },
    cabinetVisible && { to: "/dashboard/returns", label: "Мої повернення", short: "Повернення", icon: LuUndo2 },
    { to: "/dashboard/my-wishlist", label: "Список бажань", short: "Обране", icon: LuHeart },
    { to: "/dashboard/chat", label: "Чат", short: "Чат", icon: LuMessageCircle },
    { to: "/dashboard/settings", label: "Налаштування", short: "Налаштування", icon: LuSettings },
    { to: "/dashboard/change-password", label: "Змінити пароль", short: "Пароль", icon: LuLock },
  ].filter(Boolean);

  const isIndex = pathname === "/dashboard" || pathname === "/dashboard/";
  const nested = NESTED.some((r) => r.test(pathname));
  const showChips = !isIndex && !nested;

  return (
    <div className="min-h-dvh flex flex-col bg-(--page)">
      <Header />

      {/* Мобільні вкладки (нижче lg): горизонтальні чіпси зі snap */}
      {showChips && (
        <nav aria-label="Розділи кабінету" className="lg:hidden bg-(--surface) border-b border-(--line)">
          <ul className="container-x snap-row no-scrollbar gap-2 py-2">
            {nav.map(({ to, end, short, icon }) => {
              const Icon = icon;
              return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 min-h-11 px-4 rounded-full border text-sm font-medium whitespace-nowrap ${
                      isActive
                        ? "bg-(--brand-soft) border-(--brand) text-(--brand-ink)"
                        : "bg-(--surface) border-(--line) text-(--ink-2)"
                    }`
                  }
                >
                  <Icon aria-hidden="true" className="text-lg" />
                  {short}
                </NavLink>
              </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border border-(--line) bg-(--surface) text-sm font-medium text-(--danger) whitespace-nowrap"
              >
                <LuLogOut aria-hidden="true" className="text-lg" />
                Вийти
              </button>
            </li>
          </ul>
        </nav>
      )}

      <main id="main" className="flex-1 container-x py-4 md:py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 xl:gap-8 items-start">
          {/* Бічне меню від lg */}
          <aside className="hidden lg:block sticky top-[calc(var(--header-h)+16px)]">
            <nav aria-label="Розділи кабінету" className="bg-(--surface) border border-(--line) rounded-(--r-lg) p-2">
              <ul className="flex flex-col gap-1">
                {nav.map(({ to, end, label, icon }) => {
                  const Icon = icon;
                  return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 min-h-11 px-3 rounded-(--r-md) text-[0.9375rem] transition-colors ${
                          isActive
                            ? "bg-(--brand-soft) text-(--brand-ink) font-semibold"
                            : "text-(--ink-2) hover:bg-(--surface-2) hover:text-(--ink)"
                        }`
                      }
                    >
                      <Icon aria-hidden="true" className="text-xl shrink-0" />
                      {label}
                    </NavLink>
                  </li>
                  );
                })}
                <li className="mt-1 pt-1 border-t border-(--line)">
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-3 min-h-11 px-3 rounded-(--r-md) text-[0.9375rem] text-(--danger) hover:bg-(--danger-soft)"
                  >
                    <LuLogOut aria-hidden="true" className="text-xl shrink-0" />
                    Вийти
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            <Outlet context={{ nav, logout }} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
