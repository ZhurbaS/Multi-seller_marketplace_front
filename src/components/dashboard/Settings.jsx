import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useDispatch, useSelector } from "react-redux";
import { set_token } from "../../store/reducers/authSlice";
import DeliveryFields from "../DeliveryFields";
import { emptyDelivery, deliveryError, toPayload, savedAddressTitle } from "../../utils/delivery";
import { isValidPhone, maskPhone, nextPhone } from "../../utils/phone";
import { LuChevronDown, LuTrash2 } from "react-icons/lu";
import { Field, FieldError, PageHeader } from "./Kit";
import { btnPrimary, btnSecondary, cardCls, fullMobile, inputCls } from "./ui";
import Subscriptions from "./Subscriptions";

// Секція-картка; `accordion` — згортається (<details>), `count` — кількість у заголовку
const Box = ({ title, hint, children, accordion, count }) => {
  const head = (
    <div className="min-w-0">
      <h2 className="font-semibold text-lg leading-6 text-(--ink)">
        {title}
        {count > 0 && <span className="ml-2 text-sm font-medium text-(--ink-2)">({count})</span>}
      </h2>
      {hint && <p className="text-sm text-(--ink-2)">{hint}</p>}
    </div>
  );
  if (!accordion)
    return (
      <section className={`${cardCls} p-4 md:p-5 flex flex-col gap-3`}>
        {head}
        {children}
      </section>
    );
  return (
    <details className={`${cardCls} group`}>
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-3 min-h-14 p-4 md:px-5">
        {head}
        <LuChevronDown aria-hidden="true" className="shrink-0 text-xl text-(--ink-2) transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 md:px-5 md:pb-5 flex flex-col gap-3">{children}</div>
    </details>
  );
};

const Chip = ({ head, sub, onDelete, what }) => (
  <li className="flex items-center justify-between gap-2 pl-3 pr-1 py-1 rounded-(--r-md) border border-(--line) text-sm min-w-0">
    <span className="min-w-0 py-1">
      <span className="block break-words">{head}</span>
      {sub && <span className="block text-xs text-(--ink-2) break-words">{sub}</span>}
    </span>
    <button
      type="button"
      aria-label={`Видалити ${what}: ${head}`}
      onClick={onDelete}
      className="tap shrink-0 rounded-full text-(--ink-2) hover:text-(--danger) hover:bg-(--danger-soft)"
    >
      <LuTrash2 aria-hidden="true" className="text-lg" />
    </button>
  </li>
);

