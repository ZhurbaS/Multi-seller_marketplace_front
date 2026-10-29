import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { place_order } from "../store/reducers/orderSlice";
import toast from "react-hot-toast";

const Shipping = () => {
  const location = useLocation();
  // Сторінку відкрили напряму (без кошика) — повертаємо в кошик
  if (!location.state?.products) return <Navigate to="/card" replace />;
  return <ShippingForm state={location.state} />;
};

const ShippingForm = ({ state: routeState }) => {
  const { products, price, items, order_discount, total, coupon, coupon_discount, couponCode } = routeState;
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
    // Тип доставки зберігаємо в замовленні; оплачує доставку покупець перевізнику при отриманні
    deliveryType: "nova_poshta_warehouse",
  });

  // Покупець: фізична особа або юридична особа / ФОП (реквізити потрібні для рахунку й документів).
  // Остаточну перевірку (в т.ч. контрольної цифри ЄДРПОУ) робить сервер.
  const [buyer, setBuyer] = useState({
    kind: "individual",
    companyName: "",
    edrpou: "",
    ipn: "",
  });
  const buyerHandle = (e) =>
    setBuyer({ ...buyer, [e.target.name]: e.target.value.replace(/^\s+/, "") });

  const buyerError = () => {
    if (buyer.kind !== "company") return "";
    if (buyer.companyName.trim().length < 2) return "Вкажіть назву організації";
    const code = buyer.edrpou.replace(/\s/g, "");
    if (!/^\d{8}$|^\d{10}$/.test(code)) return "Код ЄДРПОУ — 8 цифр (для ФОП — 10 цифр РНОКПП)";
    const ipn = buyer.ipn.replace(/\s/g, "");
    if (ipn && !/^\d{10}$|^\d{12}$/.test(ipn)) return "ІПН — 12 цифр (платник ПДВ) або 10 цифр";
    return "";
  };

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const save = (e) => {
    e.preventDefault();
    const { name, address, phone, post, district, city, area } = state;
    const err = buyerError();
    if (err) return toast.error(err);
    if (name && address && phone && post && district && city && area) {
      setRes(true);
    }
  };

  const placeOrder = () => {
    dispatch(
      place_order({
        price,
        products,
        items,
        shippingInfo: state,
        couponCode,
        buyer,
        userId: userInfo.id,
        navigate,
      })
    );
  };

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
                        <div className="flex flex-col gap-2 mb-4 text-[var(--text-ship)]">
                          <label className="font-semibold">Замовляю як</label>
                          <div className="flex gap-5 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="kind"
                                checked={buyer.kind === "individual"}
                                onChange={() => setBuyer({ ...buyer, kind: "individual" })}
                              />
                              Фізична особа
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="kind"
                                checked={buyer.kind === "company"}
                                onChange={() => setBuyer({ ...buyer, kind: "company" })}
                              />
                              Юридична особа / ФОП
                            </label>
                          </div>
                          {buyer.kind === "company" && (
                            <div className="flex flex-col gap-2 mt-1">
                              <input
                                onChange={buyerHandle}
                                value={buyer.companyName}
                                name="companyName"
                                maxLength={200}
                                placeholder='Повна назва організації, напр. ТОВ "Ромашка"'
                                className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                              />
                              <div className="flex max-md:flex-col gap-2">
                                <input
                                  onChange={buyerHandle}
                                  value={buyer.edrpou}
                                  name="edrpou"
                                  inputMode="numeric"
                                  maxLength={10}
                                  placeholder="Код ЄДРПОУ (8 цифр) / РНОКПП ФОП"
                                  className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                                />
                                <input
                                  onChange={buyerHandle}
                                  value={buyer.ipn}
                                  name="ipn"
                                  inputMode="numeric"
                                  maxLength={12}
                                  placeholder="ІПН (якщо платник ПДВ)"
                                  className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                                />
                              </div>
                              <span className="text-sm opacity-70">
                                Реквізити потрібні для виставлення рахунку й документів. Умови повернення для
                                юридичних осіб можуть відрізнятися від умов для фізичних осіб.
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 mb-3 text-[var(--text-ship)]">
                          <label htmlFor="deliveryType">Спосіб доставки</label>
                          <select
                            onChange={inputHandle}
                            value={state.deliveryType}
                            name="deliveryType"
                            id="deliveryType"
                            className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md"
                          >
                            <option value="nova_poshta_warehouse">
                              Нова пошта — у відділення
                            </option>
                            <option value="nova_poshta_courier">
                              Нова пошта — кур'єр
                            </option>
                            <option value="ukrposhta">Укрпошта</option>
                            <option value="pickup">Самовивіз</option>
                          </select>
                          <span className="text-sm opacity-70">
                            Вартість доставки не входить у замовлення: її
                            оплачуєте ви перевізнику при отриманні посилки.
                          </span>
                        </div>
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
                      {buyer.kind === "company" && (
                        <p className="text-[var(--text-ship)] text-sm">
                          Покупець: {buyer.companyName}, ЄДРПОУ {buyer.edrpou}
                          {buyer.ipn ? `, ІПН ${buyer.ipn}` : ""}
                        </p>
                      )}
                      {userInfo?.email && (
                        <p className="text-[var(--text-ship)] text-sm">
                          Email адреса: {userInfo.email}
                        </p>
                      )}
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
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between w-5/12 max-sm:w-full max-sm:mt-3">
                          <div className="pl-4 max-sm:pl-0">
                            <h2 className="text-lg text-[var(--text-card-price)] ">
                              ₴{pt.unitPrice ?? pt.productInfo.price} / шт
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
                            {pt.preorder && (
                              <p className="text-xs text-orange-600">
                                Передзамовлення
                              </p>
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
                  {order_discount?.amount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Знижка за сумою (−{order_discount.percent}%)</span>
                      <span>−₴{order_discount.amount}</span>
                    </div>
                  )}
                  {coupon?.status === "applied" && coupon_discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Купон {coupon.code}</span>
                      <span>−₴{coupon_discount}</span>
                    </div>
                  )}
                  <p className="text-sm">
                    Доставку оплачує покупець перевізнику при отриманні.
                  </p>

                  <div className="flex justify-between items-center ">
                    <span>Всього до сплати</span>
                    <span className="text-lg text-[var(--text-card-sum)]">
                      ₴{total ?? price}
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
