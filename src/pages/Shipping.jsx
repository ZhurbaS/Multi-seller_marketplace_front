import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { place_order } from "../store/reducers/orderSlice";
import toast from "react-hot-toast";
import api from "../api/api";
import Autocomplete from "../components/Autocomplete";
import { get_card_products, set_coupon_code } from "../store/reducers/cardSlice";
import { isValidPhone, nextPhone } from "../utils/phone";

const inputCls =
  "w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md bg-transparent";

const Field = ({ label, name, ...rest }) => (
  <div className="flex flex-col gap-1 w-full">
    <label htmlFor={`f-${name}`} className="text-sm">
      {label}
    </label>
    <input id={`f-${name}`} name={name} type="text" className={inputCls} {...rest} />
  </div>
);

const Section = ({ n, title, children }) => (
  <div className="bg-[var(--bg-shipSec)] p-5 shadow-sm rounded-md text-[var(--text-ship)]">
    <h2 className="font-bold text-lg mb-3">
      {n}. {title}
    </h2>
    {children}
  </div>
);

const DELIVERY = [
  { id: "nova_poshta_warehouse", title: "У відділення" },
  { id: "nova_poshta_postomat", title: "У поштомат" },
  { id: "nova_poshta_courier", title: "Курєром" },
];

// Сторінку відкрили напряму (без кошика) — повертаємо в кошик
const Shipping = () => {
  const location = useLocation();
  if (!location.state?.products) return <Navigate to="/card" replace />;
  return <Checkout cart={location.state} />;
};

