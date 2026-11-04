import useEnsureUser from "../../hooks/useEnsureUser";
import React, { useEffect, useId, useRef } from "react";
import { LuCheck, LuChevronLeft, LuChevronRight, LuHeart, LuShoppingCart } from "react-icons/lu";
import Rating from "../Rating";
import AllNav from "./allNav";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  add_to_card,
  add_to_wishlist,
  messageClear,
} from "../../store/reducers/cardSlice";
import toast from "react-hot-toast";
import { baseUnitPrice, restockText } from "../../utils/pricing";

const formatUah = (n) =>
  `₴${(Number(n) || 0).toLocaleString("uk-UA", { maximumFractionDigits: 2 })}`;

// Наявність ТЕКСТОМ (колір — лише підсилення)
export const Availability = ({ product: p }) => {
  if (p.stock > 0)
    return (
      <p className="inline-flex items-center gap-1 text-[0.8125rem] text-(--success)">
        <LuCheck aria-hidden="true" />В наявності
      </p>
    );
  if (p.allowPreorder)
    return <p className="text-[0.8125rem] text-(--ink-2)">Передзамовлення</p>;
  const r = restockText(p);
  return (
    <p className="text-[0.8125rem] text-(--danger)">
      Немає в наявності
      {r && <span className="text-(--ink-2)"> · очікується {r}</span>}
    </p>
  );
};

// Картка товару: фото 1:1, назва в 2 рядки, рейтинг, ціна/стара ціна/знижка,
// наявність, «♡» і «У кошик» ≥44px. Жодного контенту лише за наведенням.
export const ProductCard = ({ product: p, onAdd, onWish }) => {
  const d = Number(p.discount) || 0;
  const url = `/product/details/${p.slug}`;

  return (
    <article className="relative flex flex-col w-full h-full bg-(--surface) border border-(--line) rounded-(--r-md) overflow-hidden motion-safe:transition [@media(hover:hover)]:hover:shadow-(--shadow-2) [@media(hover:hover)]:hover:-translate-y-0.5">
      <div className="relative">
        <Link
          to={url}
          tabIndex={-1}
          aria-hidden="true"
          className="block aspect-square bg-(--surface)"
        >
          <img
            src={p.images?.[0]}
            alt=""
            loading="lazy"
            decoding="async"
            width="300"
            height="300"
            className="w-full h-full object-contain p-2"
          />
        </Link>
        {d > 0 && (
          <span className="absolute left-2 top-2 rounded-(--r-sm) bg-(--sale) text-(--on-sale) text-xs font-bold px-1.5 py-0.5 tabular-nums">
            −{d}%
          </span>
        )}
        {onWish && (
          <button
            type="button"
            onClick={() => onWish(p)}
            aria-label={`Додати «${p.name}» в обране`}
            className="group/w absolute top-0 right-0 w-11 h-11 grid place-items-center"
          >
            <span className="w-9 h-9 grid place-items-center rounded-full bg-(--surface) border border-(--line) text-(--ink-2) text-lg motion-safe:transition-colors [@media(hover:hover)]:group-hover/w:text-(--sale)">
              <LuHeart aria-hidden="true" />
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col flex-1 gap-1.5 px-3 pb-3 pt-1">
        <h3 className="text-sm/5 sm:text-[0.9375rem]/5 font-medium text-(--ink) line-clamp-2 min-h-10 break-words">
          <Link to={url} className="[@media(hover:hover)]:hover:text-(--brand-ink)">
            {p.name}
          </Link>
        </h3>
        <div className="text-sm">
          <Rating ratings={p.rating} showValue />
        </div>
        <div className="mt-auto pt-1">
          {d > 0 && (
            <s className="block text-[0.8125rem] text-(--ink-2) tabular-nums">
              <span className="sr-only">Стара ціна: </span>
              {formatUah(p.price)}
            </s>
          )}
          <p className={`price text-lg/6 sm:text-xl/7 font-bold ${d > 0 ? "text-(--sale)" : "text-(--price)"}`}>
            <span className="sr-only">Ціна: </span>
            {formatUah(baseUnitPrice(p))}
          </p>
          <Availability product={p} />
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(p._id)}
            aria-label={`Додати «${p.name}» у кошик`}
            className="mt-1 w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-(--r-md) bg-(--brand-soft) text-(--brand-ink) text-[0.9375rem] font-semibold motion-safe:transition-colors [@media(hover:hover)]:hover:bg-(--brand) [@media(hover:hover)]:hover:text-(--on-brand)"
          >
            <LuShoppingCart aria-hidden="true" className="text-lg" />
            У кошик
          </button>
        )}
      </div>
    </article>
  );
};

