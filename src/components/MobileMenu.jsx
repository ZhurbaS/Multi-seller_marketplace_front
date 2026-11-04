import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useStorefront from "../hooks/useStorefront";
import {
  LuX,
  LuChevronDown,
  LuLayoutGrid,
  LuUser,
  LuLogIn,
  LuUserPlus,
  LuPhone,
  LuMail,
  LuMapPin,
  LuTruck,
  LuRotateCcw,
  LuShieldCheck,
  LuFileText,
  LuLock,
  LuStore,
} from "react-icons/lu";

// Контакти магазину (ті самі, що у Footer)
const PHONE = "044 999 88 77";
const PHONE_HREF = "tel:+380449998877";
const EMAIL = "support@techscout.com";
const ADDRESS = "проспект Берестейський, буд. 50, оф. 10, м. Київ, 01001";

const infoLinks = [
  { to: "/delivery", label: "Доставка й оплата", Icon: LuTruck },
  { to: "/returns", label: "Повернення", Icon: LuRotateCcw },
  { to: "/warranty", label: "Гарантія", Icon: LuShieldCheck },
  { to: "/oferta", label: "Публічна оферта", Icon: LuFileText },
  { to: "/privacy", label: "Політика конфіденційності", Icon: LuLock },
];
const storesLink = { to: "/stores", label: "Магазини", Icon: LuStore };

const childrenOf = (c) => c?.children || c?.subcategories || c?.subCategories || [];
const catLink = (c) => `/products?category=${encodeURIComponent(c.name)}`;

const rowCls =
  "w-full min-h-12 flex items-center gap-3 px-4 text-left text-(--ink) hover:bg-(--surface-2)";

/**
 * Бургер-drawer (зліва). Відкривається подією window "ts:menu"
 * (detail.section === "catalog" — одразу розгорнути категорії).
 */
