import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay, LuShoppingCart } from "react-icons/lu";
import Rating from "./Rating";
import api from "../api/api";
import useAutoScroll from "../hooks/useAutoScroll";

const money = (p) => {
  const d = Number(p.discount) || 0;
  return d > 0 ? Math.round(p.price * (1 - d / 100) * 100) / 100 : p.price;
};

// Горизонтальна карусель «Рекомендовано для вас». Підбір робить сервер
// (часто купують разом + та сама категорія + популярність; лише товари в наявності).
// Свайп на touch; стрілки — лише на пристроях з наведенням.
// Автопрокрутка кожні 5 с по колу (useAutoScroll: пауза при наведенні/фокусі/дотику,
// кнопка ⏸/▶, вимкнено при prefers-reduced-motion і поза екраном).
const RecommendedCarousel = ({ productIds, onAdd }) => {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const ref = useRef(null);
  const key = [...productIds].sort().join(",");

  useEffect(() => {
    let alive = true;
    if (!key) {
      setItems([]);
      return;
    }
    api
      .get("/home/recommendations", { params: { ids: key } })
      .then(({ data }) => alive && setItems(data.products || []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [key]);

  // Крок = ширина картки + gap; у кінці — на початок, на початку «назад» — у кінець
  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduce ? "auto" : "smooth";
    const first = el.firstElementChild;
    const w = first ? first.getBoundingClientRect().width + 12 : 280;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior });
    else if (dir < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior });
    else el.scrollBy({ left: dir * w, behavior });
  };

  const { paused, toggle, canPlay } = useAutoScroll(ref, () => scroll(1), {
    interval: 5000,
    enabled: items.length > 1,
  });

  if (!items.length) return null;

  const add = async (id) => {
    if (busy) return;
    setBusy(id);
    try {
      await onAdd(id);
    } finally {
      setBusy("");
    }
  };

  const arrow =
    "w-11 h-11 place-items-center shrink-0 rounded-full border border-(--line) bg-(--surface) text-(--ink) text-xl hover:bg-(--surface-2)";

  return (
    <section className="bg-(--surface) p-4 rounded-(--r-md) text-(--ink)" aria-labelledby="rec-title">
      <div className="flex justify-between items-center gap-2 mb-3">
        <h2 id="rec-title" className="text-lg/6 font-bold">Рекомендовано для вас</h2>
        <div className="flex gap-2">
          {canPlay && (
            <button
              type="button"
              onClick={toggle}
              aria-pressed={paused}
              aria-label={paused ? "Відновити автопрокрутку рекомендацій" : "Зупинити автопрокрутку рекомендацій"}
              className={`${arrow} grid`}
            >
              {paused ? <LuPlay aria-hidden="true" className="size-5" /> : <LuPause aria-hidden="true" className="size-5" />}
            </button>
          )}
          <button type="button" onClick={() => scroll(-1)} aria-label="Назад" className={`${arrow} hidden [@media(hover:hover)]:grid`}>
            <LuChevronLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Далі" className={`${arrow} hidden [@media(hover:hover)]:grid`}>
            <LuChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul
        ref={ref}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory overscroll-x-contain scroll-px-4 -mx-4 px-4 pb-2 no-scrollbar"
      >
        {items.map((p) => {
          const d = Number(p.discount) || 0;
          return (
            <li
              key={p._id}
              className="snap-start shrink-0 w-[160px] sm:w-[200px] flex flex-col gap-1.5 bg-(--surface) border border-(--line) rounded-(--r-md) p-3"
            >
              <Link to={`/product/details/${p.slug}`} tabIndex={-1} aria-hidden="true" className="relative block aspect-square">
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="176"
                  height="176"
                  className="w-full h-full object-contain"
                />
                {d > 0 && (
                  <span className="absolute left-0 top-0 rounded-(--r-sm) bg-(--sale) text-(--on-sale) text-xs font-bold px-1.5 py-0.5 tabular-nums">
                    −{d}%
                  </span>
                )}
              </Link>
              {p.reason && <span className="text-xs text-(--ink-2)">{p.reason}</span>}
              <Link
                to={`/product/details/${p.slug}`}
                className="text-sm/5 font-medium line-clamp-2 min-h-10 break-words [@media(hover:hover)]:hover:text-(--brand-ink)"
              >
                {p.name}
              </Link>
              <span className="text-sm">
                <Rating ratings={p.rating} showValue />
              </span>
              <div className="mt-auto">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`price text-lg font-bold ${d > 0 ? "text-(--sale)" : "text-(--price)"}`}>
                    <span className="sr-only">Ціна: </span>₴{money(p)}
                  </span>
                  {d > 0 && (
                    <s className="text-sm text-(--ink-2) tabular-nums">
                      <span className="sr-only">Стара ціна: </span>₴{p.price}
                    </s>
                  )}
                </div>
                {p.packLabel && <div className="text-xs text-(--ink-2)">{p.packLabel}</div>}
                <p className="text-[0.8125rem] text-(--success)">В наявності</p>
                <button
                  type="button"
                  onClick={() => add(p._id)}
                  disabled={busy === p._id}
                  aria-label={busy === p._id ? "Додаємо у кошик" : `Додати «${p.name}» у кошик`}
                  className="mt-2 w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-(--r-md) bg-(--brand-soft) text-(--brand-ink) text-[0.9375rem] font-semibold disabled:opacity-60 [@media(hover:hover)]:hover:bg-(--brand) [@media(hover:hover)]:hover:text-(--on-brand)"
                >
                  <LuShoppingCart aria-hidden="true" className="text-lg" />
                  {busy === p._id ? "Додаємо..." : "У кошик"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default RecommendedCarousel;