// Сітка каталогу: 2 кол. до 599, 3 від 600, 4 від 1200, 5 від 1536, 6 від 1920
const GRID =
  "grid grid-cols-2 min-[600px]:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-2 sm:gap-3 xl:gap-4";
// Великі картки для компактної вітрини (мало товарів): 2 кол. мобільні, 3 від md, 4 від xl
const LARGE = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 xl:gap-5";
// Горизонтальна стрічка (свайп; на ПК — стрілки): 2,3 → 4 → 5 → 6 карток у видимій частині
const RAIL =
  "flex gap-3 overflow-x-auto snap-x snap-proximity overscroll-x-contain no-scrollbar -mx-4 px-4 scroll-px-4 pb-1 md:mx-0 md:px-0 xl:gap-4";

// Ховаємо «хвіст», щоб у сітці були лише повні ряди
const gridItem = (i) => `flex ${i >= 10 ? "2xl:hidden 3xl:flex" : ""}`;
const railItem = () =>
  "flex shrink-0 snap-start w-[44%] min-[600px]:w-[30%] md:w-[23.5%] xl:w-[18.5%] 2xl:w-[15.5%] 3xl:w-[13%]";

const FeatureProducts = ({
  products = [],
  title = "Популярні товари",
  to,
  layout = "grid",
}) => {
  const dispatch = useDispatch();
  const ensureUser = useEnsureUser();
  const headingId = useId();
  const { errorMessage, successMessage } = useSelector((state) => state.card);

  const add_card = async (id) => {
    const uid = await ensureUser();
    if (uid) {
      dispatch(
        add_to_card({
          userId: uid,
          quantity: 1,
          productId: id,
        })
      );
    }
  };

  // На головній кілька секцій — однаковий id тоста не дає дублювати повідомлення
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, { id: "card-msg" });
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage, { id: "card-msg" });
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  const add_wishlist = async (product) => {
    const uid = await ensureUser();
    if (!uid) return;
    dispatch(
      add_to_wishlist({
        userId: uid,
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        discount: product.discount,
        rating: product.rating,
        slug: product.slug,
        slugBase: product.slugBase,
      })
    );
  };

  const railRef = useRef(null);
  if (!products.length) return null;
  const rail = layout === "rail";
  const large = layout === "large";
  const scrollRail = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const arrow =
    "hidden [@media(hover:hover)]:grid absolute top-1/2 -translate-y-1/2 w-11 h-11 place-items-center rounded-full bg-(--surface) text-(--ink) text-xl shadow-(--shadow-2) hover:bg-(--surface-2) z-10";

  return (
    <section aria-labelledby={headingId}>
      <AllNav title={title} to={to} id={headingId} />
      <div className="relative">
        <ul ref={rail ? railRef : undefined} className={rail ? RAIL : large ? LARGE : GRID}>
          {products.map((p, i) => (
            <li key={p._id || i} className={rail ? railItem(i) : large ? "flex" : gridItem(i)}>
              <ProductCard product={p} onAdd={add_card} onWish={add_wishlist} />
            </li>
          ))}
        </ul>
        {rail && products.length > 3 && (
          <>
            <button type="button" className={`${arrow} -left-3`} onClick={() => scrollRail(-1)} aria-label="Назад">
              <LuChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className={`${arrow} -right-3`} onClick={() => scrollRail(1)} aria-label="Далі">
              <LuChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default FeatureProducts;
