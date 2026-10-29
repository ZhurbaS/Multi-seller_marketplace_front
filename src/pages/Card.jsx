import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import {
  get_card_products,
  messageClear,
  delete_card_product,
  quantity_inc,
  quantity_dec,
  set_coupon_code,
} from "../store/reducers/cardSlice";
import toast from "react-hot-toast";
import { restockText } from "../utils/pricing";

const Card = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const {
    card_products,
    card_product_count,
    price,
    successMessage,
    errorMessage,
    buy_product_item,
    order_discount,
    total,
    next_order_discount,
    cart_ttl_days,
    outofstock_products,
    coupon,
    coupon_code,
    coupon_discount,
  } = useSelector((state) => state.card);
  const [couponInput, setCouponInput] = useState(coupon_code || "");

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(get_card_products(userInfo.id));
  }, []);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    dispatch(set_coupon_code(code));
    const res = await dispatch(get_card_products(userInfo.id));
    if (res.meta?.requestStatus === "rejected") {
      return toast.error(res.payload?.error || "Не вдалося застосувати купон. Спробуйте за хвилину");
    }
    const c = res?.payload?.coupon;
    if (c?.status === "applied") toast.success(c.message || "Купон застосовано");
    else if (c?.message) toast.error(c.message);
  };
  const removeCoupon = () => {
    setCouponInput("");
    dispatch(set_coupon_code(""));
    dispatch(get_card_products(userInfo.id));
  };

  // Доставка в ціну не входить: її оплачує покупець перевізнику при отриманні.
  const redirect = () => {
    navigate("/shipping", {
      state: {
        products: card_products,
        price: price,
        order_discount,
        coupon,
        coupon_discount,
        couponCode: coupon?.status === "applied" ? coupon.code : "",
        total,
        items: buy_product_item,
      },
    });
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      dispatch(get_card_products(userInfo.id));
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [errorMessage]);

  // Крок зміни кількості (мінімум, кратність) і перевірку наявності робить сервер —
  // у разі відмови покупець бачить повідомлення з причиною.
  const inc = (card_id) => dispatch(quantity_inc(card_id));
  const dec = (card_id) => dispatch(quantity_dec(card_id));

  return (
    <div>
      <Header />
      <section
        style={{
          backgroundImage: `url(/images/banner/shop.png)`,
        }}
        className="h-[220px] mt-6 bg-cover bg-no-repeat relative bg-left"
      >
        <div className="absolute left-0 top-0 w-full h-full bg-[var(--bg-section)]">
          <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto ">
            <div className="flex flex-col justify-center gap-1 items-center h-full w-full text-[var(--text-section)]">
              <h2 className="text-3xl font-bold">Кошик</h2>
              <div className="flex justify-center items-center gap-2 text-2xl w-full">
                <Link to="/">Головна</Link>
                <span className="pt-1">
                  <IoIosArrowForward />
                </span>
                <span>Кошик</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-card)] ">
        <div className="w-[85%] max-lg:w-[90%] max-md:w-[90%] max-sm:w-[90%] mx-auto py-16">
          {card_products.length > 0 || outofstock_products.length > 0 ? (
            <div className="flex flex-wrap">
              <div className="w-[67%] max-mdlg:w-full">
                <div className="pr-3 max-mdlg:pr-0">
                  <div className="flex flex-col gap-3">
                    <div className="bg-[var(--bg-cardStock)] p-4">
                      <h2 className="text-md text-[var(--text-cardStock)] font-semibold">
                        Товари в наявності:{" "}
                        {card_products.reduce(
                          (sum, item) => sum + item.products.length,
                          0
                        )}
                      </h2>
                    </div>

                    {card_products.map((p, i) => (
                      <div
                        key={i}
                        className="flex bg-[var(--bg-cardStock)] p-4 flex-col gap-2"
                      >
                        <div className="flex justify-start items-center">
                          <h2 className="text-md text-[var(--text-card-shopTitle)] font-bold">
                            {p.shopName}
                          </h2>
                        </div>
                        {p.products.map((pt, i) => (
                          <div
                            key={pt.productInfo._id}
                            className="w-full flex flex-wrap"
                          >
                            <div className="flex max-sm:w-full gap-2 w-7/12">
                              <div className="flex gap-2 justify-start items-center">
                                <img
                                  className="w-[80px] h-[80px] object-cover"
                                  src={pt.productInfo.images[0]}
                                  alt=""
                                />
                                <div className="pr-4 text-[var(--text-card-shopTitle)]">
                                  <h2 className="text-md font-semibold">
                                    {pt.productInfo.name}
                                  </h2>
                                  <span className="text-sm">
                                    Бренд: {pt.productInfo.brand}
                                  </span>
                                  {pt.preorder && (
                                    <span className="block text-xs text-orange-600">
                                      Передзамовлення — товар очікується
                                    </span>
                                  )}
                                  {(pt.productInfo.minOrderQty > 1 ||
                                    pt.productInfo.orderStep > 1) && (
                                    <span className="block text-xs">
                                      Мін. {pt.productInfo.minOrderQty || 1} шт
                                      {pt.productInfo.orderStep > 1
                                        ? `, крок ${pt.productInfo.orderStep}`
                                        : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between w-5/12 max-sm:w-full max-sm:mt-3">
                              <div className="pl-4 max-sm:pl-0">
                                <h2 className="text-lg text-[var(--text-card-price)] ">
                                  ₴{pt.unitPrice} / шт
                                </h2>
                                {pt.productInfo.discount > 0 && (
                                  <p className="line-through text-[var(--text-card-priceOrdinary)]">
                                    ₴{pt.productInfo.price}
                                  </p>
                                )}
                                {pt.tierPercent > 0 && (
                                  <p className="text-xs text-green-600">
                                    знижка за кількість −{pt.tierPercent}%
                                  </p>
                                )}
                                <p className="font-semibold">
                                  ₴{pt.lineTotal}
                                </p>
                              </div>
                              <div className="flex gap-2 flex-col">
                                <div className="flex bg-[var(--bg-card-btn)] h-[30px] justify-center items-center text-xl">
                                  <div
                                    onClick={() => dec(pt._id)}
                                    className="px-3 cursor-pointer"
                                  >
                                    -
                                  </div>
                                  <div className="px-3">{pt.quantity}</div>
                                  <div
                                    onClick={() => inc(pt._id)}
                                    className="px-3 cursor-pointer"
                                  >
                                    +
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    dispatch(delete_card_product(pt._id))
                                  }
                                  className="px-5 py-[3px] bg-[var(--bg-card-delete)] text-[var(--text-card)]"
                                >
                                  Видалити
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    {outofstock_products.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="bg-[var(--bg-cardStock)] p-4">
                          <h2 className="text-md text-[var(--text-card-outOfStock)] font-semibold">
                            Немає в наявності: {outofstock_products.length}
                          </h2>
                        </div>

                        <div className="bg-[var(--bg-cardStock)] p-4">
                          {outofstock_products.map((p, i) => (
                            <div key={i} className="w-full flex flex-wrap">
                              <div className="flex max-sm:w-full gap-2 w-7/12">
                                <div className="flex gap-2 justify-start items-center">
                                  <img
                                    className="w-[80px] h-[80px] object-cover"
                                    src={p.products[0].images[0]}
                                    alt=""
                                  />
                                  <div className="pr-4 text-[var(--text-card-shopTitle)]">
                                    <h2 className="text-md font-semibold">
                                      {p.products[0].name}
                                    </h2>
                                    <span className="text-sm">
                                      Бренд: {p.products[0].brand}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between w-5/12 max-sm:w-full max-sm:mt-3">
                                <div className="pl-4 max-sm:pl-0">
                                  {p.products[0].discount &&
                                  p.products[0].discount > 0 ? (
                                    <>
                                      <h2 className="text-lg text-[var(--text-card-price)] ">
                                        ₴
                                        {p.products[0].price -
                                          Math.floor(
                                            (p.products[0].price *
                                              p.products[0].discount) /
                                              100
                                          )}
                                      </h2>
                                      <p className="line-through">
                                        ₴{p.products[0].price}
                                      </p>
                                      <p>-{p.products[0].discount}%</p>
                                    </>
                                  ) : (
                                    <h2 className="text-lg text-[var(--text-card-priceOrdinary)] ">
                                      ₴{p.products[0].price}
                                    </h2>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-col">
                                  <div className="text-sm text-[var(--text-card-outOfStock)]">
                                    {p.problem || "Немає в наявності"}
                                    <div>Кількість: {p.quantity}</div>
                                    {p.products[0].stock <= 0 &&
                                      (p.products[0].restockDaysMin ||
                                        p.products[0].restockDaysMax) && (
                                        <div>
                                          Очікується через{" "}
                                          {restockText(p.products[0])}
                                        </div>
                                      )}
                                  </div>
                                  <button
                                    onClick={() =>
                                      dispatch(delete_card_product(p._id))
                                    }
                                    className="px-5 py-[3px] bg-[var(--bg-card-delete)] text-[var(--text-card)]"
                                  >
                                    Видалити
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-[33%] max-mdlg:w-full">
                <div className="pl-3 max-mdlg:pl-0 max-mdlg:mt-5">
                  {card_products.length > 0 && (
                    <div className="bg-[var(--bg-cardStock)] p-3 text-[var(--text-card-shopTitle)] flex flex-col gap-3">
                      <h2 className="text-xl font-bold">Ваше замовлення</h2>
                      <div className="flex justify-between items-center ">
                        <span>
                          {buy_product_item}{" "}
                          {buy_product_item === 1
                            ? "товар"
                            : buy_product_item >= 2 && buy_product_item <= 4
                            ? "товари"
                            : "товарів"}
                        </span>
                        <span>₴{price}</span>
                      </div>
                      {order_discount?.amount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Знижка за сумою замовлення (−{order_discount.percent}%)</span>
                          <span>−₴{order_discount.amount}</span>
                        </div>
                      )}
                      {coupon?.status === "applied" && coupon_discount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Купон {coupon.code}</span>
                          <span>−₴{coupon_discount}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <input
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                            maxLength={32}
                            placeholder="Промокод"
                            className="flex-1 min-w-0 px-3 py-[6px] border border-slate-300 outline-none text-sm text-black"
                          />
                          {coupon?.status === "applied" ? (
                            <button
                              type="button"
                              onClick={removeCoupon}
                              className="px-3 py-[6px] border text-sm"
                            >
                              Прибрати
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={applyCoupon}
                              className="px-3 py-[6px] border text-sm"
                            >
                              Застосувати
                            </button>
                          )}
                        </div>
                        {coupon?.status === "not_applied" && (
                          <p className="text-xs text-orange-600">{coupon.message}</p>
                        )}
                      </div>
                      {next_order_discount && (
                        <p className="text-sm text-green-700">
                          Додайте ще на ₴{next_order_discount.remaining} і
                          отримайте знижку {next_order_discount.percent}% на все
                          замовлення
                        </p>
                      )}
                      <p className="text-sm">
                        Доставку оплачує покупець перевізнику при отриманні
                        (за тарифами перевізника).
                      </p>

                      <div className="flex justify-between items-center ">
                        <span>Разом до сплати</span>
                        <span className="text-lg text-[var(--text-card-sum)]">
                          ₴{total}
                        </span>
                      </div>
                      <button
                        onClick={redirect}
                        className="px-5 py-[6px] rounded-sm hover:shadow-red-500/50 hover:shadow-lg bg-[var(--bg-card-processBtn)] text-sm text-[var(--text-card)] uppercase"
                      >
                        Оформити замовлення ({buy_product_item})
                      </button>
                      <p className="text-xs opacity-70">
                        Товари зберігаються в кошику {cart_ttl_days} днів. Ціни
                        й наявність оновлюються автоматично — товар не
                        резервується, доки ви не оформите замовлення.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Link
                className="px-4 py-1 pb-2 bg-[var(--bg-cardSec)] text-[var(--text-card)]"
                to="/shops"
              >
                Повернутись до покупок
              </Link>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Card;