const Checkout = ({ cart }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  // Суми беремо з сервера (з урахуванням промокоду); дані з кошика — поки вантажиться
  const cs = useSelector((state) => state.card);
  const products = cs.card_products?.length ? cs.card_products : cart.products;
  const price = cs.card_products?.length ? cs.price : cart.price;
  const items = cs.card_products?.length ? cs.buy_product_item : cart.items;
  const order_discount = cs.card_products?.length ? cs.order_discount : cart.order_discount;
  const total = cs.card_products?.length ? cs.total : cart.total;
  const { coupon, coupon_discount } = cs;
  const couponCode = coupon?.status === "applied" ? coupon.code : "";
  const [promo, setPromo] = useState(cs.coupon_code || "");

  useEffect(() => {
    dispatch(get_card_products({ userId: userInfo.id, coupon: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPromo = async () => {
    const code = promo.trim();
    if (!code) return;
    dispatch(set_coupon_code(code));
    const res = await dispatch(get_card_products({ userId: userInfo.id, coupon: true }));
    if (res.meta?.requestStatus === "rejected") {
      return toast.error(res.payload?.error || "Не вдалося застосувати промокод. Спробуйте за хвилину");
    }
    const c = res?.payload?.coupon;
    if (c?.status === "applied") toast.success(c.message || "Промокод застосовано");
    else if (c?.message) toast.error(c.message);
  };
  const removePromo = () => {
    setPromo("");
    dispatch(set_coupon_code(""));
    dispatch(get_card_products({ userId: userInfo.id, coupon: true }));
  };

  // Збережені отримувачі й організації; novaPoshta — чи налаштований ключ API Нової пошти
  const [saved, setSaved] = useState({ recipients: [], companies: [] });
  const [npOn, setNpOn] = useState(false);
  useEffect(() => {
    api
      .get("/home/customer/checkout-data")
      .then(({ data }) => {
        setSaved({ recipients: data.recipients || [], companies: data.companies || [] });
        setNpOn(!!data.novaPoshta);
      })
      .catch(() => {});
  }, []);

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: userInfo?.name || "",
    phone: "",
    deliveryType: "nova_poshta_warehouse",
    district: "",
    city: "",
    warehouse: "",
    street: "",
    house: "",
    flat: "",
    cityRef: "",
    settlementRef: "",
    warehouseRef: "",
  });
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const [other, setOther] = useState(false);
  const [recipient, setRecipient] = useState({ lastName: "", firstName: "", middleName: "", phone: "" });
  const [recSel, setRecSel] = useState("new"); // id збереженого отримувача або "new"
  const pickRecipient = (r) => {
    setRecSel(r._id);
    setRecipient({ lastName: r.lastName, firstName: r.firstName, middleName: r.middleName || "", phone: r.phone });
  };
  const newRecipient = () => {
    setRecSel("new");
    setRecipient({ lastName: "", firstName: "", middleName: "", phone: "" });
  };
  const toggleOther = (on) => {
    setOther(on);
    if (on && saved.recipients.length) pickRecipient(saved.recipients[0]);
    else newRecipient();
  };
  const forget = async (kind, id) => {
    try {
      await api.delete(`/home/customer/saved-${kind}/${id}`);
      setSaved((s) => ({
        ...s,
        [kind === "recipient" ? "recipients" : "companies"]: s[kind === "recipient" ? "recipients" : "companies"].filter((x) => x._id !== id),
      }));
      if (kind === "recipient" && recSel === id) newRecipient();
      if (kind === "company" && compSel === id) newCompany();
    } catch {
      toast.error("Не вдалося видалити");
    }
  };
  const setRec = (e) => setRecipient({ ...recipient, [e.target.name]: e.target.value });

  const [comment, setComment] = useState("");

  // Способи оплати. «За рахунком» — безготівковий розрахунок для юросіб: його вибір відкриває реквізити.
  const [methods, setMethods] = useState([]);
  const [method, setMethod] = useState("");
  const [loadingMethods, setLoadingMethods] = useState(true);
  useEffect(() => {
    api
      .get("/pay/methods")
      .then(({ data }) => {
        const list = data.methods || [];
        setMethods(list);
        if (list.length) setMethod(list[0].id);
      })
      .catch(() => toast.error("Не вдалося завантажити способи оплати"))
      .finally(() => setLoadingMethods(false));
  }, []);

  const [company, setCompany] = useState({ companyName: "", edrpou: "", ipn: "" });
  const [compSel, setCompSel] = useState("new");
  const pickCompany = (c) => {
    setCompSel(c._id);
    setCompany({ companyName: c.companyName, edrpou: c.edrpou, ipn: c.ipn || "" });
  };
  const newCompany = () => {
    setCompSel("new");
    setCompany({ companyName: "", edrpou: "", ipn: "" });
  };
  // Обрали «за рахунком» — підставляємо останню збережену організацію
  const chooseMethod = (id) => {
    setMethod(id);
    if (id === "invoice" && compSel === "new" && !company.edrpou && saved.companies.length) pickCompany(saved.companies[0]);
  };
  const setComp = (e) => setCompany({ ...company, [e.target.name]: e.target.value.replace(/^\s+/, "") });
  const isCompany = method === "invoice";

  const fetchCities = useCallback(async (q) => {
    const { data } = await api.get("/np/cities", { params: { q } });
    if (data.enabled === false) setNpOn(false);
    return data.items;
  }, []);
  const fetchWarehouses = useCallback(
    async (q) => {
      const { data } = await api.get("/np/warehouses", {
        params: { cityRef: form.cityRef, q, type: form.deliveryType === "nova_poshta_postomat" ? "postomat" : "warehouse" },
      });
      return data.items;
    },
    [form.cityRef, form.deliveryType]
  );
  const fetchStreets = useCallback(
    async (q) => {
      const { data } = await api.get("/np/streets", { params: { settlementRef: form.settlementRef, q } });
      return data.items;
    },
    [form.settlementRef]
  );

  const error = () => {
    if (form.name.trim().length < 2) return "Вкажіть ім'я";
    if (!isValidPhone(form.phone)) return "Вкажіть коректний номер телефону";
    if (npOn && !form.cityRef) return "Оберіть населений пункт зі списку";
    if (!npOn && form.district.trim().length < 2) return "Вкажіть область";
    if (form.city.trim().length < 2) return "Вкажіть населений пункт";
    const t = form.deliveryType;
    if (t === "nova_poshta_courier") {
      if (form.street.trim().length < 2) return "Вкажіть вулицю";
      if (!form.house.trim()) return "Вкажіть номер будинку";
    } else if (npOn && !form.warehouseRef) {
      return t === "nova_poshta_postomat" ? "Оберіть поштомат зі списку" : "Оберіть відділення зі списку";
    } else if (!form.warehouse.trim()) {
      return t === "nova_poshta_postomat" ? "Вкажіть № поштомата" : "Вкажіть № відділення";
    }
    if (other) {
      if (!recipient.lastName.trim()) return "Вкажіть прізвище отримувача";
      if (!recipient.firstName.trim()) return "Вкажіть ім'я отримувача";
      if (!isValidPhone(recipient.phone)) return "Вкажіть коректний телефон отримувача";
    }
    if (!method) return "Оберіть спосіб оплати";
    if (isCompany) {
      if (company.companyName.trim().length < 2) return "Вкажіть назву організації";
      if (!/^\d{8}$|^\d{10}$/.test(company.edrpou.replace(/\s/g, ""))) return "Код ЄДРПОУ — 8 цифр (для ФОП — 10 цифр РНОКПП)";
      const ipn = company.ipn.replace(/\s/g, "");
      if (ipn && !/^\d{10}$|^\d{12}$/.test(ipn)) return "ІПН — 12 цифр (платник ПДВ) або 10 цифр";
    }
    return "";
  };
  const err = error();

  const submit = async () => {
    if (busy) return;
    if (err) return toast.error(err);
    setBusy(true);
    const t = form.deliveryType;
    const address =
      t === "nova_poshta_courier"
        ? [`вул. ${form.street.trim()}`, `буд. ${form.house.trim()}`, form.flat.trim() && `кв. ${form.flat.trim()}`]
            .filter(Boolean)
            .join(", ")
        : "";
    const res = await dispatch(
      place_order({
        price,
        products,
        items,
        shippingInfo: {
          deliveryType: t,
          name: form.name,
          phone: form.phone,
          district: form.district,
          city: form.city,
          cityRef: form.cityRef,
          warehouseRef: t === "nova_poshta_courier" ? "" : form.warehouseRef,
          warehouse: t === "nova_poshta_courier" ? "" : form.warehouse,
          address,
          recipient: { other, ...recipient },
        },
        couponCode,
        buyer: isCompany ? { kind: "company", ...company } : { kind: "individual" },
        comment,
        paymentMethod: method,
        navigate,
      })
    );
    if (res.meta?.requestStatus === "rejected") setBusy(false);
  };

  const deliveryHint =
    form.deliveryType === "nova_poshta_courier"
      ? "Курєр Нової пошти привезе замовлення за вказаною адресою."
      : form.deliveryType === "nova_poshta_postomat"
      ? "Замовлення чекатиме у поштоматі Нової пошти."
      : "Замовлення чекатиме у відділенні Нової пошти.";

  return (
    <div>
      <Header />
      <section className="bg-[var(--bg-ship)] mt-6">
        <div className="w-[85%] max-lg:w-[90%] max-sm:w-[94%] mx-auto py-10">
          <h1 className="text-2xl font-bold mb-5 text-[var(--text-ship)]">Оформлення замовлення</h1>
          <div className="flex gap-5 max-mdlg:flex-col">
            <div className="w-[62%] max-mdlg:w-full flex flex-col gap-4">
              <Section n={1} title="Контактна інформація">
                <div className="flex max-md:flex-col gap-3">
                  <Field label="Ім'я *" name="name" value={form.name} onChange={set} placeholder="Ім'я" autoComplete="name" />
                  <Field
                    label="Номер телефону *"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: nextPhone(form.phone, e.target.value) })}
                    placeholder="+38(067)-323-57-85"
                  />
                </div>
                {userInfo?.email && <p className="text-sm opacity-70 mt-2">Email: {userInfo.email}</p>}
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input type="checkbox" checked={other} onChange={(e) => toggleOther(e.target.checked)} />
                  Інший отримувач замовлення
                </label>
                {other && (
                  <div className="flex flex-col gap-3 mt-3">
                    {saved.recipients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {saved.recipients.map((r) => (
                          <span
                            key={r._id}
                            className={`inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-md border text-sm cursor-pointer ${
                              recSel === r._id ? "border-[var(--border-ship-foc)] bg-[var(--bg-stripe)] font-semibold" : "border-[var(--border-ship)]"
                            }`}
                            onClick={() => pickRecipient(r)}
                          >
                            <span>
                              {r.lastName} {r.firstName}
                              <span className="block text-xs opacity-70 font-normal">{r.phone}</span>
                            </span>
                            <button
                              type="button"
                              aria-label="Видалити збереженого отримувача"
                              onClick={(e) => {
                                e.stopPropagation();
                                forget("recipient", r._id);
                              }}
                              className="opacity-50 hover:opacity-100 px-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={newRecipient}
                          className={`px-3 py-2 rounded-md border text-sm ${
                            recSel === "new" ? "border-[var(--border-ship-foc)] bg-[var(--bg-stripe)] font-semibold" : "border-[var(--border-ship)]"
                          }`}
                        >
                          + Новий отримувач
                        </button>
                      </div>
                    )}
                    {recSel === "new" && (
                      <>
                        <div className="flex max-md:flex-col gap-3">
                          <Field label="Прізвище *" name="lastName" value={recipient.lastName} onChange={setRec} />
                          <Field label="Ім'я *" name="firstName" value={recipient.firstName} onChange={setRec} />
                        </div>
                        <div className="flex max-md:flex-col gap-3">
                          <Field label="По батькові" name="middleName" value={recipient.middleName} onChange={setRec} />
                          <Field
                            label="Телефон отримувача *"
                            name="rphone"
                            type="tel"
                            inputMode="tel"
                            value={recipient.phone}
                            onChange={(e) => setRecipient({ ...recipient, phone: nextPhone(recipient.phone, e.target.value) })}
                            placeholder="+38(067)-323-57-85"
                          />
                        </div>
                        <p className="text-xs opacity-60">Отримувача буде збережено для наступних замовлень.</p>
                      </>
                    )}
                  </div>
                )}
              </Section>

              <Section n={2} title="Доставка">
                <p className="text-sm mb-2 font-semibold">Нова пошта</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {DELIVERY.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setForm({ ...form, deliveryType: d.id, warehouse: "", warehouseRef: "" })}
                      className={`px-4 py-2 rounded-md border text-sm ${
                        form.deliveryType === d.id
                          ? "border-[var(--border-ship-foc)] font-semibold bg-[var(--bg-stripe)]"
                          : "border-[var(--border-ship)]"
                      }`}
                    >
                      {d.title}
                    </button>
                  ))}
                </div>
                {npOn ? (
                  <div className="mb-3">
                    <Autocomplete
                      label="Населений пункт *"
                      value={form.city}
                      placeholder="Почніть вводити назву міста"
                      onText={(t) => setForm({ ...form, city: t, district: "", cityRef: "", settlementRef: "", warehouseRef: "", warehouse: "", street: "" })}
                      onPick={(c) =>
                        setForm({ ...form, city: c.name, district: c.area, cityRef: c.ref, settlementRef: c.settlementRef, warehouseRef: "", warehouse: "", street: "" })
                      }
                      fetcher={fetchCities}
                    />
                    {form.cityRef && <p className="text-xs opacity-60 mt-1">{form.city}, {form.district} обл.</p>}
                  </div>
                ) : (
                  <div className="flex max-md:flex-col gap-3 mb-3">
                    <Field label="Область *" name="district" value={form.district} onChange={set} placeholder="Київська" />
                    <Field label="Населений пункт *" name="city" value={form.city} onChange={set} placeholder="Київ" />
                  </div>
                )}
                {form.deliveryType === "nova_poshta_courier" ? (
                  <div className="flex max-md:flex-col gap-3">
                    {npOn ? (
                      <Autocomplete
                        label="Вулиця *"
                        value={form.street}
                        disabled={!form.settlementRef}
                        placeholder={form.settlementRef ? "Почніть вводити назву вулиці" : "Спершу оберіть населений пункт"}
                        onText={(t) => setForm({ ...form, street: t })}
                        onPick={(st) => setForm({ ...form, street: st.name })}
                        fetcher={fetchStreets}
                      />
                    ) : (
                      <Field label="Вулиця *" name="street" value={form.street} onChange={set} />
                    )}
                    <Field label="Будинок *" name="house" value={form.house} onChange={set} />
                    <Field label="Квартира" name="flat" value={form.flat} onChange={set} />
                  </div>
                ) : npOn ? (
                  <Autocomplete
                    label={form.deliveryType === "nova_poshta_postomat" ? "Поштомат *" : "Відділення *"}
                    value={form.warehouse}
                    disabled={!form.cityRef}
                    loadOnFocus
                    placeholder={form.cityRef ? "Введіть адресу або номер відділення" : "Спершу оберіть населений пункт"}
                    onText={(t) => setForm({ ...form, warehouse: t, warehouseRef: "" })}
                    onPick={(w) => setForm({ ...form, warehouse: w.title, warehouseRef: w.ref })}
                    fetcher={fetchWarehouses}
                  />
                ) : (
                  <Field
                    label={form.deliveryType === "nova_poshta_postomat" ? "№ поштомата *" : "№ відділення *"}
                    name="warehouse"
                    value={form.warehouse}
                    onChange={set}
                    placeholder="Напр. 12"
                  />
                )}
                <p className="text-sm opacity-70 mt-3">
                  {deliveryHint} Вартість доставки — за тарифами перевізника (оплачується при отриманні).
                </p>
              </Section>

              <Section n={3} title="Оплата">
                {loadingMethods ? (
                  <p>Завантаження...</p>
                ) : methods.length === 0 ? (
                  <p>Наразі способи оплати недоступні. Зверніться до адміністратора.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {methods.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 border border-[var(--border-payStripe)] rounded-md cursor-pointer p-3 ${
                          method === m.id ? "bg-[var(--bg-stripe)]" : ""
                        }`}
                      >
                        <input type="radio" name="paymentMethod" checked={method === m.id} onChange={() => chooseMethod(m.id)} />
                        <span>{m.id === "invoice" ? "Безготівковий розрахунок для юросіб" : m.title}</span>
                      </label>
                    ))}
                  </div>
                )}
                {isCompany && (
                  <div className="flex flex-col gap-3 mt-4">
                    {saved.companies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {saved.companies.map((c) => (
                          <span
                            key={c._id}
                            className={`inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-md border text-sm cursor-pointer ${
                              compSel === c._id ? "border-[var(--border-ship-foc)] bg-[var(--bg-stripe)] font-semibold" : "border-[var(--border-ship)]"
                            }`}
                            onClick={() => pickCompany(c)}
                          >
                            <span>
                              {c.companyName}
                              <span className="block text-xs opacity-70 font-normal">ЄДРПОУ {c.edrpou}</span>
                            </span>
                            <button
                              type="button"
                              aria-label="Видалити збережену організацію"
                              onClick={(e) => {
                                e.stopPropagation();
                                forget("company", c._id);
                              }}
                              className="opacity-50 hover:opacity-100 px-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={newCompany}
                          className={`px-3 py-2 rounded-md border text-sm ${
                            compSel === "new" ? "border-[var(--border-ship-foc)] bg-[var(--bg-stripe)] font-semibold" : "border-[var(--border-ship)]"
                          }`}
                        >
                          + Нова організація
                        </button>
                      </div>
                    )}
                    {compSel === "new" && (<>
                    <Field
                      label="Назва організації *"
                      name="companyName"
                      value={company.companyName}
                      onChange={setComp}
                      maxLength={200}
                      placeholder='ТОВ "Ромашка"'
                    />
                    <div className="flex max-md:flex-col gap-3">
                      <Field label="ЄДРПОУ *" name="edrpou" value={company.edrpou} onChange={setComp} inputMode="numeric" maxLength={10} placeholder="8 цифр (ФОП — РНОКПП, 10 цифр)" />
                      <Field label="ІПН (якщо платник ПДВ)" name="ipn" value={company.ipn} onChange={setComp} inputMode="numeric" maxLength={12} />
                    </div>
                    <p className="text-sm opacity-70">
                      Ми виставимо рахунок (PDF) і надішлемо його на пошту; він також буде в кабінеті. Умови повернення для
                      юросіб можуть відрізнятися від умов для фізосіб.
                    </p>
                    </>)}
                  </div>
                )}
              </Section>

              <Section n={4} title="Коментар до замовлення">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                  rows={3}
                  placeholder="Залиште коментар для зв'язку або побажання до замовлення"
                  className={inputCls}
                />
                <div className="text-xs opacity-60 text-right">{comment.length}/1000</div>
              </Section>
            </div>

            <div className="w-[38%] max-mdlg:w-full">
              <div className="bg-[var(--bg-cardStock)] p-4 text-[var(--text-card-shopTitle)] flex flex-col gap-3 rounded-md sticky top-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Товари</h2>
                  <Link to="/card" className="text-sm text-[var(--text-shipChange)]">
                    Редагувати товари
                  </Link>
                </div>
                <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto">
                  {products.flatMap((g) =>
                    g.products.map((pt) => (
                      <div key={pt.productInfo._id} className="flex gap-3">
                        <img className="w-[56px] h-[56px] object-contain" src={pt.productInfo.images[0]} alt="" />
                        <div className="flex-1 text-sm">
                          <div className="font-semibold leading-tight">{pt.productInfo.name}</div>
                          <div className="opacity-80">
                            {pt.quantity} шт × ₴{pt.unitPrice ?? pt.productInfo.price}
                            {pt.productInfo.discount > 0 && (
                              <span className="line-through ml-2 opacity-60">₴{pt.productInfo.price}</span>
                            )}
                          </div>
                          {pt.preorder && <div className="text-xs text-orange-600">Передзамовлення</div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <hr className="opacity-20" />
                <div className="flex justify-between text-sm">
                  <span>
                    {items} {items === 1 ? "товар" : items >= 2 && items <= 4 ? "товари" : "товарів"} на суму
                  </span>
                  <span>₴{price}</span>
                </div>
                {order_discount?.amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Знижка за сумою (−{order_discount.percent}%)</span>
                    <span>−₴{order_discount.amount}</span>
                  </div>
                )}
                {coupon?.status === "applied" && coupon_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Купон {coupon.code}</span>
                    <span>−₴{coupon_discount}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      maxLength={32}
                      placeholder="Промокод"
                      className="flex-1 min-w-0 px-3 py-[6px] border border-slate-300 outline-none text-sm text-black rounded-md"
                    />
                    {coupon?.status === "applied" ? (
                      <button type="button" onClick={removePromo} className="px-3 py-[6px] border text-sm rounded-md">
                        Прибрати
                      </button>
                    ) : (
                      <button type="button" onClick={applyPromo} className="px-3 py-[6px] border text-sm rounded-md">
                        Застосувати
                      </button>
                    )}
                  </div>
                  {coupon?.status === "not_applied" && <p className="text-xs text-orange-600">{coupon.message}</p>}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Доставка</span>
                  <span>за тарифами перевізника</span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>Всього до сплати</span>
                  <span className="text-xl text-[var(--text-card-sum)]">₴{total ?? price}</span>
                </div>
                <button
                  onClick={submit}
                  disabled={busy}
                  className="px-5 py-3 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)] font-semibold uppercase disabled:opacity-60"
                >
                  {busy ? "Зачекайте..." : "Підтвердити замовлення"}
                </button>
                {err && <p className="text-xs opacity-70">Щоб підтвердити: {err.charAt(0).toLowerCase() + err.slice(1)}</p>}
                <p className="text-xs opacity-60">
                  Підтверджуючи замовлення, ви погоджуєтесь з умовами обробки персональних даних.
                </p>
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
