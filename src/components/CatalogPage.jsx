import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuArrowUpDown,
  LuCheck,
  LuChevronRight,
  LuLayoutGrid,
  LuList,
  LuSearchX,
  LuSlidersHorizontal,
  LuX,
} from "react-icons/lu";
import Header from "./Header";
import Footer from "./Footer";
import Products from "./products/Products";
import ShopProducts from "./products/ShopProducts";
import Pagination from "./Pagination";
import FilterSheet from "./FilterSheet";
import CatalogFilters from "./CatalogFilters";
import PlacementBanner from "./PlacementBanner";
import {
  price_range_product,
  query_products,
} from "../store/reducers/homeSlice";
import { pluralizeUk } from "../utils/pluralize";

const SORTS = [
  { value: "", label: "За замовчуванням", short: "Сортування" },
  { value: "low-to-high", label: "Спочатку дешевші", short: "Дешевші" },
  { value: "high-to-low", label: "Спочатку дорожчі", short: "Дорожчі" },
];

const goodsWord = (n) => pluralizeUk(n, "товар", "товари", "товарів");
const toNum = (v) => {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const VIEW_KEY = "ts-catalog-view";
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
};

/**
 * Спільна сторінка каталогу для /shops, /products?category=… та /products/search?value=…
 * Стан фільтрів/сортування/сторінки — в URL (category, value, min, max, rating, sort, page).
 * Запит до API та Redux — без змін (query_products з тими ж полями).
 */
