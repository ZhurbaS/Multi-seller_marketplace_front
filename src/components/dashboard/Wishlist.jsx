import React, { useEffect } from "react";
import { LuHeart, LuShoppingCart } from "react-icons/lu";
import Rating from "../Rating";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  add_to_card,
  get_wishlist_products,
  messageClear,
  remove_wishlist,
} from "../../store/reducers/cardSlice";
import toast from "react-hot-toast";
import { baseUnitPrice } from "../../utils/pricing";
import { PageHeader } from "./Kit";
import { btnCta, cardCls } from "./ui";

const Wishlist = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { errorMessage, successMessage, wishlist } = useSelector(
    (state) => state.card
  );

  useEffect(() => {
    dispatch(get_wishlist_products(userInfo.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const addToCart = (p) =>
    dispatch(add_to_card({ userId: userInfo.id, quantity: 1, productId: p.productId }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Список бажань" subtitle={wishlist.length ? `Товарів: ${wishlist.length}` : undefined} />

      {wishlist.length === 0 ? (
        <div className={`${cardCls} p-6 text-center text-(--ink-2) flex flex-col items-center gap-3`}>
          <LuHeart aria-hidden="true" className="text-3xl" />
          <p>У списку бажань поки немає товарів. Натисніть «♡» на картці товару, щоб додати його сюди.</p>
          <Link to="/shops" className="tap px-4 font-semibold text-(--brand-ink) underline">
            До каталогу
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
          {wishlist.map((p, i) => {
            const price = baseUnitPrice(p);
            return (
              <li key={p._id || i} className={`${cardCls} overflow-hidden flex flex-col`}>
                <div className="relative aspect-square bg-(--surface)">
                  {p.discount > 0 && (
                    <span className="absolute left-2 top-2 z-10 px-2 py-0.5 rounded-full bg-(--sale) text-(--on-sale) text-xs font-semibold">
                      −{p.discount}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => dispatch(remove_wishlist(p._id))}
                    aria-label={`Видалити зі списку бажань: ${p.name}`}
                    title="Видалити зі списку бажань"
                    className="tap absolute right-1 top-1 z-10 rounded-full bg-(--surface) text-(--sale) shadow-(--shadow-1) hover:bg-(--surface-2)"
                  >
                    <LuHeart aria-hidden="true" className="text-xl fill-current" />
                  </button>
                  <Link to={`/product/details/${p.slug}`} tabIndex={-1} aria-hidden="true" className="block w-full h-full p-2">
                    <img
                      className="w-full h-full object-contain"
                      src={p.image}
                      alt=""
                      width={300}
                      height={300}
                      loading="lazy"
                    />
                  </Link>
                </div>

                <div className="p-3 flex flex-col gap-2 flex-1">
                  <Link
                    to={`/product/details/${p.slug}`}
                    className="text-sm md:text-[0.9375rem] leading-5 font-medium text-(--ink) line-clamp-2 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <Rating ratings={p.rating} />
                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
                    <span className={`price text-lg font-bold ${p.discount > 0 ? "text-(--sale)" : "text-(--price)"}`}>₴{price}</span>
                    {p.discount > 0 && (
                      <span className="price text-sm text-(--ink-2) line-through">₴{p.price}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => addToCart(p)} className={`${btnCta} w-full px-3`}>
                    <LuShoppingCart aria-hidden="true" className="text-lg shrink-0" />
                    <span className="truncate">У кошик</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Wishlist;
