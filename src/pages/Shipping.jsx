import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuArrowLeft, LuCheck, LuChevronDown, LuCircleAlert, LuLock, LuLogIn, LuPencil, LuPlus, LuShoppingBag, LuUserRound } from "react-icons/lu";
import { place_order } from "../store/reducers/orderSlice";
import toast from "react-hot-toast";
import useLegalStatus from "../hooks/useLegalStatus";
import useAuthConfig from "../hooks/useAuthConfig";
import api from "../api/api";
import DeliveryFields from "../components/DeliveryFields";
import CartEditModal from "../components/CartEditModal";
import OtpLogin from "../components/OtpLogin";
import GoogleButton from "../components/GoogleButton";
import ConsentCheckboxes from "../components/ConsentCheckboxes";
import { emptyDelivery, deliveryError, fromSaved, toPayload, savedAddressTitle, DELIVERY_TYPES } from "../utils/delivery";
import { get_card_products, set_coupon_code } from "../store/reducers/cardSlice";
import { isValidPhone, nextPhone, maskPhone } from "../utils/phone";
import { set_token } from "../store/reducers/authSlice";
import InvoiceChannelPick from "../components/InvoiceChannelPick";
import { inputCls, labelCls, TextField, Checkbox, RadioCard, SavedChip, FieldError } from "../components/CheckoutUi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Обов'язкові кроки: контакти → доставка → оплата. Коментар і згоди — простими блоками під ними.
const STEPS = 3;
const cardCls = "bg-(--surface) border border-(--line) rounded-(--r-lg) shadow-(--shadow-1)";
const ctaCls =
  "w-full h-12 px-5 rounded-(--r-md) bg-(--cta) text-(--on-cta) hover:bg-(--cta-hover) font-semibold text-base inline-flex items-center justify-center gap-2 disabled:bg-(--cta-disabled) disabled:hover:bg-(--cta-disabled) disabled:cursor-not-allowed";
const nextBtnCls =
  "h-12 px-6 rounded-(--r-md) bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover) font-semibold inline-flex items-center justify-center gap-2 w-full sm:w-auto";
const plural = (n) => (n === 1 ? "товар" : n >= 2 && n <= 4 ? "товари" : "товарів");

// Крок-акордеон: відкритий — форма; завершений — зведення й «Змінити»; майбутній — неактивний заголовок
const Step = ({ n, title, state, complete, summary, hasError, onEdit, optional, children }) => {
  const open = state === "open";
  const future = state === "future";
  return (
    <section id={`step-${n}`} aria-labelledby={`step-${n}-title`} className={`${cardCls} scroll-mt-[calc(var(--header-h)+12px)]`}>
      <div className={`flex items-start gap-3 px-4 sm:px-5 ${open ? "pt-4 sm:pt-5 pb-1" : "py-4"}`}>
        <span
          aria-hidden="true"
          className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            complete && !hasError && !open
              ? "bg-(--success) text-(--on-brand)"
              : open
              ? "bg-(--brand) text-(--on-brand)"
              : "bg-(--surface-2) text-(--ink-2)"
          }`}
        >
          {complete && !hasError && !open ? <LuCheck className="size-4" strokeWidth={3} /> : n}
        </span>
        <div className="flex-1 min-w-0">
          <h2 id={`step-${n}-title`} className={`text-lg leading-6 md:text-[22px] md:leading-[30px] font-semibold ${future ? "text-(--ink-2)" : "text-(--ink)"}`}>
            <span className="sr-only">Крок {n}. </span>
            {title}
            {optional && <span className="ml-2 text-sm font-normal text-(--ink-2)">необов'язково</span>}
          </h2>
          {state === "done" && summary && <div className="mt-1 text-sm text-(--ink-2) break-words">{summary}</div>}
          {state === "done" && hasError && complete && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-(--danger)">
              <LuCircleAlert aria-hidden="true" className="size-4" /> Потрібно доповнити
            </p>
          )}
        </div>
        {state === "done" && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Змінити: ${title}`}
            className="tap -my-2 -mr-2 px-2 gap-1.5 rounded-(--r-md) text-sm font-semibold text-(--brand-ink)"
          >
            <LuPencil aria-hidden="true" className="size-4" /> Змінити
          </button>
        )}
      </div>
      {open && <div className="px-4 sm:px-5 pb-5 pt-3">{children}</div>}
    </section>
  );
};

// Сторінку відкрили напряму (без кошика) — повертаємо в кошик.
// key за id користувача: після входу (OTP / Google) з оформлення форма перезавантажує дані нового акаунта (кошик гостя зливається на сервері).
const Shipping = () => {
  const location = useLocation();
  const uid = useSelector((state) => state.auth.userInfo?.id);
  if (!location.state?.products) return <Navigate to="/card" replace />;
  return <Checkout key={uid || "anon"} cart={location.state} />;
};