const CatalogPage = ({ variant = "shops" }) => {
  const [sp, setSp] = useSearchParams();
  const dispatch = useDispatch();
  const {
    products,
    categories,
    priceRange,
    latest_product,
    totalProduct,
    perPage,
    loading,
  } = useSelector((state) => state.home);

  const category = sp.get("category") || "";
  const searchValue = variant === "search" ? sp.get("value") || "" : "";
  const ratingNum = parseInt(sp.get("rating"), 10);
  const rating = ratingNum >= 1 && ratingNum <= 5 ? ratingNum : "";
  const sortPrice = SORTS.some((s) => s.value && s.value === sp.get("sort"))
    ? sp.get("sort")
    : "";
  const min = toNum(sp.get("min"));
  const max = toNum(sp.get("max"));
  const page = Math.max(1, parseInt(sp.get("page"), 10) || 1);

  const filterKey = [variant, category, searchValue, min, max, rating, sortPrice].join("|");
  const reqKey = `${filterKey}|${page}`;

  const [doneKey, setDoneKey] = useState(null);
  const [kept, setKept] = useState({ key: "", upTo: 0, items: [] });
  const [styles, setStylesState] = useState(readView);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    dispatch(price_range_product());
  }, [dispatch]);

  useEffect(() => {
    // Без min/max — значення за замовчуванням із homeSlice (0…999999) = весь діапазон.
    const req = dispatch(
      query_products({
        low: min ?? undefined,
        high: max ?? undefined,
        category,
        rating,
        sortPrice,
        pageNumber: page,
        ...(variant === "search" ? { searchValue } : {}),
      })
    );
    req.finally(() => setDoneKey(reqKey));
  }, [dispatch, reqKey, min, max, category, rating, sortPrice, page, variant, searchValue]);

  const isLoading = loading || doneKey !== reqKey;
  const keptValid =
    kept.key === filterKey && kept.upTo === page - 1 && kept.items.length > 0;
  const visible = keptValid
    ? isLoading
      ? kept.items
      : [...kept.items, ...products]
    : isLoading
    ? []
    : products;

  const total = Number(totalProduct) || 0;
  const per = Number(perPage) || 12;
  const totalPages = Math.max(1, Math.ceil(total / per));
  const remaining = Math.max(0, total - page * per);

  /* ---------- URL ---------- */
  const update = useCallback(
    (patch, { keepPage = false } = {}) => {
      const next = new URLSearchParams(sp);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      });
      if (!keepPage) next.delete("page");
      setSp(next);
    },
    [sp, setSp]
  );

  const hrefForPage = (n) => {
    const next = new URLSearchParams(sp);
    if (n <= 1) next.delete("page");
    else next.set("page", String(n));
    const q = next.toString();
    return q ? `?${q}` : "?";
  };

  const scrollToResults = () => {
    const el = resultsRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(0, top) });
  };

  const showMore = () => {
    setKept({
      key: filterKey,
      upTo: page,
      items: keptValid ? [...kept.items, ...products] : [...products],
    });
    update({ page: page + 1 }, { keepPage: true });
  };

  const setStyles = (v) => {
    setStylesState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* приватний режим — ігноруємо */
    }
  };

  /* ---------- Застосовані фільтри ---------- */
  const fmt = (n) => Number(n || 0).toLocaleString("uk-UA");
  const chips = [];
  if (category)
    chips.push({ id: "category", label: category, clear: () => update({ category: null }) });
  if (min != null || max != null)
    chips.push({
      id: "price",
      label: `₴${fmt(min ?? priceRange.low)} – ₴${fmt(max ?? priceRange.high)}`,
      clear: () => update({ min: null, max: null }),
    });
  if (rating)
    chips.push({
      id: "rating",
      label: rating === 5 ? "Рейтинг 5★" : `Рейтинг ${rating}★`,
      clear: () => update({ rating: null }),
    });
  const activeCount = chips.length;
  const resetAll = () => update({ category: null, min: null, max: null, rating: null });

  const filterProps = {
    categories,
    category,
    onCategory: (v) => update({ category: v }),
    priceRange,
    min,
    max,
    onPrice: (a, b) => update({ min: a, max: b }),
    rating,
    onRating: (v) => update({ rating: v }),
  };

  /* ---------- Заголовки ---------- */
  const title =
    variant === "search"
      ? searchValue
        ? `Пошук: «${searchValue}»`
        : "Пошук товарів"
      : variant === "category" && category
      ? category
      : "Каталог товарів";
  const crumb =
    variant === "search" ? "Пошук" : variant === "category" ? "Категорія" : "Каталог";
  const countText = `${fmt(total)} ${goodsWord(total)}`;
  const sortShort = SORTS.find((s) => s.value === sortPrice)?.short || "Сортування";

  const chipsRow = chips.length > 0 && (
    <ul className="no-scrollbar flex items-center gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible">
      {chips.map((c) => (
        <li key={c.id} className="shrink-0">
          <button
            type="button"
            onClick={c.clear}
            aria-label={`Прибрати фільтр: ${c.label}`}
            className="inline-flex h-9 max-w-[16rem] items-center gap-1 rounded-full border border-(--brand) bg-(--brand-soft) pl-3 pr-2 text-sm font-medium text-(--brand-ink)"
          >
            <span className="truncate">{c.label}</span>
            <LuX size={16} aria-hidden="true" className="shrink-0" />
          </button>
        </li>
      ))}
      <li className="shrink-0">
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex h-11 items-center px-2 text-sm font-semibold text-(--brand-ink) underline-offset-2 hover:underline"
        >
          Скинути все
        </button>
      </li>
    </ul>
  );

  const viewToggle = (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Вигляд списку">
      {[
        { v: "grid", Icon: LuLayoutGrid, label: "Сітка" },
        { v: "list", Icon: LuList, label: "Список" },
      ].map((it) => (
        <button
          key={it.v}
          type="button"
          onClick={() => setStyles(it.v)}
          aria-pressed={styles === it.v}
          aria-label={it.label}
          className={`tap rounded-(--r-md) border ${
            styles === it.v
              ? "border-(--brand) bg-(--brand-soft) text-(--brand-ink)"
              : "border-(--line) bg-(--surface) text-(--ink-2) hover:bg-(--surface-2)"
          }`}
        >
          <it.Icon size={20} aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  const empty = !isLoading && visible.length === 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-(--page)">
      <Header />
      <main id="main" className="flex-1 pb-10">
        <div className="container-x">
          {/* Хлібні крихти + H1 з кількістю */}
          <nav aria-label="Хлібні крихти" className="pt-4 text-sm text-(--ink-2)">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link to="/" className="inline-flex min-h-6 items-center hover:text-(--brand-ink) hover:underline">
                  Головна
                </Link>
              </li>
              <li aria-hidden="true">
                <LuChevronRight size={14} />
              </li>
              {variant === "shops" ? (
                <li aria-current="page" className="text-(--ink)">Каталог</li>
              ) : (
                <>
                  <li>
                    <Link to="/shops" className="inline-flex min-h-6 items-center hover:text-(--brand-ink) hover:underline">
                      Каталог
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <LuChevronRight size={14} />
                  </li>
                  <li aria-current="page" className="max-w-[60vw] truncate text-(--ink)">
                    {variant === "category" && category ? category : crumb}
                  </li>
                </>
              )}
            </ol>
          </nav>
          <h1 className="mt-2 text-[1.375rem] leading-7 font-bold text-(--ink) md:text-[1.75rem] md:leading-9">
            <span className="break-words">{title}</span>{" "}
            <span className="whitespace-nowrap text-base font-normal text-(--ink-2) tabular-nums">
              {isLoading && !keptValid ? (
                <span className="inline-block h-4 w-20 rounded bg-(--surface-2) align-middle motion-safe:animate-pulse" />
              ) : (
                countText
              )}
            </span>
          </h1>

          {/* Мобільний липкий рядок: Фільтри | Сортування | Вигляд */}
          <div className="sticky top-(--header-h) z-30 -mx-4 mt-3 border-b border-(--line) bg-(--page)/95 px-4 py-2 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 text-[0.9375rem] font-semibold text-(--ink)"
              >
                <LuSlidersHorizontal size={20} aria-hidden="true" />
                <span className="truncate">Фільтри</span>
                {activeCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--brand) px-1.5 text-xs font-bold text-(--on-brand)">
                    {activeCount}
                    <span className="sr-only"> активних</span>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSortOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 text-[0.9375rem] font-semibold text-(--ink)"
              >
                <LuArrowUpDown size={20} aria-hidden="true" />
                <span className="truncate">{sortShort}</span>
              </button>
              <button
                type="button"
                onClick={() => setStyles(styles === "grid" ? "list" : "grid")}
                aria-label={styles === "grid" ? "Показати списком" : "Показати сіткою"}
                className="tap shrink-0 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink)"
              >
                {styles === "grid" ? (
                  <LuList size={20} aria-hidden="true" />
                ) : (
                  <LuLayoutGrid size={20} aria-hidden="true" />
                )}
              </button>
            </div>
            {chipsRow && <div className="mt-2">{chipsRow}</div>}
          </div>

          <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:items-start lg:gap-6">
            {/* Бічна колонка фільтрів (lg+) */}
            <aside
              aria-label="Фільтри"
              className="hidden lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:block lg:max-h-[calc(100dvh-var(--header-h)-32px)] lg:overflow-y-auto lg:overscroll-contain"
            >
              <div className="rounded-(--r-lg) border border-(--line) bg-(--surface) p-4">
                <h2 className="mb-3 text-lg font-semibold text-(--ink)">Фільтри</h2>
                <CatalogFilters idPrefix="side" {...filterProps} />
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAll}
                    className="mt-2 h-11 w-full rounded-(--r-md) border border-(--line-strong) font-semibold text-(--ink) hover:bg-(--surface-2)"
                  >
                    Скинути фільтри
                  </button>
                )}
              </div>
              {latest_product?.length > 0 && (
                <div className="mt-6">
                  <Products title="Нові товари" products={latest_product} />
                </div>
              )}
            </aside>

            <section aria-label="Товари" ref={resultsRef} className="min-w-0">
              {/* Рядок сортування / кількості (lg+) */}
              <div className="mb-4 hidden items-center justify-between gap-4 rounded-(--r-lg) border border-(--line) bg-(--surface) px-4 py-2 lg:flex">
                <p className="text-[0.9375rem] text-(--ink-2)" aria-live="polite">
                  {isLoading ? "Завантаження…" : `Знайдено ${countText}`}
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="catalog-sort" className="text-[0.9375rem] text-(--ink-2)">
                    Сортування
                  </label>
                  <select
                    id="catalog-sort"
                    value={sortPrice}
                    onChange={(e) => update({ sort: e.target.value })}
                    className="h-11 rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 font-semibold text-(--ink) focus:border-(--brand)"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {viewToggle}
                </div>
              </div>
              {chipsRow && <div className="mb-4 hidden lg:block">{chipsRow}</div>}

              {!empty && (
                <PlacementBanner placement="catalog_top" category={category} className="mb-4" />
              )}

              {empty ? (
                <div className="flex flex-col items-center rounded-(--r-lg) border border-(--line) bg-(--surface) px-4 py-12 text-center">
                  <LuSearchX size={48} aria-hidden="true" className="text-(--ink-2)" />
                  <h2 className="mt-4 text-lg font-semibold text-(--ink) md:text-[1.375rem]">
                    Нічого не знайдено
                  </h2>
                  <p className="mt-2 max-w-[48ch] text-[0.9375rem] text-(--ink-2)">
                    {searchValue
                      ? `За запитом «${searchValue}» товарів немає. Перевірте написання або спробуйте інше слово.`
                      : "За обраними умовами товарів немає. Змініть або скиньте фільтри."}
                  </p>
                  <div className="mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
                    {activeCount > 0 && (
                      <button
                        type="button"
                        onClick={resetAll}
                        className="h-11 rounded-(--r-md) bg-(--brand) px-5 font-semibold text-(--on-brand) hover:bg-(--brand-hover)"
                      >
                        Скинути фільтри
                      </button>
                    )}
                    {(variant !== "shops" || activeCount > 0) && (
                      <Link
                        to="/shops"
                        className="inline-flex h-11 items-center justify-center rounded-(--r-md) border border-(--line-strong) px-5 font-semibold text-(--ink) hover:bg-(--surface-2)"
                      >
                        Усі товари
                      </Link>
                    )}
                    <Link
                      to="/"
                      className="inline-flex h-11 items-center justify-center rounded-(--r-md) border border-(--line-strong) px-5 font-semibold text-(--ink) hover:bg-(--surface-2)"
                    >
                      На головну
                    </Link>
                  </div>
                </div>
              ) : (
                <ShopProducts
                  products={visible}
                  styles={styles}
                  loading={isLoading}
                  skeletonCount={keptValid ? Math.min(per, 4) : per}
                  layout="sidebar"
                />
              )}

              {!empty && total > 0 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <p className="text-sm text-(--ink-2) tabular-nums">
                    Показано {fmt(visible.length)} з {fmt(total)}
                  </p>
                  {page < totalPages && (
                    <button
                      type="button"
                      onClick={showMore}
                      disabled={isLoading}
                      className="h-12 w-full max-w-sm rounded-(--r-md) border border-(--brand) bg-(--surface) px-5 text-base font-semibold text-(--brand-ink) hover:bg-(--brand-soft) disabled:opacity-60"
                    >
                      {isLoading
                        ? "Завантаження…"
                        : `Показати ще ${Math.min(per, remaining)} ${goodsWord(Math.min(per, remaining))}`}
                    </button>
                  )}
                  <Pagination
                    pageNumber={page}
                    totalItem={total}
                    perPage={per}
                    getHref={hrefForPage}
                    onNavigate={scrollToResults}
                    label="Сторінки каталогу"
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Мобільні: фільтри — повноекранна панель */}
      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={activeCount > 0 ? `Фільтри (${activeCount})` : "Фільтри"}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetAll}
              disabled={activeCount === 0}
              className="h-12 shrink-0 rounded-(--r-md) border border-(--line-strong) px-4 font-semibold text-(--ink) disabled:opacity-50"
            >
              Скинути
            </button>
            <button
              type="button"
              data-autofocus
              onClick={() => {
                setFiltersOpen(false);
                scrollToResults();
              }}
              className="h-12 min-w-0 flex-1 rounded-(--r-md) bg-(--brand) px-4 font-semibold text-(--on-brand) hover:bg-(--brand-hover)"
            >
              {isLoading ? "Показати товари" : `Показати ${countText}`}
            </button>
          </div>
        }
      >
        <CatalogFilters idPrefix="sheet" {...filterProps} />
      </FilterSheet>

      {/* Мобільні: сортування — нижній лист */}
      <FilterSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Сортування"
        variant="bottom"
      >
        <ul className="-mx-2 flex flex-col" role="radiogroup" aria-label="Сортування">
          {SORTS.map((s) => {
            const on = s.value === sortPrice;
            return (
              <li key={s.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-autofocus={on || undefined}
                  onClick={() => {
                    update({ sort: s.value });
                    setSortOpen(false);
                  }}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-(--r-md) px-3 text-left text-base ${
                    on ? "font-semibold text-(--brand-ink)" : "text-(--ink)"
                  } hover:bg-(--surface-2)`}
                >
                  {s.label}
                  {on && <LuCheck size={20} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </FilterSheet>

      <Footer />
    </div>
  );
};

export default CatalogPage;
