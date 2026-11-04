import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuChevronRight,
  LuMinus,
  LuPencil,
  LuPlus,
  LuShoppingCart,
  LuStore,
  LuTicket,
  LuTrash2,
} from "react-icons/lu";
import {
  get_card_products,
  messageClear,
  delete_card_product,
  quantity_inc,
  quantity_dec,
  add_to_card,
  set_coupon_code,
} from "../store/reducers/cardSlice";
import RecommendedCarousel from "../components/RecommendedCarousel";
import PlacementBanner from "../components/PlacementBanner";
import toast from "react-hot-toast";
import { restockText } from "../utils/pricing";

const pluralItems = (n) =>
  n === 1 ? "товар" : n >= 2 && n <= 4 ? "товари" : "товарів";

const Card = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const {
    card_products,
    price,
    successMessage,
    errorMessage,
    buy_product_item,
    order_discount,
    total,
    next_order_discount,
    cart_ttl_days,
    outofstock_products,
    coupon_code,
  } = useSelector((state) => state.card);
  const navigate = useNavigate();
  const [promo, setPromo] = useState(coupon_code || "");

  useEffect(() => {
    dispatch(get_card_products(userInfo?.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Доставка в ціну не входить: її оплачує покупець перевізнику при отриманні.
  const redirect = () => {
    navigate("/shipping", {
      state: {
        products: card_products,
        price: price,
        order_discount,
        total,
        items: buy_product_item,
      },
    });
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      dispatch(get_card_products(userInfo?.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  // Крок зміни кількості (мінімум, кратність) і перевірку наявності робить сервер —
  // у разі відмови покупець бачить повідомлення з причиною.
  const cartProductIds = card_products.flatMap((g) =>
    g.products.map((pt) => String(pt.productInfo._id))
  );
  // Додаємо рекомендований товар (кількість — мінімальне замовлення, визначає сервер)
  const addRecommended = async (productId) => {
    const r = await dispatch(add_to_card({ userId: userInfo.id, productId }));
    // повідомлення (успіх/помилка) показує cardSlice
    if (r.meta?.requestStatus === "fulfilled") dispatch(get_card_products(userInfo.id));
  };

  const inc = (card_id) => dispatch(quantity_inc(card_id));
  const dec = (card_id) => dispatch(quantity_dec(card_id));

  // Кошик рахується БЕЗ купона (див. cardSlice): код лише зберігаємо, сервер перевірить
  // і застосує його на кроці оформлення.
  const savePromo = () => {
    const code = promo.trim();
    if (!code) return;
    dispatch(set_coupon_code(code));
    toast.success("Промокод збережено — його буде застосовано під час оформлення");
  };
  const removePromo = () => {
    setPromo("");
    dispatch(set_coupon_code(""));
  };

  const hasItems = card_products.length > 0;
  const isEmpty = !hasItems && outofstock_products.length === 0;
  const inStockCount = card_products.reduce((sum, item) => sum + item.products.length, 0);

  const iconBtn =
    "tap rounded-(--r-md) text-(--ink) hover:bg-(--surface-2) disabled:opacity-40";

  return (
    <div className={hasItems ? "pb-[calc(76px+var(--sab))] lg:pb-0" : ""}>
      <Header />

      <section className="bg-(--page)">
        <div className="container-x pt-4 pb-8 lg:pt-6 lg:pb-12">
          <nav aria-label="Навігаційний ланцюжок" className="text-sm text-(--ink-2)">
            <ol className="flex items-center gap-1">
              <li>
                <Link to="/" className="inline-flex items-center min-h-11 hover:text-(--brand-ink)">
                  Головна
                </Link>
              </li>
              <li aria-hidden="true">
                <LuChevronRight size={16} />
              </li>
              <li aria-current="page" className="text-(--ink)">
                Кошик
              </li>
            </ol>
          </nav>
          <h1 className="text-[1.375rem] leading-7 md:text-[1.75rem] md:leading-9 font-bold text-(--ink) mb-4">
            Кошик
            {hasItems && (
              <span className="ml-2 text-base font-medium text-(--ink-2)">
                {buy_product_item} {pluralItems(buy_product_item)}
              </span>
            )}
          </h1>

          <PlacementBanner placement="cart_promo" className="mb-4" />

          {isEmpty ? (
            <div className="bg-(--surface) border border-(--line) rounded-(--r-lg) px-4 py-12 flex flex-col items-center text-center gap-4">
              <span className="w-20 h-20 rounded-full bg-(--brand-soft) text-(--brand-ink) flex items-center justify-center">
                <LuShoppingCart size={40} aria-hidden="true" />
              </span>
              <h2 className="text-lg md:text-[1.375rem] font-bold text-(--ink)">Кошик порожній</h2>
              <p className="text-(--ink-2) max-w-[40ch]">
                Додайте товари з каталогу — вони з'являться тут.
              </p>
              <Link
                to="/shops"
                className="inline-flex items-center justify-center h-12 px-6 rounded-(--r-md) bg-(--brand) text-(--on-brand) font-semibold hover:bg-(--brand-hover)"
              >
                До каталогу
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
              {/* ===== Товари ===== */}
              <div className="flex flex-col gap-3 min-w-0">
                {hasItems && (
                  <p className="text-sm font-semibold text-(--success)">
                    Товари в наявності: {inStockCount}
                  </p>
                )}

                {card_products.map((p, gi) => (
                  <section
                    key={gi}
                    aria-label={`Продавець ${p.shopName}`}
                    className="bg-(--surface) border border-(--line) rounded-(--r-lg)"
                  >
                    <h2 className="flex items-center gap-2 px-4 pt-3 pb-2 text-sm font-semibold text-(--ink-2)">
                      <LuStore size={18} aria-hidden="true" />
                      {p.shopName}
                    </h2>
                    <ul className="divide-y divide-(--line)">
                      {p.products.map((pt) => (
                        <li key={pt.productInfo._id} className="p-4 flex gap-3">
                          <Link
                            to={`/product/details/${pt.productInfo.slug}`}
                            className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-(--r-md) bg-(--surface-2) overflow-hidden"
                          >
                            <img
                              className="w-full h-full object-contain"
                              src={pt.productInfo.images[0]}
                              alt={pt.productInfo.name}
                              width={96}
                              height={96}
                              loading="lazy"
                            />
                          </Link>

                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1 min-w-0">
                                <Link
                                  to={`/product/details/${pt.productInfo.slug}`}
                                  className="text-[0.9375rem] leading-5 font-medium text-(--ink) line-clamp-2 hover:text-(--brand-ink)"
                                >
                                  {pt.productInfo.name}
                                </Link>
                                {pt.preorder && (
                                  <span className="block mt-1 text-xs font-medium text-(--warning)">
                                    Передзамовлення — товар очікується
                                  </span>
                                )}
                                {(pt.productInfo.minOrderQty > 1 ||
                                  pt.productInfo.orderStep > 1) && (
                                  <span className="block mt-1 text-xs text-(--ink-2)">
                                    Мін. {pt.productInfo.minOrderQty || 1} шт
                                    {pt.productInfo.orderStep > 1
                                      ? `, крок ${pt.productInfo.orderStep}`
                                      : ""}
                                  </span>
                                )}
                              </div>
                              <div className="flex -mr-2 -mt-2">
                                <Link
                                  to={`/product/details/${pt.productInfo.slug}`}
                                  aria-label={`Змінити параметри: ${pt.productInfo.name}`}
                                  title="Змінити параметри"
                                  className={iconBtn}
                                >
                                  <LuPencil size={20} aria-hidden="true" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => dispatch(delete_card_product(pt._id))}
                                  aria-label={`Видалити: ${pt.productInfo.name}`}
                                  title="Видалити"
                                  className="tap rounded-(--r-md) text-(--danger) hover:bg-(--danger-soft)"
                                >
                                  <LuTrash2 size={20} aria-hidden="true" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
                              <div
                                role="group"
                                aria-label={`Кількість: ${pt.productInfo.name}`}
                                className="inline-flex items-center rounded-(--r-md) border border-(--line-strong) bg-(--surface)"
                              >
                                <button
                                  type="button"
                                  onClick={() => dec(pt._id)}
                                  aria-label="Зменшити кількість"
                                  className={iconBtn}
                                >
                                  <LuMinus size={18} aria-hidden="true" />
                                </button>
                                <span
                                  className="min-w-10 text-center font-semibold tabular-nums"
                                  aria-live="polite"
                                >
                                  {pt.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => inc(pt._id)}
                                  aria-label="Збільшити кількість"
                                  className={iconBtn}
                                >
                                  <LuPlus size={18} aria-hidden="true" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="price text-lg font-bold text-(--price)">₴{pt.lineTotal}</p>
                                <p className="price text-sm text-(--ink-2)">
                                  ₴{pt.unitPrice} / шт
                                  {pt.productInfo.discount > 0 && (
                                    <span className="ml-1 line-through">₴{pt.productInfo.price}</span>
                                  )}
                                </p>
                                {pt.tierPercent > 0 && (
                                  <p className="text-xs font-medium text-(--success)">
                                    знижка за кількість −{pt.tierPercent}%
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                {outofstock_products.length > 0 && (
                  <section
                    aria-label="Немає в наявності"
                    className="bg-(--surface) border border-(--line) rounded-(--r-lg)"
                  >
                    <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-(--danger)">
                      Немає в наявності: {outofstock_products.length}
                    </h2>
                    <ul className="divide-y divide-(--line)">
                      {outofstock_products.map((p, i) => (
                        <li key={i} className="p-4 flex gap-3">
                          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-(--r-md) bg-(--surface-2) overflow-hidden">
                            <img
                              className="w-full h-full object-contain opacity-60"
                              src={p.products[0].images[0]}
                              alt={p.products[0].name}
                              width={96}
                              height={96}
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex gap-2 items-start">
                              <h3 className="flex-1 min-w-0 text-[0.9375rem] leading-5 font-medium text-(--ink-2) line-clamp-2">
                                {p.products[0].name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => dispatch(delete_card_product(p._id))}
                                aria-label={`Видалити: ${p.products[0].name}`}
                                title="Видалити"
                                className="tap -mr-2 -mt-2 rounded-(--r-md) text-(--danger) hover:bg-(--danger-soft)"
                              >
                                <LuTrash2 size={20} aria-hidden="true" />
                              </button>
                            </div>
                            <div className="price text-sm text-(--ink-2)">
                              {p.products[0].discount && p.products[0].discount > 0 ? (
                                <>
                                  <span className="font-semibold text-(--ink)">
                                    ₴
                                    {p.products[0].price -
                                      Math.floor(
                                        (p.products[0].price * p.products[0].discount) / 100
                                      )}
                                  </span>{" "}
                                  <span className="line-through">₴{p.products[0].price}</span>{" "}
                                  <span>-{p.products[0].discount}%</span>
                                </>
                              ) : (
                                <span>₴{p.products[0].price}</span>
                              )}
                            </div>
                            <div className="text-sm text-(--danger)">
                              <p>{p.problem || "Немає в наявності"}</p>
                              <p>Кількість: {p.quantity}</p>
                              {p.products[0].stock <= 0 &&
                                (p.products[0].restockDaysMin || p.products[0].restockDaysMax) && (
                                  <p>Очікується через {restockText(p.products[0])}</p>
                                )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {cartProductIds.length > 0 && (
                  <RecommendedCarousel productIds={cartProductIds} onAdd={addRecommended} />
                )}
              </div>

              {/* ===== Підсумок ===== */}
              {hasItems && (
                <aside
                  aria-label="Підсумок замовлення"
                  className="lg:sticky lg:top-[calc(var(--header-h)+16px)] self-start w-full"
                >
                  <div className="bg-(--surface) border border-(--line) rounded-(--r-lg) p-4 flex flex-col gap-3 text-(--ink)">
                    <h2 className="text-lg md:text-[1.375rem] font-bold">Ваше замовлення</h2>

                    {/* Промокод */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cart-promo" className="text-sm font-medium text-(--ink-2)">
                        Промокод
                      </label>
                      {coupon_code ? (
                        <div className="flex items-center gap-2 min-h-12 px-3 rounded-(--r-md) bg-(--success-soft) text-(--success)">
                          <LuTicket size={20} aria-hidden="true" />
                          <span className="flex-1 min-w-0 font-semibold truncate">{coupon_code}</span>
                          <button
                            type="button"
                            onClick={removePromo}
                            className="min-h-11 px-2 text-sm font-semibold underline text-(--ink)"
                          >
                            Прибрати
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            id="cart-promo"
                            value={promo}
                            onChange={(e) => setPromo(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && savePromo()}
                            maxLength={32}
                            autoComplete="off"
                            autoCapitalize="characters"
                            placeholder="Введіть код"
                            aria-describedby="cart-promo-hint"
                            className="flex-1 min-w-0 h-12 px-3 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) outline-none focus:border-(--brand)"
                          />
                          <button
                            type="button"
                            onClick={savePromo}
                            disabled={!promo.trim()}
                            className="h-12 px-4 rounded-(--r-md) border border-(--brand) text-(--brand-ink) font-semibold hover:bg-(--brand-soft) disabled:opacity-50"
                          >
                            Застосувати
                          </button>
                        </div>
                      )}
                      <p id="cart-promo-hint" className="text-xs text-(--ink-2)">
                        Знижку за промокодом буде розраховано на кроці оформлення.
                      </p>
                    </div>

                    <dl className="flex flex-col gap-2 text-[0.9375rem]">
                      <div className="flex justify-between gap-3">
                        <dt>
                          {buy_product_item} {pluralItems(buy_product_item)}
                        </dt>
                        <dd className="price">₴{price}</dd>
                      </div>
                      {order_discount?.amount > 0 && (
                        <div className="flex justify-between gap-3 text-(--success)">
                          <dt>Знижка за сумою замовлення (−{order_discount.percent}%)</dt>
                          <dd className="price whitespace-nowrap">−₴{order_discount.amount}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt>Доставка</dt>
                        <dd className="text-right text-(--ink-2)">
                          за тарифами перевізника,
                          <br />
                          оплата при отриманні
                        </dd>
                      </div>
                    </dl>

                    {next_order_discount && (
                      <p className="text-sm p-3 rounded-(--r-md) bg-(--success-soft) text-(--success)">
                        Додайте ще на ₴{next_order_discount.remaining} і отримайте знижку{" "}
                        {next_order_discount.percent}% на все замовлення
                      </p>
                    )}

                    <div className="flex justify-between items-baseline gap-3 pt-3 border-t border-(--line)">
                      <span className="font-semibold">Разом</span>
                      <span className="price text-[1.375rem] font-bold text-(--price)">₴{total}</span>
                    </div>

                    <button
                      type="button"
                      onClick={redirect}
                      className="hidden lg:inline-flex items-center justify-center h-12 px-5 rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) text-base font-semibold"
                    >
                      Оформити замовлення ({buy_product_item})
                    </button>
                    <p className="text-xs text-(--ink-2)">
                      Товари зберігаються в кошику {cart_ttl_days} днів. Товар не резервується, доки ви не
                      оформите замовлення.
                    </p>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />

      {/* Липка панель дії (мобільні/планшети) — замість нижньої навігації */}
      {hasItems && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-(--surface) border-t border-(--line) shadow-(--shadow-3)"
          style={{ paddingBottom: "max(12px, var(--sab))" }}
        >
          <div className="container-x pt-3 flex items-center gap-3 min-h-16">
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-(--ink-2)">Разом</span>
              <span className="price text-lg font-bold text-(--price) whitespace-nowrap">₴{total}</span>
            </div>
            <button
              type="button"
              onClick={redirect}
              className="flex-1 h-12 px-4 rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) text-base font-semibold"
            >
              Оформити замовлення
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
