import React, { useEffect } from "react";
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
} from "../store/reducers/cardSlice";
import toast from "react-hot-toast";

const Card = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const {
    card_products,
    card_product_count,
    price,
    successMessage,
    buy_product_item,
    shipping_fee,
    outofstock_products,
  } = useSelector((state) => state.card);

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(get_card_products(userInfo.id));
  }, []);

  const redirect = () => {
    navigate("/shipping", {
      state: {
        products: card_products,
        price: price,
        shipping_fee: shipping_fee,
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

  const inc = (quantity, stock, card_id) => {
    const temp = quantity + 1;
    if (temp <= stock) {
      dispatch(quantity_inc(card_id));
    }
  };

  const dec = (quantity, card_id) => {
    const temp = quantity - 1;
    if (temp !== 0) {
      dispatch(quantity_dec(card_id));
    }
  };

  return (
    <div>
      <Header />
      <section className="bg-[url('http://localhost:5173/images/banner/shop.png')] h-[220px] mt-6 bg-cover bg-no-repeat relative bg-left">
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
          {card_products.length > 0 || outofstock_products > 0 ? (
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
                                  className="w-[80px] h-[80px]"
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
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between w-5/12 max-sm:w-full max-sm:mt-3">
                              <div className="pl-4 max-sm:pl-0">
                                {pt.productInfo.discount &&
                                pt.productInfo.discount > 0 ? (
                                  <>
                                    <h2 className="text-lg text-[var(--text-card-price)] ">
                                      ₴
                                      {pt.productInfo.price -
                                        Math.floor(
                                          (pt.productInfo.price *
                                            pt.productInfo.discount) /
                                            100
                                        )}
                                    </h2>
                                    <p className="line-through text-[var(--text-card-priceOrdinary)]">
                                      ₴{pt.productInfo.price}
                                    </p>
                                    <p>-{pt.productInfo.discount}%</p>
                                  </>
                                ) : (
                                  <h2 className="text-lg text-[var(--text-card-priceOrdinary)] ">
                                    ₴{pt.productInfo.price}
                                  </h2>
                                )}
                              </div>
                              <div className="flex gap-2 flex-col">
                                <div className="flex bg-[var(--bg-card-btn)] h-[30px] justify-center items-center text-xl">
                                  <div
                                    onClick={() => dec(pt.quantity, pt._id)}
                                    className="px-3 cursor-pointer"
                                  >
                                    -
                                  </div>
                                  <div className="px-3">{pt.quantity}</div>
                                  <div
                                    onClick={() =>
                                      inc(
                                        pt.quantity,
                                        pt.productInfo.stock,
                                        pt._id
                                      )
                                    }
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
                                    className="w-[80px] h-[80px]"
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
                                  <div className="flex bg-[var(--bg-card-btn)] h-[30px] justify-center items-center text-xl">
                                    <div
                                      onClick={() => dec(p.quantity, p._id)}
                                      className="px-3 cursor-pointer"
                                    >
                                      -
                                    </div>
                                    <div className="px-3">{p.quantity}</div>
                                    <div
                                      // onClick={() =>
                                      //   inc(
                                      //     p.quantity,
                                      //     p.productInfo.stock,
                                      //     p._id
                                      //   )
                                      // }
                                      className="px-3 cursor-pointer"
                                    >
                                      +
                                    </div>
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
                      <div className="flex justify-between items-center ">
                        <span>Доставка</span>
                        <span>₴{shipping_fee}</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-[var(--bg-card-coupon)] outline-0 focus:border-[var(--border-card-coupon)] rounded-sm"
                          placeholder="Купон зі знижкою"
                        />
                        <button className="px-5 py-[1px] bg-[var(--bg-card-couponApplyBtn)] text-[var(--text-card)] rounded-sm uppercase text-sm">
                          Застосувати
                        </button>
                      </div>

                      <div className="flex justify-between items-center ">
                        <span>Разом до сплати</span>
                        <span className="text-lg text-[var(--text-card-sum)]">
                          ₴{price + shipping_fee}
                        </span>
                      </div>
                      <button
                        onClick={redirect}
                        className="px-5 py-[6px] rounded-sm hover:shadow-red-500/50 hover:shadow-lg bg-[var(--bg-card-processBtn)] text-sm text-[var(--text-card)] uppercase"
                      >
                        Оформити замовлення ({buy_product_item})
                      </button>
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
