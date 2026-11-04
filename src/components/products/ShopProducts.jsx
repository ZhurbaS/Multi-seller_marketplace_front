import useEnsureUser from "../../hooks/useEnsureUser";
import React, { useEffect } from "react";
import { LuHeart, LuShoppingCart } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  add_to_card,
  add_to_wishlist,
  messageClear,
} from "../../store/reducers/cardSlice";
import toast from "react-hot-toast";
import Rating from "../Rating";
import { baseUnitPrice, restockText } from "../../utils/pricing";

// Сітка каталогу (гайд §2): 2 кол. <600, 3 від 600; без бічних фільтрів — 4/5/6 на xl/2xl/3xl;
// з колонкою фільтрів (lg+): 3 на lg, 4 на xl, 5 на 2xl, 6 на 3xl — картка не вужча ~200px.
const GRID = {
  sidebar:
    "grid-cols-2 min-[600px]:grid-cols-3 mdlg:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6",
  full: "grid-cols-2 min-[600px]:grid-cols-3 mdlg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6",
};
const LIST = "grid-cols-1 2xl:grid-cols-2";

const fmt = (n) => Number(n || 0).toLocaleString("uk-UA");

const SkeletonCard = ({ list }) => (
  <div
    aria-hidden="true"
    className={`flex rounded-(--r-lg) border border-(--line) bg-(--surface) p-2 ${
      list ? "flex-row gap-3" : "flex-col gap-2"
    }`}
  >
    <div
      className={`rounded-(--r-md) bg-(--surface-2) motion-safe:animate-pulse ${
        list ? "aspect-square w-28 shrink-0 sm:w-40" : "aspect-square w-full"
      }`}
    />
    <div className="flex flex-1 flex-col gap-2 p-1">
      <div className="h-4 w-11/12 rounded bg-(--surface-2) motion-safe:animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-(--surface-2) motion-safe:animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-(--surface-2) motion-safe:animate-pulse" />
      <div className="mt-2 h-6 w-1/2 rounded bg-(--surface-2) motion-safe:animate-pulse" />
      <div className="mt-auto h-11 w-full rounded-(--r-md) bg-(--surface-2) motion-safe:animate-pulse" />
    </div>
  </div>
);

const ShopProducts = ({
  styles = "grid",
  products = [],
  loading = false,
  skeletonCount = 8,
  layout = "sidebar",
}) => {
  const dispatch = useDispatch();
  const ensureUser = useEnsureUser();
  const { errorMessage, successMessage } = useSelector((state) => state.card);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

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

  const add_wishlist = async (product) => {
    const uid = await ensureUser();
    if (uid) {
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
    }
  };

  const list = styles === "list";

  return (
    <ul
      className={`grid w-full gap-3 sm:gap-4 ${list ? LIST : GRID[layout] || GRID.sidebar}`}
      aria-busy={loading || undefined}
    >
      {products.map((p, i) => {
        const href = `/product/details/${p.slug}`;
        const discount = Number(p.discount) || 0;
        const price = discount ? baseUnitPrice(p) : p.price;
        const inStock = Number(p.stock) > 0;
        const restock = !inStock ? restockText(p) : "";
        return (
          <li
            key={p._id || i}
            className={`relative flex rounded-(--r-lg) border border-(--line) bg-(--surface) p-2 transition-shadow hover:shadow-(--shadow-2) ${
              list ? "flex-row gap-3" : "flex-col gap-2"
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-(--r-md) bg-(--surface) ${
                list ? "aspect-square w-28 shrink-0 self-start sm:w-40" : "aspect-square w-full"
              }`}
            >
              <Link to={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
                {p.images?.[0] ? (
                  <img
                    className="h-full w-full object-contain"
                    src={p.images[0]}
                    alt=""
                    width="400"
                    height="400"
                    loading={i < 4 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <span className="block h-full w-full bg-(--surface-2)" />
                )}
              </Link>
              {discount > 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-(--r-sm) bg-(--sale) px-1.5 py-0.5 text-xs font-bold text-(--on-sale) tabular-nums">
                  −{discount}%
                </span>
              )}
              {!list && (
                <button
                  type="button"
                  onClick={() => add_wishlist(p)}
                  aria-label={`Додати в обране: ${p.name}`}
                  className="tap absolute right-0 top-0 rounded-full text-(--ink-2) hover:text-(--sale)"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--surface) shadow-(--shadow-1)">
                    <LuHeart size={20} aria-hidden="true" />
                  </span>
                </button>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 px-1 pb-1">
              <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium text-(--ink) sm:text-[0.9375rem]">
                <Link to={href} className="hover:text-(--brand-ink) hover:underline">
                  {p.name}
                </Link>
              </h3>
              <div className="flex items-center gap-1 text-sm">
                <span className="flex" aria-hidden="true">
                  <Rating ratings={p.rating} />
                </span>
                <span className="sr-only">Рейтинг {p.rating || 0} з 5</span>
              </div>
              <p
                className={`text-xs font-medium sm:text-sm ${
                  inStock ? "text-(--success)" : "text-(--ink-2)"
                }`}
              >
                {inStock ? "В наявності" : "Немає в наявності"}
                {restock && (
                  <span className="font-normal"> · поставка {restock}</span>
                )}
              </p>
              <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
                <span className="price text-lg font-bold text-(--price) sm:text-xl">
                  ₴{fmt(price)}
                </span>
                {discount > 0 && (
                  <span className="price text-sm text-(--ink-2) line-through">
                    <span className="sr-only">Стара ціна: </span>₴{fmt(p.price)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => add_card(p._id)}
                  className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-(--r-md) border border-(--brand) bg-(--surface) px-2 text-[0.9375rem] font-semibold text-(--brand-ink) transition-colors hover:bg-(--brand-soft)"
                  aria-label={`У кошик: ${p.name}`}
                >
                  <LuShoppingCart size={20} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">У кошик</span>
                </button>
                {list && (
                  <button
                    type="button"
                    onClick={() => add_wishlist(p)}
                    aria-label={`Додати в обране: ${p.name}`}
                    className="tap shrink-0 rounded-(--r-md) border border-(--line) text-(--ink-2) hover:text-(--sale)"
                  >
                    <LuHeart size={20} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
      {loading &&
        Array.from({ length: skeletonCount }, (_, i) => (
          <li key={`sk-${i}`} aria-hidden="true">
            <SkeletonCard list={list} />
          </li>
        ))}
    </ul>
  );
};

export default ShopProducts;
