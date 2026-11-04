import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuMenu,
  LuHeart,
  LuShoppingCart,
  LuUser,
  LuSearch,
  LuLayoutGrid,
  LuChevronDown,
  LuArrowLeft,
  LuX,
  LuHistory,
  LuMail,
  LuPhone,
  LuLogIn,
} from "react-icons/lu";
import { AiFillTikTok } from "react-icons/ai";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareInstagram, FaSquareYoutube } from "react-icons/fa6";
import {
  get_card_products,
  get_wishlist_products,
} from "../store/reducers/cardSlice";
import useStorefront from "../hooks/useStorefront";
import AnnouncementBar from "./AnnouncementBar";
import CategorySelect from "./CategorySelect";

// Контакти магазину (ті самі, що у Footer / MobileMenu)
const PHONE = "044 999 88 77";
const PHONE_HREF = "tel:+380449998877";
const EMAIL = "support@techscout.com";

// Стандартний фон мегаменю: одна велика неповторювана ілюстрація (1200×600),
// «cover» з прив'язкою до правого нижнього кута (preserveAspectRatio xMaxYMax slice).
// Кольори — токени (--line / --brand-soft / --surface), тож фон слідує темі,
// а контраст тексту категорій (--ink на світлих лініях) лишається ≥ 4.5:1.
const CATALOG_TRACES = [
  "M560 600V520l40-40h120l40-40V360",
  "M640 600v-48l24-24h96",
  "M1200 300h-120l-40 40v80l-40 40H880",
  "M1200 180h-200l-40-40h-120l-40 40v60",
  "M760 0v60l40 40h160l40 40",
  "M1080 0v40l-40 40H920",
  "M480 600v-30l30-30h60",
  "M1200 440h-60l-30 30v130",
];
const CATALOG_NODES = [
  [760, 360, 5], [760, 528, 4], [840, 460, 5], [960, 200, 5], [1000, 140, 4],
  [920, 80, 4], [570, 540, 4], [1110, 470, 4], [1040, 340, 4],
];
const CatalogArt = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="absolute inset-0 -z-10 h-full w-full"
    viewBox="0 0 1200 600"
    preserveAspectRatio="xMaxYMax slice"
  >
    <defs>
      <radialGradient id="ts-cat-glow" cx="1" cy="1" r="0.9">
        <stop offset="0" style={{ stopColor: "var(--brand-soft)", stopOpacity: 1 }} />
        <stop offset="0.55" style={{ stopColor: "var(--brand-soft)", stopOpacity: 0.45 }} />
        <stop offset="1" style={{ stopColor: "var(--surface)", stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id="ts-cat-fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.25" style={{ stopColor: "var(--surface)", stopOpacity: 1 }} />
        <stop offset="0.6" style={{ stopColor: "var(--surface)", stopOpacity: 0 }} />
      </linearGradient>
    </defs>
    <rect width="1200" height="600" style={{ fill: "var(--surface)" }} />
    <rect width="1200" height="600" fill="url(#ts-cat-glow)" />
    {/* концентричні кола з правого нижнього кута */}
    <g fill="none" style={{ stroke: "var(--line)" }} strokeWidth="1.5">
      <circle cx="1120" cy="560" r="110" />
      <circle cx="1120" cy="560" r="200" />
      <circle cx="1120" cy="560" r="300" strokeDasharray="2 10" strokeLinecap="round" />
      <circle cx="1120" cy="560" r="410" />
    </g>
    <circle cx="1120" cy="560" r="60" style={{ fill: "var(--brand-soft)" }} />
    {/* доріжки «плати» */}
    <g fill="none" style={{ stroke: "var(--line)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {CATALOG_TRACES.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
    <g style={{ fill: "var(--surface)", stroke: "var(--line)" }} strokeWidth="2">
      {CATALOG_NODES.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
    {/* «мікросхема» */}
    <g fill="none" style={{ stroke: "var(--line)" }} strokeWidth="2">
      <rect x="880" y="400" width="96" height="72" rx="10" style={{ fill: "var(--surface)" }} />
      <path d="M900 400v-14M920 400v-14M940 400v-14M960 400v-14M900 472v14M920 472v14M940 472v14M960 472v14" strokeLinecap="round" />
    </g>
    {/* ліва частина плавно «тане» в поверхню — під текстом фон майже чистий */}
    <rect width="1200" height="600" fill="url(#ts-cat-fade)" />
  </svg>
);

const MOBILE_MQ = "(max-width: 1079.98px)"; // нижче lg
const TOP_ROW_H = 56; // висота верхнього рядка мобільної шапки (h-14)
const HISTORY_KEY = "ts:search-history";

const readHistory = () => {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(v) ? v.slice(0, 8) : [];
  } catch {
    return [];
  }
};
const writeHistory = (list) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    /* сховище недоступне — ігноруємо */
  }
};

const openMobileMenu = (section) =>
  window.dispatchEvent(new CustomEvent("ts:menu", { detail: { section } }));

const Badge = ({ count }) =>
  count ? (
    <>
      <span
        className="absolute top-0.5 right-0.5 min-w-5 h-5 px-1 rounded-full bg-(--sale) text-(--on-sale) text-[12px] leading-5 font-semibold text-center tabular-nums"
        aria-hidden="true"
      >
        {count > 99 ? "99+" : count}
      </span>
      <span className="sr-only">: {count}</span>
    </>
  ) : null;

const socials = [
  { href: "#", label: "YouTube", Icon: FaSquareYoutube },
  { href: "#", label: "Facebook", Icon: IoLogoFacebook },
  { href: "#", label: "TikTok", Icon: AiFillTikTok },
  { href: "#", label: "Instagram", Icon: FaSquareInstagram },
];

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search: locSearch } = useLocation();

  const { categories = [] } = useSelector((state) => state.home);
  const { showStoresLink, catalogBgUrl } = useStorefront();
  const { userInfo } = useSelector((state) => state.auth);
  const { card_product_count, wishlist_count } = useSelector(
    (state) => state.card
  );
  // гість без e-mail вважається неавторизованим
  const isAuthed = !!userInfo && !(userInfo.guest && !userInfo.email);

  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [topHidden, setTopHidden] = useState(false);
  const [height, setHeight] = useState(0);

  const headerRef = useRef(null);
  const catalogRef = useRef(null);
  const catalogBtnRef = useRef(null);

  const search = (value = searchValue, cat = category) => {
    const v = (value || "").trim();
    if (v) {
      const next = [v, ...history.filter((h) => h !== v)].slice(0, 8);
      setHistory(next);
      writeHistory(next);
    }
    setSearchOpen(false);
    navigate(
      `/products/search?category=${encodeURIComponent(cat || "")}&value=${encodeURIComponent(v)}`
    );
  };

  const redirect_card_page = () => {
    if (userInfo) {
      navigate("/card");
    } else {
      navigate("/login");
    }
  };
  const wishlistTo = userInfo ? "/dashboard/my-wishlist" : "/login";
  const accountTo = isAuthed ? "/dashboard" : "/login";

  useEffect(() => {
    if (userInfo) {
      dispatch(get_card_products(userInfo.id));
      dispatch(get_wishlist_products(userInfo.id));
    }
  }, [userInfo, dispatch]);

  // Закриття меню/оверлеїв при зміні маршруту
  useEffect(() => {
    setCatalogOpen(false);
    setSearchOpen(false);
    setTopHidden(false);
  }, [pathname, locSearch]);

  // Мегаменю «Каталог»: клік поза ним / Esc
  useEffect(() => {
    if (!catalogOpen) return;
    const onDown = (e) => {
      if (
        catalogRef.current?.contains(e.target) ||
        catalogBtnRef.current?.contains(e.target)
      )
        return;
      setCatalogOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setCatalogOpen(false);
        catalogBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catalogOpen]);

  // Мобільна шапка: верхній рядок ховається при скролі вниз, повертається при скролі вгору
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y < 80) setTopHidden(false);
        else if (dy > 8) setTopHidden(true);
        else if (dy < -8) setTopHidden(false);
        if (Math.abs(dy) > 8 || y < 80) lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Висота липкого блоку → --header-h на <html>
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      setHeight(Math.round(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!height) return;
    const mobile = window.matchMedia(MOBILE_MQ).matches;
    const visible = mobile && topHidden ? height - TOP_ROW_H : height;
    document.documentElement.style.setProperty("--header-h", `${visible}px`);
  }, [height, topHidden]);

  // Скіп-лінк: фокус на <main> сторінки, інакше — на перший блок після шапки
  const skipToMain = (e) => {
    const target =
      document.querySelector("main") ||
      headerRef.current?.nextElementSibling ||
      document.getElementById("main");
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  };

  const iconBtn =
    "relative inline-flex items-center justify-center min-w-11 min-h-11 rounded-(--r-md) text-(--on-header) hover:bg-(--header-hover)";

  return (
    <>
      <a href="#main" className="skip-link" onClick={skipToMain}>
        Перейти до змісту
      </a>

      {/* Стрічка оголошення: не липка, прокручується зі сторінкою — поза headerRef,
          тому не входить у --header-h */}
      <AnnouncementBar />

      {/* ===== Десктоп: верхня вузька смуга ===== */}
      <div className="hidden lg:block bg-(--header-bg-2) text-(--on-header-2) text-sm">
        <div className="container-x flex items-center justify-between h-10 gap-6">
          <ul className="flex items-center gap-6">
            <li>
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 min-h-10 hover:text-(--on-header)">
                <LuMail aria-hidden="true" /> {EMAIL}
              </a>
            </li>
            <li>
              <a href={PHONE_HREF} className="inline-flex items-center gap-2 min-h-10 hover:text-(--on-header)">
                <LuPhone aria-hidden="true" /> {PHONE}
              </a>
            </li>
          </ul>
          <nav aria-label="Інформація для покупців" className="flex items-center gap-5">
            {showStoresLink && (
              <Link
                to="/stores"
                aria-current={pathname === "/stores" ? "page" : undefined}
                className="min-h-10 inline-flex items-center hover:text-(--on-header)"
              >
                Магазини
              </Link>
            )}
            <Link to="/delivery" className="min-h-10 inline-flex items-center hover:text-(--on-header)">Доставка й оплата</Link>
            <Link to="/returns" className="min-h-10 inline-flex items-center hover:text-(--on-header)">Повернення</Link>
            <Link to="/warranty" className="min-h-10 inline-flex items-center hover:text-(--on-header)">Гарантія</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-1">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} aria-label={s.label} className="inline-flex items-center justify-center min-w-10 min-h-10 hover:text-(--on-header)">
                    <s.Icon aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            {isAuthed ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 min-h-10 text-(--on-header)">
                <LuUser aria-hidden="true" /> {userInfo.name}
              </Link>
            ) : (
              <Link to="/login" className="inline-flex items-center gap-2 min-h-10 text-(--on-header)">
                <LuLogIn aria-hidden="true" /> Вхід
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== Липкий блок шапки ===== */}
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 bg-(--header-bg) text-(--on-header) motion-safe:transition-transform motion-safe:duration-200 ${
          topHidden && !searchOpen ? "max-lg:-translate-y-14" : ""
        }`}
      >
        {/* --- Мобільний верхній рядок --- */}
        <div className="lg:hidden h-14 flex items-center gap-1 px-2">
          <button
            type="button"
            className={iconBtn}
            aria-label="Відкрити меню"
            onClick={() => openMobileMenu()}
          >
            <LuMenu size={24} aria-hidden="true" />
          </button>
          <Link to="/" className="inline-flex items-center min-h-11 mr-auto px-1" aria-label="TechScout — на головну">
            <img className="h-8 w-auto" src="/images/logoTS.png" alt="TechScout" width="96" height="32" />
          </Link>
          <Link to={wishlistTo} className={iconBtn} aria-label={`Обране${wishlist_count ? `, ${wishlist_count}` : ""}`}>
            <LuHeart size={24} aria-hidden="true" />
            <Badge count={wishlist_count} />
          </Link>
          <button type="button" onClick={redirect_card_page} className={iconBtn} aria-label={`Кошик${card_product_count ? `, ${card_product_count}` : ""}`}>
            <LuShoppingCart size={24} aria-hidden="true" />
            <Badge count={card_product_count} />
          </button>
        </div>

        {/* --- Мобільний рядок пошуку (завжди липкий) --- */}
        <div className="lg:hidden h-14 flex items-center px-4 pb-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full h-11 flex items-center gap-2 px-3 rounded-(--r-md) bg-(--surface) text-(--ink-2) border border-(--line) text-left"
            aria-haspopup="dialog"
          >
            <LuSearch size={20} aria-hidden="true" />
            <span className="truncate">{searchValue || "Пошук товарів"}</span>
          </button>
        </div>

        {/* --- Десктопний основний рядок --- */}
        <div className="hidden lg:block">
          <div className="container-x relative h-[72px] flex items-center gap-4 xl:gap-6">
            <Link to="/" className="shrink-0 inline-flex items-center min-h-11" aria-label="TechScout — на головну">
              <img className="h-11 w-auto" src="/images/logoTS.png" alt="TechScout" width="132" height="44" />
            </Link>

            <button
              ref={catalogBtnRef}
              type="button"
              onClick={() => setCatalogOpen((v) => !v)}
              aria-expanded={catalogOpen}
              aria-controls="ts-catalog-menu"
              className="shrink-0 h-12 px-4 inline-flex items-center gap-2 rounded-(--r-md) bg-(--brand) text-(--on-brand) font-semibold hover:bg-(--brand-hover)"
            >
              <LuLayoutGrid size={20} aria-hidden="true" />
              Каталог
              <LuChevronDown
                size={18}
                aria-hidden="true"
                className={`motion-safe:transition-transform ${catalogOpen ? "rotate-180" : ""}`}
              />
            </button>

            <form
              role="search"
              className="flex-1 min-w-0 flex h-12 items-stretch rounded-(--r-md) bg-(--surface) border border-(--line)"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              {/* Вибір категорії злитий із полем; тонкий розділювач праворуч */}
              <CategorySelect
                value={category}
                onChange={setCategory}
                categories={categories}
                className="hidden xl:block w-[200px] shrink-0 after:pointer-events-none after:absolute after:right-0 after:top-2.5 after:bottom-2.5 after:w-px after:bg-(--line)"
              />
              <label htmlFor="ts-search-input" className="sr-only">Пошук товарів</label>
              <input
                id="ts-search-input"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Пошук товарів"
                className="flex-1 min-w-0 bg-transparent px-3 text-(--ink) placeholder:text-(--ink-2) outline-0"
              />
              <button
                type="submit"
                className="shrink-0 px-5 inline-flex items-center gap-2 rounded-r-[9px] bg-(--brand) text-(--on-brand) font-semibold hover:bg-(--brand-hover)"
              >
                <LuSearch size={20} aria-hidden="true" />
                Знайти
              </button>
            </form>

            <nav aria-label="Обране, кошик, кабінет" className="shrink-0 flex items-center gap-1">
              <Link to={wishlistTo} className={`${iconBtn} flex-col px-2 gap-0.5`}>
                <LuHeart size={22} aria-hidden="true" />
                <span className="text-[12px] leading-4 text-(--on-header-2)">Обране</span>
                <Badge count={wishlist_count} />
              </Link>
              <button type="button" onClick={redirect_card_page} className={`${iconBtn} flex-col px-2 gap-0.5`}>
                <LuShoppingCart size={22} aria-hidden="true" />
                <span className="text-[12px] leading-4 text-(--on-header-2)">Кошик</span>
                <Badge count={card_product_count} />
              </button>
              <Link to={accountTo} className={`${iconBtn} flex-col px-2 gap-0.5 max-w-[120px]`}>
                <LuUser size={22} aria-hidden="true" />
                <span className="text-[12px] leading-4 text-(--on-header-2) truncate max-w-full">
                  {isAuthed ? "Кабінет" : "Увійти"}
                </span>
              </Link>
            </nav>

            {/* Мегаменю категорій: фон — зображення з налаштувань (під скримом)
                або стандартний технічний візерунок; контент скролиться всередині */}
            <div
              id="ts-catalog-menu"
              ref={catalogRef}
              hidden={!catalogOpen}
              role="region"
              aria-label="Каталог товарів"
              className="absolute left-6 right-6 2xl:left-8 2xl:right-8 top-full mt-1 z-50 isolate overflow-hidden rounded-(--r-lg) bg-(--surface) text-(--ink) border border-(--line) shadow-(--shadow-3)"
            >
              {catalogBgUrl ? (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${JSON.stringify(catalogBgUrl)})` }}
                  />
                  {/* Скрим: 92% поверхні — контраст тексту ≥4.5 незалежно від фото */}
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-(--surface) opacity-[0.92]" />
                </>
              ) : (
                <CatalogArt />
              )}
              <div className="relative p-4 max-h-[min(70dvh,calc(100dvh_-_var(--header-h)_-_24px))] overflow-y-auto overscroll-contain">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Каталог товарів</h2>
                  <Link to="/products" className="min-h-11 inline-flex items-center px-2 text-(--brand-ink) font-semibold">
                    Усі товари
                  </Link>
                </div>
                {categories.length === 0 ? (
                  <p className="text-(--ink-2)">Категорії завантажуються…</p>
                ) : (
                  <ul className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1">
                    {categories.map((c) => (
                      <li key={c._id || c.name}>
                        <Link
                          to={`/products?category=${encodeURIComponent(c.name)}`}
                          className="flex items-center gap-3 min-h-12 px-3 py-2 rounded-(--r-md) hover:bg-(--surface-2)"
                        >
                          {c.image && (
                            <img src={c.image} alt="" width="32" height="32" loading="lazy" className="w-8 h-8 rounded-full object-cover bg-(--surface-2)" />
                          )}
                          <span className="text-[15px]">{c.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {searchOpen &&
        createPortal(
          <SearchOverlay
            value={searchValue}
            setValue={setSearchValue}
            categories={categories}
            category={category}
            setCategory={setCategory}
            history={history}
            onClearHistory={() => {
              setHistory([]);
              writeHistory([]);
            }}
            onSearch={(v) => search(v, category)}
            onClose={() => setSearchOpen(false)}
          />,
          document.body
        )}
    </>
  );
};

// Повноекранний пошук (мобільні)
const SearchOverlay = ({ value, setValue, categories, category, setCategory, history, onClearHistory, onSearch, onClose }) => {
  const ref = useRef(null);
  const inputRef = useRef(null);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const els = ref.current.querySelectorAll(
        'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])'
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
    },
    [onClose]
  );

  useEffect(() => {
    const prev = document.activeElement;
    const root = document.documentElement;
    root.classList.add("ts-sheet-open");
    inputRef.current?.focus();
    return () => {
      root.classList.remove("ts-sheet-open");
      if (prev && prev.focus) prev.focus();
    };
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Пошук товарів"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[70] h-dvh flex flex-col bg-(--surface) text-(--ink) overscroll-contain"
      style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
    >
      <form
        role="search"
        className="flex items-center gap-2 px-2 py-2 border-b border-(--line)"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(value);
        }}
      >
        <button type="button" onClick={onClose} aria-label="Закрити пошук" className="tap rounded-(--r-md) text-(--ink)">
          <LuArrowLeft size={24} aria-hidden="true" />
        </button>
        <label htmlFor="ts-msearch" className="sr-only">Пошук товарів</label>
        <div className="flex-1 min-w-0 relative">
          <input
            id="ts-msearch"
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Пошук товарів"
            className="w-full h-12 pl-3 pr-11 rounded-(--r-md) bg-(--surface-2) border border-(--line-strong) text-(--ink) placeholder:text-(--ink-2) outline-0 focus:border-(--brand)"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
              aria-label="Очистити поле"
              className="tap absolute right-0 top-1/2 -translate-y-1/2 text-(--ink-2)"
            >
              <LuX size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <button type="submit" aria-label="Знайти" className="tap rounded-(--r-md) bg-(--brand) text-(--on-brand)">
          <LuSearch size={22} aria-hidden="true" />
        </button>
      </form>

      {categories.length > 0 && (
        <div className="px-4 pt-3">
          <CategorySelect
            value={category}
            onChange={setCategory}
            categories={categories}
            variant="chip"
            className="inline-block max-w-full"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-6">
        {history.length > 0 && (
          <section aria-labelledby="ts-sh-title">
            <div className="flex items-center justify-between">
              <h2 id="ts-sh-title" className="text-base font-semibold">Ви шукали</h2>
              <button type="button" onClick={onClearHistory} className="min-h-11 px-2 text-sm text-(--brand-ink) font-semibold">
                Очистити
              </button>
            </div>
            <ul>
              {history.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(h);
                      onSearch(h);
                    }}
                    className="w-full min-h-12 flex items-center gap-3 text-left text-(--ink)"
                  >
                    <LuHistory size={20} aria-hidden="true" className="text-(--ink-2) shrink-0" />
                    <span className="truncate">{h}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {categories.length > 0 && (
          <section aria-labelledby="ts-sc-title">
            <h2 id="ts-sc-title" className="text-base font-semibold mb-3">Популярні категорії</h2>
            <ul className="flex flex-wrap gap-2">
              {categories.slice(0, 16).map((c) => (
                <li key={c._id || c.name}>
                  <Link
                    to={`/products?category=${encodeURIComponent(c.name)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 min-h-11 px-3 rounded-full border border-(--line) bg-(--surface) text-(--ink) text-[15px]"
                  >
                    {c.image && <img src={c.image} alt="" width="24" height="24" loading="lazy" className="w-6 h-6 rounded-full object-cover" />}
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default Header;