const MobileMenu = () => {
  const { pathname, search } = useLocation();
  const { categories = [] } = useSelector((state) => state.home);
  const { userInfo } = useSelector((state) => state.auth);
  const isAuthed = !!userInfo && !(userInfo.guest && !userInfo.email);
  const { showStoresLink } = useStorefront();
  const links = showStoresLink ? [...infoLinks, storesLink] : infoLinks;

  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(null);

  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const catBtnRef = useRef(null);
  const prevFocus = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = (e) => {
      prevFocus.current = document.activeElement;
      const catalog = e.detail?.section === "catalog";
      setCatOpen(catalog);
      setOpen(true);
      requestAnimationFrame(() =>
        (catalog ? catBtnRef.current : closeRef.current)?.focus()
      );
    };
    window.addEventListener("ts:menu", onOpen);
    return () => window.removeEventListener("ts:menu", onOpen);
  }, []);

  // Закриття при зміні маршруту
  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  // Блокування скролу + повернення фокуса
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("ts-sheet-open");
    return () => {
      root.classList.remove("ts-sheet-open");
      const el = prevFocus.current;
      if (el && el.isConnected && el.focus) el.focus();
    };
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const els = panelRef.current.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!els.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={`lg:hidden fixed inset-0 z-[70] motion-safe:transition-[visibility] motion-safe:duration-200 ${
        open ? "visible" : "invisible"
      }`}
      inert={!open}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-(--overlay) motion-safe:transition-opacity motion-safe:duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Меню магазину"
        onKeyDown={onKeyDown}
        className={`absolute inset-y-0 left-0 w-[min(88vw,360px)] h-dvh flex flex-col bg-(--surface) text-(--ink) shadow-(--shadow-3) motion-safe:transition-transform motion-safe:duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
      >
        <div className="flex items-center justify-between h-14 pl-4 pr-2 bg-(--header-bg) text-(--on-header) shrink-0">
          <Link to="/" className="inline-flex items-center min-h-11" aria-label="TechScout — на головну">
            <img className="h-8 w-auto" src="/images/logoTS.png" alt="TechScout" width="96" height="32" />
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Закрити меню"
            className="tap rounded-(--r-md) hover:bg-(--header-hover)"
          >
            <LuX size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Кабінет / вхід */}
          <div className="p-4 border-b border-(--line)">
            {isAuthed ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-3 min-h-12 px-3 rounded-(--r-md) bg-(--surface-2) text-(--ink) font-semibold"
              >
                <LuUser size={22} aria-hidden="true" className="text-(--brand-ink)" />
                <span className="truncate">{userInfo.name || "Мій кабінет"}</span>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 min-h-12 rounded-(--r-md) bg-(--brand) text-(--on-brand) font-semibold"
                >
                  <LuLogIn size={20} aria-hidden="true" /> Увійти
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 min-h-12 rounded-(--r-md) border border-(--line-strong) text-(--ink) font-semibold"
                >
                  <LuUserPlus size={20} aria-hidden="true" /> Реєстрація
                </Link>
              </div>
            )}
          </div>

          {/* Каталог (акордеон) */}
          <nav aria-label="Каталог" className="border-b border-(--line) py-1">
            <button
              ref={catBtnRef}
              type="button"
              className={`${rowCls} font-semibold`}
              aria-expanded={catOpen}
              aria-controls="ts-mm-cats"
              onClick={() => setCatOpen((v) => !v)}
            >
              <LuLayoutGrid size={20} aria-hidden="true" className="text-(--brand-ink)" />
              <span className="flex-1">Каталог товарів</span>
              <LuChevronDown
                size={20}
                aria-hidden="true"
                className={`motion-safe:transition-transform ${catOpen ? "rotate-180" : ""}`}
              />
            </button>
            <ul id="ts-mm-cats" hidden={!catOpen} className="pb-2">
              <li>
                <Link to="/shops" className={`${rowCls} pl-12 text-(--brand-ink) font-semibold`}>
                  Усі товари
                </Link>
              </li>
              {categories.length === 0 && (
                <li className="px-4 pl-12 py-3 text-(--ink-2)">Категорії завантажуються…</li>
              )}
              {categories.map((c, i) => {
                const kids = childrenOf(c);
                const key = c._id || c.name || i;
                if (!kids.length) {
                  return (
                    <li key={key}>
                      <Link to={catLink(c)} className={`${rowCls} pl-5`}>
                        {c.image ? (
                          <img src={c.image} alt="" width="28" height="28" loading="lazy" className="w-7 h-7 shrink-0 rounded-full object-cover bg-(--surface-2)" />
                        ) : (
                          <span className="w-7 shrink-0" aria-hidden="true" />
                        )}
                        <span>{c.name}</span>
                      </Link>
                    </li>
                  );
                }
                const expanded = subOpen === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`${rowCls} pl-12`}
                      aria-expanded={expanded}
                      onClick={() => setSubOpen(expanded ? null : key)}
                    >
                      <span className="flex-1">{c.name}</span>
                      <LuChevronDown size={18} aria-hidden="true" className={expanded ? "rotate-180" : ""} />
                    </button>
                    <ul hidden={!expanded}>
                      <li>
                        <Link to={catLink(c)} className={`${rowCls} pl-16 text-(--brand-ink)`}>
                          Усе в «{c.name}»
                        </Link>
                      </li>
                      {kids.map((k, j) => (
                        <li key={k._id || k.name || j}>
                          <Link to={catLink(k)} className={`${rowCls} pl-16`}>
                            {k.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Покупцям */}
          <nav aria-label="Покупцям" className="border-b border-(--line) py-2">
            <h2 className="px-4 pt-2 pb-1 text-sm font-semibold text-(--ink-2)">Покупцям</h2>
            <ul>
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={rowCls} aria-current={pathname === l.to ? "page" : undefined}>
                    <l.Icon size={20} aria-hidden="true" className="text-(--ink-2)" />
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Контакти */}
          <section aria-labelledby="ts-mm-contacts" className="py-2">
            <h2 id="ts-mm-contacts" className="px-4 pt-2 pb-1 text-sm font-semibold text-(--ink-2)">
              Контакти
            </h2>
            <ul>
              <li>
                <a href={PHONE_HREF} className={rowCls}>
                  <LuPhone size={20} aria-hidden="true" className="text-(--brand-ink)" />
                  <span>
                    <span className="block font-semibold">{PHONE}</span>
                    <span className="block text-sm text-(--ink-2)">Підтримка 24/7</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className={rowCls}>
                  <LuMail size={20} aria-hidden="true" className="text-(--brand-ink)" />
                  <span>{EMAIL}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 px-4 py-3 text-(--ink-2) text-sm">
                <LuMapPin size={20} aria-hidden="true" className="shrink-0" />
                <span>{ADDRESS}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
