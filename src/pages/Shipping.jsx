import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { place_order } from "../store/reducers/orderSlice";
import { getFrontendUrl } from "../api/api";

const Shipping = () => {
  const {
    state: { products, price, shipping_fee, items },
  } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [res, setRes] = useState(false);
  const [state, setState] = useState({
    name: "",
    address: "",
    phone: "",
    post: "",
    district: "",
    city: "",
    area: "",
  });

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const save = (e) => {
    e.preventDefault();
    const { name, address, phone, post, district, city, area } = state;
    if (name && address && phone && post && district && city && area) {
      setRes(true);
    }
  };

  const placeOrder = () => {
    dispatch(
      place_order({
        price,
        products,
        shipping_fee,
        items,
        shippingInfo: state,
        userId: userInfo.id,
        navigate,
      })
    );
  };

  return (
    <div>
      <Header />
      <section
        className={`bg-[url('${getFrontendUrl(
          "/images/banner/shop.png"
        )}')] h-[220px] mt-6 bg-cover bg-no-repeat relative bg-left`}
      >
        <div className="absolute left-0 top-0 w-full h-full bg-[var(--bg-section)]">
          <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto ">
            <div className="flex flex-col justify-center gap-1 items-center h-full w-full text-[var(--text-section)]">
              <h2 className="text-3xl font-bold">Доставка</h2>
              <div className="flex justify-center items-center gap-2 text-2xl w-full">
                <Link to="/">Головна</Link>
                <span className="pt-1">
                  <IoIosArrowForward />
                </span>
                <span>Доставка</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-ship)]">
        <div className="w-[85%] max-lg:w-[90%] max-md:w-[90%] max-sm:w-[90%] mx-auto py-16">
          <div className="w-full flex flex-wrap">
            <div className="w-[67%] max-mdlg:w-full">
              <div className="flex flex-col gap-3">
                <div className="bg-[var(--bg-shipSec)] p-6 shadow-sm rounded-md">
                  <h2 className="text-[var(--text-ship)] font-bold pb-3">
                    Дані для доставки
                  </h2>
                  {!res && (
                    <>
                      <form onSubmit={save}>
                        <div className="flex max-md:flex-col max-md:gap-2 w-full gap-5 text-[var(--text-ship)]">
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="name">Ім'я</label>
                            <input
                              onChange={inputHandle}
                              value={state.name}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="name"
                              id="name"
                              placeholder="Ім'я"
                            />
                          </div>
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="address">Адреса</label>
                            <input
                              onChange={inputHandle}
                              value={state.address}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="address"
                              id="address"
                              placeholder="Адреса"
                            />
                          </div>
                        </div>
                        <div className="flex max-md:flex-col max-md:gap-2 w-full gap-5 text-[var(--text-ship)]">
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="phone">Номер телефону</label>
                            <input
                              onChange={inputHandle}
                              value={state.phone}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="phone"
                              id="phone"
                              placeholder="Номер телефону"
                            />
                          </div>
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="post">Індекс</label>
                            <input
                              onChange={inputHandle}
                              value={state.post}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="post"
                              id="post"
                              placeholder="Індекс"
                            />
                          </div>
                        </div>
                        <div className="flex max-md:flex-col max-md:gap-2 w-full gap-5 text-[var(--text-ship)]">
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="district">Область</label>
                            <input
                              onChange={inputHandle}
                              value={state.district}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="district"
                              id="district"
                              placeholder="Область"
                            />
                          </div>
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="city">Місто</label>
                            <input
                              onChange={inputHandle}
                              value={state.city}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="city"
                              id="city"
                              placeholder="Місто"
                            />
                          </div>
                        </div>
                        <div className="flex max-md:flex-col max-md:gap-2 w-full gap-5 text-[var(--text-ship)]">
                          <div className="flex flex-col gap-1 mb-2 w-full">
                            <label htmlFor="area">Район</label>
                            <input
                              onChange={inputHandle}
                              value={state.area}
                              type="text"
                              className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              name="area"
                              id="area"
                              placeholder="Район"
                            />
                          </div>
                          <div className="flex flex-col gap-1 mt-7 mb-2 w-full">
                            <button className="px-3 py-[6px] rounded-sm hover:shadow-green-500/50 hover:shadow-lg bg-[var(--bg-ship-saveBtn)] text-[var(--text-ship-saveBtn)]">
                              Зберегти
                            </button>
                          </div>
                        </div>
                      </form>
                    </>
                  )}

                  {res && (
                    <div className="flex flex-col gap-1">
                      <h2 className="text-[var(--text-ship)] font-semibold pb-2">
                        Доставити {state.name}
                      </h2>
                      <p>
                        <span className="bg-[var(--bg-shipTo)] text-[var(--text-shipTo)] text-sm font-medium mr-2 px-2 py-1 rounded">
                          Куди:
                        </span>
                        <span>
                          {state.post}, {state.district}, {state.area},{" "}
                          {state.city}, {state.address}, {state.phone}
                        </span>
                        <span
                          onClick={() => setRes(false)}
                          className="text-[var(--text-shipChange)] cursor-pointer"
                        >
                          {" Змінити"}
                        </span>
                      </p>
                      <p className="text-[var(--text-ship)] text-sm">
                        Email адреса: sergij@gmail.com
                      </p>
                    </div>
                  )}
                </div>

                {products.map((p, i) => (
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
                              <div className="px-3">
                                Кількість: {pt.quantity}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-[33%] max-mdlg:w-full">
              <div className="pl-3 max-mdlg:pl-0 max-mdlg:mt-5">
                <div className="bg-[var(--bg-cardStock)] p-3 text-[var(--text-card-shopTitle)] flex flex-col gap-3">
                  <h2 className="text-xl font-bold">Деталі замовлення</h2>
                  <div className="flex justify-between items-center ">
                    <span>Всього товарів ({items}) на суму</span>
                    <span>₴{price}</span>
                  </div>
                  <div className="flex justify-between items-center ">
                    <span>Доставка</span>
                    <span>₴{shipping_fee}</span>
                  </div>
                  <div className="flex justify-between items-center ">
                    <span>Разом до сплати</span>
                    <span>₴{price + shipping_fee}</span>
                  </div>

                  <div className="flex justify-between items-center ">
                    <span>Всього</span>
                    <span className="text-lg text-[var(--text-card-sum)]">
                      ₴{price + shipping_fee}
                    </span>
                  </div>
                  <button
                    onClick={placeOrder}
                    disabled={res ? false : true}
                    className={`px-5 py-[6px] rounded-sm hover:shadow-red-500/50 hover:shadow-lg ${
                      res
                        ? "bg-[var(--bg-card-processBtn)]"
                        : "bg-[var(--bg-placeOrder-notActive)] "
                    }  text-sm text-[var(--text-card)] uppercase`}
                  >
                    Розмістити замовлення
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Shipping;