// Налаштування кабінету: контактні дані, адреси доставки, збережені отримувачі й організації.
const Settings = () => {
  const { userInfo } = useSelector((s) => s.auth);
  const [data, setData] = useState({ addresses: [], recipients: [], companies: [] });
  const [npOn, setNpOn] = useState(false);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const dispatch = useDispatch();
  // Зміна e-mail: closed → request (нова адреса + пароль) → code (код з листа)
  const [em, setEm] = useState({ step: "closed", email: "", password: "", code: "", busy: false });
  const [addingRec, setAddingRec] = useState(false);
  const [rec, setRec] = useState({ lastName: "", firstName: "", middleName: "", phone: "" });
  const [addingCo, setAddingCo] = useState(false);
  const [co, setCo] = useState({ companyName: "", edrpou: "", ipn: "" });
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(emptyDelivery());
  // Інлайн-помилки за формами: { поле: текст }
  const [pErr, setPErr] = useState({});
  const [recErr, setRecErr] = useState({});
  const [coErr, setCoErr] = useState({});
  const [addrErr, setAddrErr] = useState("");

  // Помилка: під полем + тост (як і раніше)
  const fail = (setter, field, msg) => {
    setter({ [field]: msg });
    toast.error(msg);
  };

  const load = () =>
    api
      .get("/home/customer/checkout-data")
      .then(({ data }) => {
        setData({ addresses: data.addresses || [], recipients: data.recipients || [], companies: data.companies || [] });
        setNpOn(!!data.novaPoshta);
        setProfile({
          name: data.profile?.name || userInfo?.name || "",
          phone: data.profile?.phone || userInfo?.phone ? maskPhone(data.profile?.phone || userInfo?.phone) : "",
        });
      })
      .catch(() => toast.error("Не вдалося завантажити налаштування"));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    if (profile.name.trim().length < 2) return fail(setPErr, "name", "Вкажіть ім'я");
    if (!isValidPhone(profile.phone)) return fail(setPErr, "phone", "Вкажіть коректний номер телефону");
    setPErr({});
    try {
      const { data: r } = await api.put("/home/customer/profile", profile);
      toast.success(r.message || "Збережено");
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти");
    }
  };

  const requestEmail = async () => {
    if (em.busy) return;
    setEm((s) => ({ ...s, busy: true }));
    try {
      const { data: r } = await api.post("/home/customer/email/request", { email: em.email, password: em.password });
      toast.success(r.message || "Код надіслано");
      setEm((s) => ({ ...s, step: "code", email: r.email || s.email, password: "", code: "", busy: false }));
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося надіслати код");
      setEm((s) => ({ ...s, busy: false }));
    }
  };

  const confirmEmail = async () => {
    if (em.busy) return;
    setEm((s) => ({ ...s, busy: true }));
    try {
      const { data: r } = await api.post("/home/customer/email/confirm", { code: em.code });
      if (r.token) dispatch(set_token(r.token));
      toast.success(r.message || "Електронну адресу змінено");
      setEm({ step: "closed", email: "", password: "", code: "", busy: false });
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося підтвердити код");
      setEm((s) => ({ ...s, busy: false }));
    }
  };

  const addRecipient = async () => {
    if (!rec.lastName.trim()) return fail(setRecErr, "lastName", "Вкажіть прізвище отримувача");
    if (!rec.firstName.trim()) return fail(setRecErr, "firstName", "Вкажіть ім'я отримувача");
    if (!isValidPhone(rec.phone)) return fail(setRecErr, "phone", "Вкажіть коректний телефон отримувача");
    setRecErr({});
    try {
      await api.post("/home/customer/saved-recipient", rec);
      toast.success("Отримувача збережено");
      setAddingRec(false);
      setRec({ lastName: "", firstName: "", middleName: "", phone: "" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти отримувача");
    }
  };

  const addCompany = async () => {
    if (co.companyName.trim().length < 2) return fail(setCoErr, "companyName", "Вкажіть назву організації");
    if (!/^\d{8}$|^\d{10}$/.test(co.edrpou.replace(/\s/g, "")))
      return fail(setCoErr, "edrpou", "Код ЄДРПОУ — 8 цифр (для ФОП — 10 цифр РНОКПП)");
    setCoErr({});
    try {
      await api.post("/home/customer/saved-company", co);
      toast.success("Організацію збережено");
      setAddingCo(false);
      setCo({ companyName: "", edrpou: "", ipn: "" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти організацію");
    }
  };

  const addAddress = async () => {
    const err = deliveryError(del, npOn);
    if (err) {
      setAddrErr(err);
      return toast.error(err);
    }
    setAddrErr("");
    try {
      await api.post("/home/customer/saved-address", toPayload(del));
      toast.success("Адресу збережено");
      setAdding(false);
      setDel(emptyDelivery());
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти адресу");
    }
  };

  const forget = async (kind, id) => {
    try {
      await api.delete(`/home/customer/saved-${kind}/${id}`);
      load();
    } catch {
      toast.error("Не вдалося видалити");
    }
  };

  const actions = "flex flex-col-reverse sm:flex-row gap-2";

  return (
    <div className="flex flex-col gap-4 text-(--ink)">
      <PageHeader title="Налаштування" />

      <Box title="Електронна пошта">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-(--ink-2) break-all">{userInfo?.email}</span>
            {em.step === "closed" && (
              <button type="button" onClick={() => setEm({ ...em, step: "request" })} className={`${btnSecondary} ${fullMobile}`}>
                Змінити email
              </button>
            )}
          </div>
          {em.step === "request" && (
            <form
              className="flex flex-col gap-3 border-t border-(--line) pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                requestEmail();
              }}
            >
              <p className="text-sm text-(--ink-2)">Ми надішлемо код підтвердження на нову адресу. Для безпеки введіть ваш поточний пароль.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Нова електронна адреса" required>
                  {(a) => (
                    <input
                      {...a}
                      className={inputCls}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={em.email}
                      onChange={(e) => setEm({ ...em, email: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Поточний пароль" required>
                  {(a) => (
                    <input
                      {...a}
                      className={inputCls}
                      type="password"
                      autoComplete="current-password"
                      value={em.password}
                      onChange={(e) => setEm({ ...em, password: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <div className={actions}>
                <button type="button" onClick={() => setEm({ step: "closed", email: "", password: "", code: "", busy: false })} className={`${btnSecondary} ${fullMobile}`}>
                  Скасувати
                </button>
                <button type="submit" disabled={em.busy} className={`${btnPrimary} ${fullMobile} min-h-12`}>
                  Надіслати код
                </button>
              </div>
            </form>
          )}
          {em.step === "code" && (
            <form
              className="flex flex-col gap-3 border-t border-(--line) pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (em.code.length === 6) confirmEmail();
              }}
            >
              <Field label="Код підтвердження" hint={`Код надіслано на ${em.email}. Він діє 15 хвилин.`} className="md:max-w-[320px]">
                {(a) => (
                  <input
                    {...a}
                    className={`${inputCls} tracking-[0.3em] tabular-nums`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-значний код"
                    value={em.code}
                    onChange={(e) => setEm({ ...em, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  />
                )}
              </Field>
              <div className={actions}>
                <button type="button" onClick={() => setEm({ ...em, step: "request", code: "" })} className={`${btnSecondary} ${fullMobile}`}>
                  Інша адреса / надіслати ще раз
                </button>
                <button type="submit" disabled={em.busy || em.code.length !== 6} className={`${btnPrimary} ${fullMobile} min-h-12`}>
                  Підтвердити
                </button>
              </div>
            </form>
          )}
        </div>
      </Box>

      <Box title="Контактні дані">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Ім'я" error={pErr.name}>
              {(a) => (
                <input
                  {...a}
                  className={inputCls}
                  autoComplete="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              )}
            </Field>
            <Field label="Телефон" error={pErr.phone}>
              {(a) => (
                <input
                  {...a}
                  className={inputCls}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={profile.phone}
                  placeholder="+38(067)-323-57-85"
                  onChange={(e) => setProfile({ ...profile, phone: nextPhone(profile.phone, e.target.value) })}
                />
              )}
            </Field>
          </div>
          <button type="submit" className={`${btnPrimary} ${fullMobile} min-h-12 self-start`}>
            Зберегти
          </button>
        </form>
      </Box>

      {/* Підписки на розсилки (окремий компонент зі своїм завантаженням) */}
      <Subscriptions />

      <Box
        accordion
        count={data.addresses.length}
        title="Адреси доставки"
        hint="Підставляються під час оформлення замовлення. Нова адреса зберігається автоматично після замовлення."
      >
        {data.addresses.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.addresses.map((a) => {
              const t = savedAddressTitle(a);
              return <Chip key={a._id} what="адресу" head={t.head} sub={t.sub} onDelete={() => forget("address", a._id)} />;
            })}
          </ul>
        ) : (
          !adding && <p className="text-sm text-(--ink-2)">Збережених адрес ще немає.</p>
        )}
        {adding ? (
          <div className="border-t border-(--line) pt-3 flex flex-col gap-3">
            <DeliveryFields
              form={del}
              setForm={(v) => {
                setDel(v);
                if (addrErr) setAddrErr("");
              }}
              npOn={npOn}
              onNpOff={() => setNpOn(false)}
            />
            {addrErr && <FieldError>{addrErr}</FieldError>}
            <div className={actions}>
              <button type="button" onClick={() => setAdding(false)} className={`${btnSecondary} ${fullMobile}`}>
                Скасувати
              </button>
              <button type="button" onClick={addAddress} className={`${btnPrimary} ${fullMobile} min-h-12`}>
                Зберегти адресу
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={`${btnSecondary} ${fullMobile} self-start`}>
            + Додати адресу
          </button>
        )}
      </Box>

      <Box accordion count={data.recipients.length} title="Інші отримувачі" hint="Люди, на яких ви оформлюєте замовлення.">
        {data.recipients.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.recipients.map((r) => (
              <Chip key={r._id} what="отримувача" head={`${r.lastName} ${r.firstName}`} sub={r.phone} onDelete={() => forget("recipient", r._id)} />
            ))}
          </ul>
        ) : (
          !addingRec && <p className="text-sm text-(--ink-2)">Немає збережених отримувачів.</p>
        )}
        {addingRec ? (
          <form
            className="border-t border-(--line) pt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              addRecipient();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Прізвище" required error={recErr.lastName}>
                {(a) => (
                  <input {...a} className={inputCls} autoComplete="family-name" value={rec.lastName} onChange={(e) => setRec({ ...rec, lastName: e.target.value })} />
                )}
              </Field>
              <Field label="Ім'я" required error={recErr.firstName}>
                {(a) => (
                  <input {...a} className={inputCls} autoComplete="given-name" value={rec.firstName} onChange={(e) => setRec({ ...rec, firstName: e.target.value })} />
                )}
              </Field>
              <Field label="По батькові">
                {(a) => (
                  <input {...a} className={inputCls} autoComplete="additional-name" value={rec.middleName} onChange={(e) => setRec({ ...rec, middleName: e.target.value })} />
                )}
              </Field>
              <Field label="Телефон" required error={recErr.phone}>
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+38(067)-323-57-85"
                    value={rec.phone}
                    onChange={(e) => setRec({ ...rec, phone: nextPhone(rec.phone, e.target.value) })}
                  />
                )}
              </Field>
            </div>
            <div className={actions}>
              <button type="button" onClick={() => setAddingRec(false)} className={`${btnSecondary} ${fullMobile}`}>
                Скасувати
              </button>
              <button type="submit" className={`${btnPrimary} ${fullMobile} min-h-12`}>
                Зберегти отримувача
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setAddingRec(true)} className={`${btnSecondary} ${fullMobile} self-start`}>
            + Додати отримувача
          </button>
        )}
      </Box>

      <Box accordion count={data.companies.length} title="Організації" hint="Реквізити юросіб та ФОП для замовлень за рахунком.">
        {data.companies.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.companies.map((c) => (
              <Chip key={c._id} what="організацію" head={c.companyName} sub={`ЄДРПОУ ${c.edrpou}`} onDelete={() => forget("company", c._id)} />
            ))}
          </ul>
        ) : (
          !addingCo && <p className="text-sm text-(--ink-2)">Немає збережених організацій.</p>
        )}
        {addingCo ? (
          <form
            className="border-t border-(--line) pt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              addCompany();
            }}
          >
            <Field label="Повна назва організації / ФОП" required error={coErr.companyName}>
              {(a) => (
                <input
                  {...a}
                  className={inputCls}
                  autoComplete="organization"
                  value={co.companyName}
                  onChange={(e) => setCo({ ...co, companyName: e.target.value.replace(/^\s+/, "") })}
                />
              )}
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="ЄДРПОУ" required hint="ФОП — РНОКПП, 10 цифр" error={coErr.edrpou}>
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    value={co.edrpou}
                    onChange={(e) => setCo({ ...co, edrpou: e.target.value.replace(/\D/g, "") })}
                  />
                )}
              </Field>
              <Field label="ІПН" hint="Якщо платник ПДВ">
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    value={co.ipn}
                    onChange={(e) => setCo({ ...co, ipn: e.target.value.replace(/\D/g, "") })}
                  />
                )}
              </Field>
            </div>
            <div className={actions}>
              <button type="button" onClick={() => setAddingCo(false)} className={`${btnSecondary} ${fullMobile}`}>
                Скасувати
              </button>
              <button type="submit" className={`${btnPrimary} ${fullMobile} min-h-12`}>
                Зберегти організацію
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setAddingCo(true)} className={`${btnSecondary} ${fullMobile} self-start`}>
            + Додати організацію
          </button>
        )}
      </Box>
    </div>
  );
};

export default Settings;
