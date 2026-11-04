import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuHouse, LuLayoutGrid, LuShoppingCart, LuHeart, LuUser } from "react-icons/lu";

const LG_MQ = "(min-width: 1080px)"; // брейкпоінт lg

// Маршрути з власною липкою панеллю дії — нижня навігація прихована
const isHiddenRoute = (p) =>
  p.startsWith("/product/details/") ||
  p === "/card" ||
  p === "/shipping" ||
  p === "/payment" ||
  p.startsWith("/order/confirm") ||
  p === "/pay/mock" ||
  p.startsWith("/dashboard/chat");

const useIsDesktop = () => {
  const [desk, setDesk] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(LG_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const on = () => setDesk(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desk;
};

const Item = (props) => {
  const { to, onClick, label, Icon, active, count } = props;
  const cls = `relative flex flex-col items-center justify-center gap-0.5 min-h-11 h-full w-full text-[12px] leading-4 font-medium ${
    active ? "text-(--brand-ink)" : "text-(--ink-2)"
  }`;
  const content = (
    <>
      <span className="relative">
        <Icon size={24} aria-hidden="true" strokeWidth={active ? 2.4 : 2} />
        {count ? (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-2.5 min-w-5 h-5 px-1 rounded-full bg-(--sale) text-(--on-sale) text-[12px] leading-5 font-semibold text-center tabular-nums"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
      {count ? <span className="sr-only">: {count}</span> : null}
    </>
  );
  return to ? (
    <Link to={to} className={cls} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
};

// Нижня навігаційна панель (нижче lg)
const BottomNav = () => {
  const { pathname } = useLocation();
  const { userInfo } = useSelector((state) => state.auth);
  const { card_product_count, wishlist_count } = useSelector((state) => state.card);
  const isAuthed = !!userInfo && !(userInfo.guest && !userInfo.email);
  const hidden = isHiddenRoute(pathname);
  const desktop = useIsDesktop();

  // --bottomnav-h: 0 коли панелі немає; висота панелі — коли вона видима
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty(
      "--bottomnav-h",
      hidden || desktop ? "0px" : "calc(60px + var(--sab))"
    );
    return () => root.removeProperty("--bottomnav-h");
  }, [hidden, desktop]);

  if (hidden) return null;

  const onWishlist = pathname.startsWith("/dashboard/my-wishlist");
  const items = [
    { key: "home", to: "/", label: "Головна", Icon: LuHouse, active: pathname === "/" },
    {
      key: "catalog",
      label: "Каталог",
      Icon: LuLayoutGrid,
      active: pathname.startsWith("/products"),
      onClick: () =>
        window.dispatchEvent(new CustomEvent("ts:menu", { detail: { section: "catalog" } })),
    },
    {
      key: "cart",
      to: userInfo ? "/card" : "/login",
      label: "Кошик",
      Icon: LuShoppingCart,
      active: pathname === "/card",
      count: card_product_count,
    },
    {
      key: "wish",
      to: userInfo ? "/dashboard/my-wishlist" : "/login",
      label: "Обране",
      Icon: LuHeart,
      active: onWishlist,
      count: wishlist_count,
    },
    {
      key: "account",
      to: isAuthed ? "/dashboard" : "/login",
      label: "Кабінет",
      Icon: LuUser,
      active:
        (pathname.startsWith("/dashboard") && !onWishlist) ||
        pathname === "/login" ||
        pathname === "/register",
    },
  ];

  return (
    <nav
      aria-label="Нижня навігація"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-(--surface) border-t border-(--line)"
      style={{ paddingBottom: "var(--sab)" }}
    >
      <ul className="grid grid-cols-5 h-[60px]">
        {items.map(({ key, ...it }) => (
          <li key={key} className="min-w-0">
            <Item {...it} />
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
