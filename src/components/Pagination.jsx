import React from "react";
import { Link } from "react-router-dom";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

// Номери сторінок: 1 … p-1 p p+1 … last (завжди перша й остання).
const buildPages = (current, total, around = 1) => {
  const pages = [];
  const from = Math.max(2, current - around);
  const to = Math.min(total - 1, current + around);
  pages.push(1);
  if (from > 2) pages.push("gap-l");
  for (let i = from; i <= to; i++) pages.push(i);
  if (to < total - 1) pages.push("gap-r");
  if (total > 1) pages.push(total);
  return pages;
};

const base =
  "min-w-11 h-11 px-3 inline-flex items-center justify-center rounded-(--r-md) text-[0.9375rem] font-semibold tabular-nums transition-colors";
const idle =
  "bg-(--surface) border border-(--line) text-(--ink) hover:bg-(--surface-2)";
const active = "bg-(--brand) border border-(--brand) text-(--on-brand)";

const Item = ({
  page,
  children,
  className,
  ariaLabel,
  isCurrent,
  getHref,
  onNavigate,
  setPageNumber,
}) => {
  if (getHref) {
    return (
      <Link
        to={getHref(page)}
        onClick={() => onNavigate?.(page)}
        aria-label={ariaLabel}
        aria-current={isCurrent ? "page" : undefined}
        className={className}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setPageNumber?.(page);
        onNavigate?.(page);
      }}
      aria-label={ariaLabel}
      aria-current={isCurrent ? "page" : undefined}
      className={className}
    >
      {children}
    </button>
  );
};

/**
 * Пагінація.
 * - getHref(page) → якщо передано, кнопки — справжні посилання (?page=N), стан сторінки в URL.
 * - інакше працює як раніше: setPageNumber(page) (напр. у відгуках).
 * showItem лишено для сумісності (кількість номерів визначається автоматично).
 */
const Pagination = ({
  pageNumber,
  setPageNumber,
  totalItem,
  perPage,
  getHref,
  onNavigate,
  label = "Сторінки",
}) => {
  const totalPage = Math.max(1, Math.ceil(totalItem / perPage));
  if (totalPage <= 1) return null;
  const current = Math.min(Math.max(1, pageNumber), totalPage);
  const nav = { getHref, onNavigate, setPageNumber };

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {current > 1 && (
          <li>
            <Item
              {...nav}
              page={current - 1}
              ariaLabel="Попередня сторінка"
              className={`${base} ${idle}`}
            >
              <LuChevronLeft size={20} aria-hidden="true" />
            </Item>
          </li>
        )}
        {buildPages(current, totalPage).map((p) =>
          typeof p === "string" ? (
            <li
              key={p}
              aria-hidden="true"
              className="min-w-6 h-11 inline-flex items-end justify-center pb-2 text-(--ink-2)"
            >
              …
            </li>
          ) : (
            <li key={p}>
              <Item
              {...nav}
                page={p}
                isCurrent={p === current}
                ariaLabel={`Сторінка ${p}`}
                className={`${base} ${p === current ? active : idle}`}
              >
                {p}
              </Item>
            </li>
          )
        )}
        {current < totalPage && (
          <li>
            <Item
              {...nav}
              page={current + 1}
              ariaLabel="Наступна сторінка"
              className={`${base} ${idle}`}
            >
              <LuChevronRight size={20} aria-hidden="true" />
            </Item>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