const Checkout = ({ cart }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const cs = useSelector((state) => state.card);
  // Два джерела товарів:
  //  • з кошика (Card → «Оформити»): позиції мають _id запису кошика. Після першої відповіді сервера беремо ЛИШЕ Redux
  //    (location.state — знімок на момент переходу, після змін у «Редагувати товари» він застарілий);
  //  • «Купити зараз» (Details): товару немає в кошику на сервері — редагуємо його локально.
  const buyNow = !(cart.products || []).some((g) => (g.products || []).some((pt) => pt._id));
  const [localItems, setLocalItems] = useState(cart.products || []);
  const [cartLoaded, setCartLoaded] = useState(false);
  const fromRedux = !buyNow && cartLoaded;
  const localPrice = localItems.reduce((s, g) => s + g.products.reduce((a, pt) => a + (pt.lineTotal ?? (pt.unitPrice ?? 0) * pt.quantity), 0), 0);
  const localQty = localItems.reduce((s, g) => s + g.products.reduce((a, pt) => a + pt.quantity, 0), 0);
  const products = buyNow ? localItems : fromRedux ? cs.card_products : cart.products;
  const price = buyNow ? localPrice : fromRedux ? cs.price : cart.price;
  const items = buyNow ? localQty : fromRedux ? cs.buy_product_item : cart.items;
  const order_discount = buyNow ? null : fromRedux ? cs.order_discount : cart.order_discount;
  const total = buyNow ? localPrice : fromRedux ? cs.total : cart.total;
  const { coupon, coupon_discount } = cs;
  const couponCode = coupon?.status === "applied" ? coupon.code : "";
  const [promo, setPromo] = useState(cs.coupon_code || "");

  useEffect(() => {
    dispatch(get_card_products({ userId: userInfo.id, coupon: true })).then((r) => {
      if (r.meta?.requestStatus === "fulfilled") setCartLoaded(true);
    });
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
  const [saved, setSaved] = useState({ recipients: [], companies: [], addresses: [] });
  const [npOn, setNpOn] = useState(false);
  useEffect(() => {
    api
      .get("/home/customer/checkout-data")
      .then(({ data }) => {
        setSaved({ recipients: data.recipients || [], companies: data.companies || [], addresses: data.addresses || [] });
        setNpOn(!!data.novaPoshta);
        // Підставляємо збережені контакти й останню адресу (можна змінити)
        setForm((f) => ({
          name: f.name || (data.profile?.name === "Гість" ? "" : data.profile?.name) || "",
          phone: f.phone || (data.profile?.phone ? maskPhone(data.profile.phone) : ""),
        }));
        if (data.addresses?.length) {
          setDel(fromSaved(data.addresses[0]));
          setAddrSel(data.addresses[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const [busy, setBusy] = useState(false);
  // Кошик на сервері став порожнім (видалили всі товари, у т.ч. в іншій вкладці) — повертаємо в кошик.
  // Під час оформлення (busy) не реагуємо: після place_order сервер очищує кошик, а перехід на оплату робить сам thunk.
  const cartEmpty = fromRedux && (cs.card_products?.length || 0) === 0;
  useEffect(() => {
    if (cartEmpty && !busy) navigate("/card", { replace: true });
  }, [cartEmpty, busy, navigate]);
  const [form, setForm] = useState({ name: userInfo?.name && userInfo.name !== "Гість" ? userInfo.name : "", phone: "" });
  // Оформлення без реєстрації: гість вказує e-mail (на нього — підтвердження й рахунок); акаунт створюється тихо
  const needEmail = !!userInfo?.guest && !userInfo?.email;
  const [guestEmail, setGuestEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [del, setDel] = useState(emptyDelivery());
  const [addrSel, setAddrSel] = useState("new");
  const [editOpen, setEditOpen] = useState(false);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Гість: «Оформити без реєстрації» (за замовчуванням) або вхід (код з e-mail / Google)
  const authCfg = useAuthConfig();
  const [authMode, setAuthMode] = useState("guest");
  const [loginAccept, setLoginAccept] = useState(false);

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

  // Публічна оферта: галочка з'являється лише коли адмін її опублікував
  const legal = useLegalStatus();
  const [acceptOferta, setAcceptOferta] = useState(false);

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
  // «За реквізитами»: платник — фізособа (за замовчуванням) або юрособа/ФОП
  const [payerKind, setPayerKind] = useState("individual");
  const [invoiceChannel, setInvoiceChannel] = useState("email");
  const chooseMethod = (id) => {
    setMethod(id);
  };
  const choosePayer = (kind) => {
    setPayerKind(kind);
    if (kind === "company" && compSel === "new" && !company.edrpou && saved.companies.length) pickCompany(saved.companies[0]);
  };
  const setComp = (e) => setCompany({ ...company, [e.target.name]: e.target.value.replace(/^\s+/, "") });
  const isCompany = method === "invoice" && payerKind === "company";

  const error = () => {
    if (form.name.trim().length < 2) return "Вкажіть ім'я";
    if (!isValidPhone(form.phone)) return "Вкажіть коректний номер телефону";
    const de = deliveryError(del, npOn);
    if (de) return de;
    if (other) {
      if (!recipient.lastName.trim()) return "Вкажіть прізвище отримувача";
      if (!recipient.firstName.trim()) return "Вкажіть ім'я отримувача";
      if (!isValidPhone(recipient.phone)) return "Вкажіть коректний телефон отримувача";
    }
    if (!method) return "Оберіть спосіб оплати";
    if (needEmail && !EMAIL_RE.test(guestEmail.trim())) return "Вкажіть коректну електронну пошту";
    if (legal.oferta?.published && !acceptOferta) return "Підтвердьте ознайомлення з публічною офертою";
    if (isCompany) {
      if (company.companyName.trim().length < 2) return "Вкажіть назву організації";
      if (!/^\d{8}$|^\d{10}$/.test(company.edrpou.replace(/\s/g, ""))) return "Код ЄДРПОУ — 8 цифр (для ФОП — 10 цифр РНОКПП)";
      const ipn = company.ipn.replace(/\s/g, "");
      if (ipn && !/^\d{10}$|^\d{12}$/.test(ipn)) return "ІПН — 12 цифр (платник ПДВ) або 10 цифр";
    }
    return "";
  };
  const err = error();
  // Без згоди з офертою кнопку вимкнено (опубліковану оферту потрібно прийняти)
  const ofertaMissing = !!legal.oferta?.published && !acceptOferta;

  // ---------- Помилки полів (ті самі правила, що й error()) — показуються після blur або «Далі» ----------
  const ipnClean = company.ipn.replace(/\s/g, "");
  const fe = {
    name: form.name.trim().length < 2 ? "Вкажіть ім'я" : "",
    phone: !isValidPhone(form.phone) ? "Вкажіть коректний номер телефону" : "",
    guestEmail: needEmail && !EMAIL_RE.test(guestEmail.trim()) ? "Вкажіть коректну електронну пошту" : "",
    lastName: other && !recipient.lastName.trim() ? "Вкажіть прізвище отримувача" : "",
    firstName: other && !recipient.firstName.trim() ? "Вкажіть ім'я отримувача" : "",
    rphone: other && !isValidPhone(recipient.phone) ? "Вкажіть коректний телефон отримувача" : "",
    method: !method ? "Оберіть спосіб оплати" : "",
    companyName: isCompany && company.companyName.trim().length < 2 ? "Вкажіть назву організації" : "",
    edrpou: isCompany && !/^\d{8}$|^\d{10}$/.test(company.edrpou.replace(/\s/g, "")) ? "Код ЄДРПОУ — 8 цифр (для ФОП — 10 цифр РНОКПП)" : "",
    ipn: isCompany && ipnClean && !/^\d{10}$|^\d{12}$/.test(ipnClean) ? "ІПН — 12 цифр (платник ПДВ) або 10 цифр" : "",
  };
  const FIELD_STEP = { name: 1, phone: 1, guestEmail: 1, lastName: 1, firstName: 1, rphone: 1, method: 3, companyName: 3, edrpou: 3, ipn: 3 };
  const stepErr = {
    1: fe.name || fe.phone || fe.guestEmail || fe.lastName || fe.firstName || fe.rphone,
    2: deliveryError(del, npOn),
    3: fe.method || fe.companyName || fe.edrpou || fe.ipn,
  };

  // Чого бракує для підтвердження — одним рядком біля кнопки (ті самі правила, що й error())
  const missing = (() => {
    const m = [];
    if (fe.name) m.push("імені");
    if (fe.phone) m.push("телефону");
    if (fe.guestEmail) m.push("e-mail");
    if (fe.lastName || fe.firstName || fe.rphone) m.push("даних отримувача");
    if (stepErr[2]) {
      if (/населений|область/i.test(stepErr[2])) m.push("населеного пункту");
      else if (del.deliveryType === "nova_poshta_courier") m.push("адреси доставки");
      else m.push(del.deliveryType === "nova_poshta_postomat" ? "поштомата" : "відділення");
    }
    if (fe.method) m.push("способу оплати");
    if (fe.companyName || fe.edrpou || fe.ipn) m.push("реквізитів організації");
    if (ofertaMissing) m.push("згоди з офертою");
    return m;
  })();
  const missingText = missing.length
    ? `Ще бракує ${missing.length > 1 ? `${missing.slice(0, -1).join(", ")} і ${missing[missing.length - 1]}` : missing[0]}`
    : err;
  const [tried, setTried] = useState(false); // натискали «Підтвердити» з помилками
  const showMissing = !!missingText && (ofertaMissing || tried);
  const [touched, setTouched] = useState({});
  const [showErr, setShowErr] = useState({});
  const blur = (k) => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const fieldErr = (k) => (touched[k] || showErr[FIELD_STEP[k]] ? fe[k] : "");

  // ---------- Кроки ----------
  const [active, setActive] = useState(1);
  const [reached, setReached] = useState(1);
  const scrollTo = useRef(0);
  const focusInvalid = useRef(0);
  useEffect(() => {
    if (scrollTo.current) {
      document.getElementById(`step-${scrollTo.current}`)?.scrollIntoView({ block: "start" });
      scrollTo.current = 0;
    }
    if (focusInvalid.current) {
      document.querySelector(`#step-${focusInvalid.current} [aria-invalid="true"]`)?.focus();
      focusInvalid.current = 0;
    }
  });
  const openStep = (k) => {
    setActive(k);
    scrollTo.current = k;
  };
  const next = (k) => {
    if (stepErr[k]) {
      setShowErr((s) => ({ ...s, [k]: true }));
      focusInvalid.current = k;
      return;
    }
    const n = k + 1;
    setReached((r) => Math.max(r, n));
    setActive(n);
    if (n <= STEPS) scrollTo.current = n;
    else
      requestAnimationFrame(() =>
        document.getElementById("confirm")?.scrollIntoView({ block: "center" })
      );
  };
  const stepState = (k) => (active === k ? "open" : k <= reached ? "done" : "future");

  // Відкриваємо перший крок з помилкою й показуємо помилки полів; якщо бракує лише згоди — фокус на галочку
  const revealError = (p = "m") => {
    const k = [1, 2, 3].find((s) => stepErr[s]);
    if (k) {
      setShowErr((s) => ({ ...s, [k]: true }));
      setReached((r) => Math.max(r, k));
      setActive(k);
      scrollTo.current = k;
      focusInvalid.current = k;
      return;
    }
    const el = document.getElementById(`${p}-oferta`);
    if (ofertaMissing && el) {
      el.scrollIntoView({ block: "center" });
      el.focus({ preventScroll: true });
    } else document.getElementById("confirm")?.scrollIntoView({ block: "center" });
  };

  const submit = async (p = "m") => {
    if (busy) return;
    if (err) {
      setTried(true);
      revealError(p);
      return toast.error(err);
    }
    setBusy(true);
    if (needEmail) {
      try {
        const { data } = await api.put("/customer/guest-claim", {
          email: guestEmail.trim(),
          name: form.name,
          phone: form.phone,
          acceptLegal: acceptOferta,
          marketing,
        });
        dispatch(set_token(data.token));
      } catch (e) {
        setEmailTaken(e.response?.data?.code === "EMAIL_EXISTS");
        toast.error(e.response?.data?.error || "Не вдалося зберегти контактні дані");
        setBusy(false);
        openStep(1);
        return;
      }
    }
    const res = await dispatch(
      place_order({
        price,
        products,
        items,
        shippingInfo: {
          ...toPayload(del),
          name: form.name,
          phone: form.phone,
          recipient: { other, ...recipient },
        },
        couponCode,
        buyer: isCompany ? { kind: "company", ...company } : { kind: "individual" },
        comment: comment.trim() ? comment : "",
        acceptOferta,
        paymentMethod: method,
        invoiceChannel,
        navigate,
      })
    );
    if (res.meta?.requestStatus === "rejected") setBusy(false);
  };

  const deliveryHint =
    del.deliveryType === "nova_poshta_courier"
      ? "Курєр Нової пошти привезе замовлення за вказаною адресою."
      : del.deliveryType === "nova_poshta_postomat"
      ? "Замовлення чекатиме у поштоматі Нової пошти."
      : "Замовлення чекатиме у відділенні Нової пошти.";

  const sum = total ?? price;
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ---------- Зведення кроків ----------
  const deliverySummary = (() => {
    const t = DELIVERY_TYPES.find((d) => d.id === del.deliveryType)?.title || "";
    const where = del.deliveryType === "nova_poshta_courier" ? toPayload(del).address : del.warehouse;
    return [t, del.city, where].filter(Boolean).join(" · ");
  })();
  const methodTitle = methods.find((m) => m.id === method)?.title;
  const summaries = {
    1: (
      <>
        {[form.name, form.phone, needEmail ? guestEmail : userInfo?.email].filter(Boolean).join(" · ")}
        {other && (recipient.lastName || recipient.firstName) && (
          <span className="block">
            Отримувач: {recipient.lastName} {recipient.firstName}
          </span>
        )}
      </>
    ),
    2: deliverySummary,
    3: [methodTitle, isCompany && company.companyName].filter(Boolean).join(" · "),
  };

  const ctaLabel = busy ? "Зачекайте..." : (
    <>
      <LuLock aria-hidden="true" className="size-4" />
      Продовжити до оплати <span className="price">₴{sum}</span>
    </>
  );

  // ---------- Блоки (функції, а не компоненти — щоб поля не втрачали фокус) ----------
  const summaryBody = (p) => (
    <div className="flex flex-col gap-3 text-(--ink)">
      <ul className="flex flex-col gap-3 max-h-[320px] overflow-y-auto overscroll-contain -mr-2 pr-2">
        {products.flatMap((g) =>
          g.products.map((pt) => (
            <li key={pt.productInfo._id} className="flex gap-3">
              <img
                className="size-14 shrink-0 object-contain rounded-(--r-sm) bg-(--surface-2)"
                src={pt.productInfo.images[0]}
                alt=""
                width={56}
                height={56}
                loading="lazy"
              />
              <div className="flex-1 min-w-0 text-sm">
                <div className="font-medium leading-5 line-clamp-2">{pt.productInfo.name}</div>
                <div className="text-(--ink-2) price">
                  {pt.quantity} шт × ₴{pt.unitPrice ?? pt.productInfo.price}
                  {pt.productInfo.discount > 0 && <span className="line-through ml-2">₴{pt.productInfo.price}</span>}
                </div>
                {pt.preorder && <div className="text-sm font-medium text-(--warning)">Передзамовлення</div>}
              </div>
            </li>
          ))
        )}
      </ul>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="self-start min-h-11 inline-flex items-center gap-1.5 text-sm font-semibold text-(--brand-ink) underline underline-offset-2"
      >
        <LuPencil aria-hidden="true" className="size-4" /> Редагувати товари
      </button>
      <hr className="border-(--line)" />
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-(--ink-2)">
            {items} {plural(items)} на суму
          </dt>
          <dd className="price">₴{price}</dd>
        </div>
        {order_discount?.amount > 0 && (
          <div className="flex justify-between gap-3 text-(--success)">
            <dt>Знижка за сумою (−{order_discount.percent}%)</dt>
            <dd className="price">−₴{order_discount.amount}</dd>
          </div>
        )}
        {!buyNow && coupon?.status === "applied" && coupon_discount > 0 && (
          <div className="flex justify-between gap-3 text-(--success)">
            <dt>Купон {coupon.code}</dt>
            <dd className="price">−₴{coupon_discount}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-(--ink-2)">Доставка</dt>
          <dd className="text-right">за тарифами перевізника</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${p}-promo`} className={labelCls}>
          Промокод
        </label>
        <div className="flex gap-2">
          <input
            id={`${p}-promo`}
            value={promo}
            onChange={(e) => setPromo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && applyPromo()}
            maxLength={32}
            autoComplete="off"
            autoCapitalize="characters"
            enterKeyHint="done"
            aria-describedby={`${p}-promo-msg`}
            className={`${inputCls} flex-1 min-w-0`}
          />
          {coupon?.status === "applied" ? (
            <button type="button" onClick={removePromo} className="h-12 px-4 shrink-0 rounded-(--r-md) border border-(--line-strong) text-sm font-semibold text-(--ink)">
              Прибрати
            </button>
          ) : (
            <button type="button" onClick={applyPromo} className="h-12 px-4 shrink-0 rounded-(--r-md) border border-(--brand) text-sm font-semibold text-(--brand-ink)">
              Застосувати
            </button>
          )}
        </div>
        <FieldError id={`${p}-promo-msg`}>{coupon?.status === "not_applied" ? coupon.message : ""}</FieldError>
      </div>
      <div className="flex justify-between items-baseline gap-3 pt-1 border-t border-(--line)">
        <span className="font-semibold pt-2">Всього до сплати</span>
        <span className="price text-xl font-bold text-(--price) pt-2">₴{sum}</span>
      </div>
    </div>
  );

  const consents = (p) => (
    <div className="flex flex-col gap-1">
      {legal.oferta?.published && (
        <Checkbox id={`${p}-oferta`} checked={acceptOferta} onChange={(e) => setAcceptOferta(e.target.checked)}>
          Я ознайомився(лась) з{" "}
          <Link to="/oferta" target="_blank" className="underline underline-offset-2 font-medium text-(--brand-ink)">
            Публічною офертою
          </Link>
          {legal.privacy?.published && (
            <>
              {" "}та{" "}
              <Link to="/privacy" target="_blank" className="underline underline-offset-2 font-medium text-(--brand-ink)">
                Політикою конфіденційності
              </Link>
            </>
          )}{" "}
          і приймаю їх умови
        </Checkbox>
      )}
      {needEmail && (
        <Checkbox checked={marketing} onChange={(e) => setMarketing(e.target.checked)}>
          <span className="text-(--ink-2)">Хочу отримувати новини та пропозиції на e-mail (необов'язково)</span>
        </Checkbox>
      )}
      <p className="text-sm text-(--ink-2)">Підтверджуючи замовлення, ви погоджуєтесь з умовами обробки персональних даних.</p>
    </div>
  );

  // Рядок «чого бракує» біля кнопки підтвердження (натискання — перехід до першого незаповненого)
  const missingHint = (p) => (
    <p aria-live="polite" className={showMissing ? "" : "sr-only"}>
      {showMissing && (
        <button
          type="button"
          onClick={() => revealError(p)}
          className="w-full min-h-8 inline-flex items-center justify-center gap-1.5 text-sm text-(--ink-2) text-center underline underline-offset-2"
        >
          <LuCircleAlert aria-hidden="true" className="size-4 shrink-0 text-(--warning)" />
          <span>{missingText}</span>
        </button>
      )}
    </p>
  );

  const nextButton = (k, label = "Далі") => (
    <div className="mt-5 flex flex-col gap-2">
      <button type="button" onClick={() => next(k)} className={nextBtnCls}>
        {label}
      </button>
      {showErr[k] && stepErr[k] && <FieldError id={`step-${k}-err`}>{stepErr[k]}</FieldError>}
    </div>
  );

  const googleId = authCfg.google?.clientId;

  return (
    <div>
      <Header />
      <main className="bg-(--page) text-(--ink)">
        <div className="container-x pt-4 pb-8 lg:pt-8 lg:pb-12">
          <Link to="/card" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-(--brand-ink)">
            <LuArrowLeft aria-hidden="true" className="size-4" /> До кошика
          </Link>
          <h1 className="text-[22px] leading-7 md:text-[28px] md:leading-9 font-bold mb-4">Оформлення замовлення</h1>

          {/* Мобільні: згорнуте зведення замовлення з сумою */}
          <div className={`${cardCls} lg:hidden mb-4`}>
            <button
              type="button"
              aria-expanded={summaryOpen}
              aria-controls="m-summary"
              onClick={() => setSummaryOpen((o) => !o)}
              className="w-full min-h-14 px-4 py-3 flex items-center gap-3 text-left"
            >
              <LuShoppingBag aria-hidden="true" className="size-5 shrink-0 text-(--ink-2)" />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold">Ваше замовлення</span>
                <span className="block text-sm text-(--ink-2)">
                  {items} {plural(items)} · {summaryOpen ? "сховати" : "показати"}
                </span>
              </span>
              <span className="price text-lg font-bold text-(--price)">₴{sum}</span>
              <LuChevronDown aria-hidden="true" className={`size-5 shrink-0 text-(--ink-2) motion-safe:transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </button>
            <div id="m-summary" hidden={!summaryOpen} className="px-4 pb-4">
              {summaryBody("m")}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] gap-4 lg:gap-6 items-start">
            <div className="flex flex-col gap-4 min-w-0">
              {/* Гість: оформлення без реєстрації — перший і основний варіант */}
              {needEmail && (
                <section aria-labelledby="auth-title" className={`${cardCls} p-4 sm:p-5`}>
                  <h2 id="auth-title" className="text-lg leading-6 font-semibold mb-3">
                    Як оформити замовлення
                  </h2>
                  <div role="radiogroup" aria-labelledby="auth-title" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <RadioCard
                      name="authMode"
                      checked={authMode === "guest"}
                      onChange={() => setAuthMode("guest")}
                      icon={<LuUserRound />}
                      title="Оформити без реєстрації"
                      sub="Лише контакти й доставка — акаунт створимо автоматично"
                    />
                    <RadioCard
                      name="authMode"
                      checked={authMode === "login"}
                      onChange={() => setAuthMode("login")}
                      icon={<LuLogIn />}
                      title={googleId ? "Увійти · Google" : "Увійти"}
                      sub={googleId ? "Кодом з e-mail або через Google" : "Одноразовим кодом з e-mail"}
                    />
                  </div>
                  {authMode === "login" && (
                    <div className="mt-4 flex flex-col gap-4">
                      <OtpLogin />
                      {googleId && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 text-sm text-(--ink-2)">
                            <span className="h-px flex-1 bg-(--line)" /> або <span className="h-px flex-1 bg-(--line)" />
                          </div>
                          <GoogleButton clientId={googleId} acceptLegal={loginAccept} />
                          <ConsentCheckboxes accept={loginAccept} setAccept={setLoginAccept} showMarketing={false} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setAuthMode("guest")}
                        className="self-start min-h-11 text-sm font-semibold text-(--brand-ink) underline underline-offset-2"
                      >
                        Продовжити без реєстрації
                      </button>
                    </div>
                  )}
                </section>
              )}

              <Step n={1} title="Контактна інформація" state={stepState(1)} complete={1 < reached} summary={summaries[1]} hasError={!!stepErr[1]} onEdit={() => openStep(1)}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <TextField
                      id="f-name"
                      label="Ім'я та прізвище *"
                      name="name"
                      value={form.name}
                      onChange={set}
                      onBlur={blur("name")}
                      error={fieldErr("name")}
                      autoComplete="name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                    />
                    <TextField
                      id="f-phone"
                      label="Номер телефону *"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: nextPhone(form.phone, e.target.value) })}
                      onBlur={blur("phone")}
                      error={fieldErr("phone")}
                      placeholder="+38(0__)___-__-__"
                    />
                  </div>
                  {needEmail && (
                    <div className="flex flex-col gap-1.5">
                      <TextField
                        id="f-guestEmail"
                        label="Email *"
                        name="guestEmail"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={guestEmail}
                        onChange={(e) => {
                          setGuestEmail(e.target.value);
                          setEmailTaken(false);
                        }}
                        onBlur={blur("guestEmail")}
                        error={fieldErr("guestEmail")}
                        placeholder="name@example.com"
                        hint="Сюди прийдуть підтвердження. Окремо реєструватися не потрібно — увійти в кабінет можна кодом з листа."
                      />
                      {emailTaken && (
                        <p className="text-sm text-(--ink)" role="alert">
                          Цей e-mail уже зареєстровано.{" "}
                          <Link to="/login" className="font-semibold underline underline-offset-2 text-(--brand-ink)">
                            Увійти за кодом
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                  {userInfo?.email && <p className="text-sm text-(--ink-2)">Email: {userInfo.email}</p>}
                  <Checkbox checked={other} onChange={(e) => toggleOther(e.target.checked)}>
                    Інший отримувач замовлення
                  </Checkbox>
                  {other && (
                    <div className="flex flex-col gap-4">
                      {saved.recipients.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {saved.recipients.map((r) => (
                            <SavedChip
                              key={r._id}
                              selected={recSel === r._id}
                              onSelect={() => pickRecipient(r)}
                              title={`${r.lastName} ${r.firstName}`}
                              sub={r.phone}
                              onRemove={() => forget("recipient", r._id)}
                              removeLabel="Видалити збереженого отримувача"
                            />
                          ))}
                          <button
                            type="button"
                            onClick={newRecipient}
                            aria-pressed={recSel === "new"}
                            className={`min-h-14 px-3 rounded-(--r-md) border text-sm inline-flex items-center gap-2 ${
                              recSel === "new" ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand) font-semibold" : "border-dashed border-(--line-strong) font-medium"
                            }`}
                          >
                            <LuPlus aria-hidden="true" className="size-4" /> Новий отримувач
                          </button>
                        </div>
                      )}
                      {recSel === "new" && (
                        <>
                          <div className="flex flex-col md:flex-row gap-4">
                            <TextField
                              id="f-lastName"
                              label="Прізвище *"
                              name="lastName"
                              value={recipient.lastName}
                              onChange={setRec}
                              onBlur={blur("lastName")}
                              error={fieldErr("lastName")}
                              autoComplete="section-recipient family-name"
                              autoCapitalize="words"
                            />
                            <TextField
                              id="f-firstName"
                              label="Ім'я *"
                              name="firstName"
                              value={recipient.firstName}
                              onChange={setRec}
                              onBlur={blur("firstName")}
                              error={fieldErr("firstName")}
                              autoComplete="section-recipient given-name"
                              autoCapitalize="words"
                            />
                          </div>
                          <div className="flex flex-col md:flex-row gap-4">
                            <TextField
                              id="f-middleName"
                              label="По батькові"
                              name="middleName"
                              value={recipient.middleName}
                              onChange={setRec}
                              autoComplete="section-recipient additional-name"
                              autoCapitalize="words"
                            />
                            <TextField
                              id="f-rphone"
                              label="Телефон отримувача *"
                              name="rphone"
                              type="tel"
                              inputMode="tel"
                              autoComplete="section-recipient tel"
                              value={recipient.phone}
                              onChange={(e) => setRecipient({ ...recipient, phone: nextPhone(recipient.phone, e.target.value) })}
                              onBlur={blur("rphone")}
                              error={fieldErr("rphone")}
                              placeholder="+38(0__)___-__-__"
                            />
                          </div>
                          <p className="text-sm text-(--ink-2)">Отримувача буде збережено для наступних замовлень.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {nextButton(1)}
              </Step>

              <Step n={2} title="Доставка" state={stepState(2)} complete={2 < reached} summary={summaries[2]} hasError={!!stepErr[2]} onEdit={() => openStep(2)}>
                {saved.addresses.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {saved.addresses.map((a) => {
                      const t = savedAddressTitle(a);
                      return (
                        <SavedChip
                          key={a._id}
                          selected={addrSel === a._id}
                          onSelect={() => {
                            setAddrSel(a._id);
                            setDel(fromSaved(a));
                          }}
                          title={t.head}
                          sub={t.sub}
                        />
                      );
                    })}
                    <button
                      type="button"
                      aria-pressed={addrSel === "new"}
                      onClick={() => {
                        setAddrSel("new");
                        setDel(emptyDelivery());
                      }}
                      className={`min-h-14 px-3 rounded-(--r-md) border text-sm inline-flex items-center gap-2 ${
                        addrSel === "new" ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand) font-semibold" : "border-dashed border-(--line-strong) font-medium"
                      }`}
                    >
                      <LuPlus aria-hidden="true" className="size-4" /> Нова адреса
                    </button>
                  </div>
                )}
                <DeliveryFields form={del} setForm={setDel} npOn={npOn} onNpOff={() => setNpOn(false)} showErrors={!!showErr[2]} idPrefix="ship" />
                <p className="text-sm text-(--ink-2) mt-4">
                  {deliveryHint} Вартість доставки — за тарифами перевізника (оплачується при отриманні).
                </p>
                {nextButton(2)}
              </Step>

              <Step n={3} title="Оплата" state={stepState(3)} complete={3 < reached} summary={summaries[3]} hasError={!!stepErr[3]} onEdit={() => openStep(3)}>
                {loadingMethods ? (
                  <p className="text-(--ink-2)" aria-live="polite">
                    Завантаження...
                  </p>
                ) : methods.length === 0 ? (
                  <p className="text-(--danger)">Наразі способи оплати недоступні. Зверніться до адміністратора.</p>
                ) : (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="sr-only">Спосіб оплати</legend>
                    {methods.map((m) => (
                      <RadioCard key={m.id} name="paymentMethod" checked={method === m.id} onChange={() => chooseMethod(m.id)} title={m.title} />
                    ))}
                  </fieldset>
                )}
                {method === "invoice" && (
                  <div className="mt-4 flex flex-col gap-4">
                    <p className="text-sm text-(--ink-2)">
                      Після оформлення ми надішлемо рахунок з реквізитами у вибраний вами спосіб (e-mail, Viber або WhatsApp). Оплатіть його переказом за IBAN у банківському застосунку
                      або в касі банку — без додаткових комісій від магазину. Рахунок діє обмежений час; без оплати замовлення скасується.
                    </p>
                    <fieldset className="flex flex-col gap-2">
                      <legend className="text-[15px] font-semibold text-(--ink) mb-2">Платник</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <RadioCard name="payerKind" checked={payerKind === "individual"} onChange={() => choosePayer("individual")} title="Я фізична особа" />
                        <RadioCard name="payerKind" checked={payerKind === "company"} onChange={() => choosePayer("company")} title="Юрособа або ФОП" />
                      </div>
                    </fieldset>
                    <InvoiceChannelPick value={invoiceChannel} onChange={setInvoiceChannel} phone={form.phone} />
                  </div>
                )}
                {isCompany && (
                  <div className="flex flex-col gap-4 mt-4">
                    {saved.companies.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {saved.companies.map((c) => (
                          <SavedChip
                            key={c._id}
                            selected={compSel === c._id}
                            onSelect={() => pickCompany(c)}
                            title={c.companyName}
                            sub={`ЄДРПОУ ${c.edrpou}`}
                            onRemove={() => forget("company", c._id)}
                            removeLabel="Видалити збережену організацію"
                          />
                        ))}
                        <button
                          type="button"
                          onClick={newCompany}
                          aria-pressed={compSel === "new"}
                          className={`min-h-14 px-3 rounded-(--r-md) border text-sm inline-flex items-center gap-2 ${
                            compSel === "new" ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand) font-semibold" : "border-dashed border-(--line-strong) font-medium"
                          }`}
                        >
                          <LuPlus aria-hidden="true" className="size-4" /> Нова організація
                        </button>
                      </div>
                    )}
                    {compSel === "new" && (
                      <>
                        <TextField
                          id="f-companyName"
                          label="Назва організації *"
                          name="companyName"
                          value={company.companyName}
                          onChange={setComp}
                          onBlur={blur("companyName")}
                          error={fieldErr("companyName")}
                          maxLength={200}
                          autoComplete="organization"
                          placeholder='ТОВ "Ромашка"'
                        />
                        <div className="flex flex-col md:flex-row gap-4">
                          <TextField
                            id="f-edrpou"
                            label="ЄДРПОУ *"
                            name="edrpou"
                            value={company.edrpou}
                            onChange={setComp}
                            onBlur={blur("edrpou")}
                            error={fieldErr("edrpou")}
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={10}
                            hint="8 цифр (для ФОП — РНОКПП, 10 цифр)"
                          />
                          <TextField
                            id="f-ipn"
                            label="ІПН (якщо платник ПДВ)"
                            name="ipn"
                            value={company.ipn}
                            onChange={setComp}
                            onBlur={blur("ipn")}
                            error={fieldErr("ipn")}
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={12}
                          />
                        </div>
                        <p className="text-sm text-(--ink-2)">
                          Ми виставимо рахунок (PDF) і надішлемо його на пошту; він також буде в кабінеті. Умови повернення для юросіб можуть відрізнятися від умов для
                          фізосіб.
                        </p>
                      </>
                    )}
                  </div>
                )}
                {nextButton(3)}
              </Step>

              {/* Коментар — простий необов'язковий блок, без підтвердження кроку */}
              <section aria-labelledby="comment-title" className={`${cardCls} p-4 sm:p-5`}>
                <h2 id="comment-title" className="text-lg leading-6 md:text-[22px] md:leading-[30px] font-semibold mb-3">
                  <label htmlFor="f-comment">Коментар до замовлення</label>
                  <span className="ml-2 text-sm font-normal text-(--ink-2)">необов'язково</span>
                </h2>
                <textarea
                  id="f-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                  rows={3}
                  aria-describedby="f-comment-count"
                  placeholder="Залиште коментар для зв'язку або побажання до замовлення"
                  className={`${inputCls} h-auto min-h-24 py-3 resize-y`}
                />
                <div id="f-comment-count" className="text-sm text-(--ink-2) text-right mt-1">
                  {comment.length}/1000
                </div>
              </section>

              {/* Мобільні: підтвердження (згоди); кнопка — у липкій панелі */}
              <section id="confirm" aria-label="Підтвердження замовлення" className={`${cardCls} p-4 sm:p-5 lg:hidden scroll-mt-[calc(var(--header-h)+12px)]`}>
                {consents("m")}
              </section>
            </div>

            {/* Від lg: липке зведення з кнопкою */}
            <aside aria-label="Ваше замовлення" className="hidden lg:block sticky top-[calc(var(--header-h)+16px)]">
              <div className={`${cardCls} p-5 flex flex-col gap-4`}>
                <h2 className="text-[22px] leading-[30px] font-semibold">Ваше замовлення</h2>
                {summaryBody("d")}
                {consents("d")}
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => submit("d")} disabled={busy || ofertaMissing} className={ctaCls}>
                    {ctaLabel}
                  </button>
                  {missingHint("d")}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Мобільні: одна липка панель дії (64px + safe-area) */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-(--surface) border-t border-(--line) shadow-(--shadow-3) px-4 pt-2 pb-[max(8px,var(--sab))]">
        <div className={showMissing ? "mb-1" : ""}>{missingHint("m")}</div>
        <button type="button" onClick={() => submit("m")} disabled={busy || ofertaMissing} className={ctaCls}>
          {ctaLabel}
        </button>
      </div>

      {editOpen && (
        <CartEditModal
          userId={userInfo.id}
          localItems={buyNow ? localItems : undefined}
          onLocalChange={buyNow ? setLocalItems : undefined}
          onClose={(empty) => {
            setEditOpen(false);
            // У кошик — лише якщо товарів справді не лишилось; інакше лишаємось на оформленні
            if (empty) navigate("/card", { replace: true });
          }}
        />
      )}
      <Footer />
      {/* місце під липку панель, щоб вона не перекривала низ футера */}
      <div aria-hidden="true" className="lg:hidden h-[calc(72px+var(--sab))]" />
    </div>
  );
};

export default Shipping;
