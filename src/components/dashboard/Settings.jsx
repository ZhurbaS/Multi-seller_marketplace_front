import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useDispatch, useSelector } from "react-redux";
import { set_token } from "../../store/reducers/authSlice";
import DeliveryFields from "../DeliveryFields";
import { emptyDelivery, deliveryError, toPayload, savedAddressTitle } from "../../utils/delivery";
import { isValidPhone, maskPhone, nextPhone } from "../../utils/phone";

const inputCls =
  "w-full px-3 py-2 border border-[var(--border-myOrders)] outline-none rounded-md bg-transparent";

const Box = ({ title, hint, children }) => (
  <section className="border border-[var(--border-myOrders)] rounded-md p-4 flex flex-col gap-3">
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {hint && <p className="text-sm opacity-70">{hint}</p>}
    </div>
    {children}
  </section>
);

const Chip = ({ head, sub, onDelete }) => (
  <span className="inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-md border border-[var(--border-myOrders)] text-sm">
    <span>
      {head}
      {sub && <span className="block text-xs opacity-70">{sub}</span>}
    </span>
    <button type="button" aria-label="Видалити" onClick={onDelete} className="opacity-50 hover:opacity-100 px-1">
      ✕
    </button>
  </span>
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
  }, []);

  const saveProfile = async () => {
    if (profile.name.trim().length < 2) return toast.error("Вкажіть ім'я");
    if (!isValidPhone(profile.phone)) return toast.error("Вкажіть коректний номер телефону");
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
    if (!rec.lastName.trim()) return toast.error("Вкажіть прізвище отримувача");
    if (!rec.firstName.trim()) return toast.error("Вкажіть ім'я отримувача");
    if (!isValidPhone(rec.phone)) return toast.error("Вкажіть коректний телефон отримувача");
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
    if (co.companyName.trim().length < 2) return toast.error("Вкажіть назву організації");
    if (!/^\d{8}$|^\d{10}$/.test(co.edrpou.replace(/\s/g, ""))) return toast.error("Код ЄДРПОУ — 8 цифр (для ФОП — 10 цифр РНОКПП)");
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
    if (err) return toast.error(err);
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

  return (
    <div className="bg-[var(--bg-myOrders)] p-4 rounded-md text-[var(--text-myOrders)] flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Налаштування</h2>

      <Box title="Електронна пошта" hint="Змінюється окремо від імені й телефону — вони залишаються як є.">
        <div className="text-sm flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="opacity-70">Email: {userInfo?.email}</span>
            {em.step === "closed" && (
              <button type="button" onClick={() => setEm({ ...em, step: "request" })} className="underline">
                Змінити
              </button>
            )}
          </div>
          {em.step === "request" && (
            <div className="flex flex-col gap-2 border border-[var(--border-myOrders)] rounded-md p-3">
              <p className="opacity-70">Ми надішлемо код підтвердження на нову адресу. Для безпеки введіть ваш поточний пароль.</p>
              <input
                className={inputCls}
                type="email"
                autoComplete="off"
                placeholder="Нова електронна адреса"
                value={em.email}
                onChange={(e) => setEm({ ...em, email: e.target.value })}
              />
              <input
                className={inputCls}
                type="password"
                autoComplete="current-password"
                placeholder="Поточний пароль"
                value={em.password}
                onChange={(e) => setEm({ ...em, password: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="button" disabled={em.busy} onClick={requestEmail} className="px-4 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)] disabled:opacity-60">
                  Надіслати код
                </button>
                <button type="button" onClick={() => setEm({ step: "closed", email: "", password: "", code: "", busy: false })} className="px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
                  Скасувати
                </button>
              </div>
            </div>
          )}
          {em.step === "code" && (
            <div className="flex flex-col gap-2 border border-[var(--border-myOrders)] rounded-md p-3">
              <p className="opacity-70">Код надіслано на {em.email}. Він діє 15 хвилин.</p>
              <input
                className={inputCls}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-значний код"
                value={em.code}
                onChange={(e) => setEm({ ...em, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              />
              <div className="flex gap-2 flex-wrap">
                <button type="button" disabled={em.busy || em.code.length !== 6} onClick={confirmEmail} className="px-4 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)] disabled:opacity-60">
                  Підтвердити
                </button>
                <button type="button" onClick={() => setEm({ ...em, step: "request", code: "" })} className="px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
                  Інша адреса / надіслати ще раз
                </button>
              </div>
            </div>
          )}
        </div>
      </Box>

      <Box title="Контактні дані">
        <div className="flex max-md:flex-col gap-3">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm">Ім'я</label>
            <input className={inputCls} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm">Телефон</label>
            <input
              className={inputCls}
              type="tel"
              value={profile.phone}
              placeholder="+38(067)-323-57-85"
              onChange={(e) => setProfile({ ...profile, phone: nextPhone(profile.phone, e.target.value) })}
            />
          </div>
        </div>
        <button onClick={saveProfile} className="self-start px-5 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)]">
          Зберегти
        </button>
      </Box>

      <Box title="Адреси доставки" hint="Підставляються під час оформлення замовлення. Нова адреса зберігається автоматично після замовлення.">
        <div className="flex flex-wrap gap-2">
          {data.addresses.map((a) => {
            const t = savedAddressTitle(a);
            return <Chip key={a._id} head={t.head} sub={t.sub} onDelete={() => forget("address", a._id)} />;
          })}
          {data.addresses.length === 0 && !adding && <span className="text-sm opacity-70">Збережених адрес ще немає.</span>}
        </div>
        {adding ? (
          <div className="border-t border-[var(--border-myOrders)] pt-3">
            <DeliveryFields form={del} setForm={setDel} npOn={npOn} onNpOff={() => setNpOn(false)} />
            <div className="flex gap-2 mt-3">
              <button onClick={addAddress} className="px-5 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)]">
                Зберегти адресу
              </button>
              <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="self-start px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
            + Додати адресу
          </button>
        )}
      </Box>

      <Box title="Інші отримувачі" hint="Люди, на яких ви оформлюєте замовлення.">
        <div className="flex flex-wrap gap-2">
          {data.recipients.map((r) => (
            <Chip key={r._id} head={`${r.lastName} ${r.firstName}`} sub={r.phone} onDelete={() => forget("recipient", r._id)} />
          ))}
          {data.recipients.length === 0 && !addingRec && <span className="text-sm opacity-70">Немає збережених отримувачів.</span>}
        </div>
        {addingRec ? (
          <div className="border-t border-[var(--border-myOrders)] pt-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
              <input className={inputCls} placeholder="Прізвище *" value={rec.lastName} onChange={(e) => setRec({ ...rec, lastName: e.target.value })} />
              <input className={inputCls} placeholder="Ім'я *" value={rec.firstName} onChange={(e) => setRec({ ...rec, firstName: e.target.value })} />
              <input className={inputCls} placeholder="По батькові" value={rec.middleName} onChange={(e) => setRec({ ...rec, middleName: e.target.value })} />
              <input
                className={inputCls}
                type="tel"
                placeholder="+38(067)-323-57-85 *"
                value={rec.phone}
                onChange={(e) => setRec({ ...rec, phone: nextPhone(rec.phone, e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addRecipient} className="px-5 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)]">
                Зберегти отримувача
              </button>
              <button onClick={() => setAddingRec(false)} className="px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingRec(true)} className="self-start px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
            + Додати отримувача
          </button>
        )}
      </Box>

      <Box title="Організації" hint="Реквізити юросіб та ФОП для замовлень за рахунком.">
        <div className="flex flex-wrap gap-2">
          {data.companies.map((c) => (
            <Chip key={c._id} head={c.companyName} sub={`ЄДРПОУ ${c.edrpou}`} onDelete={() => forget("company", c._id)} />
          ))}
          {data.companies.length === 0 && !addingCo && <span className="text-sm opacity-70">Немає збережених організацій.</span>}
        </div>
        {addingCo ? (
          <div className="border-t border-[var(--border-myOrders)] pt-3 flex flex-col gap-3">
            <input className={inputCls} placeholder="Повна назва організації / ФОП *" value={co.companyName} onChange={(e) => setCo({ ...co, companyName: e.target.value.replace(/^\s+/, "") })} />
            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
              <input
                className={inputCls}
                inputMode="numeric"
                maxLength={10}
                placeholder="ЄДРПОУ * (ФОП — РНОКПП, 10 цифр)"
                value={co.edrpou}
                onChange={(e) => setCo({ ...co, edrpou: e.target.value.replace(/\D/g, "") })}
              />
              <input
                className={inputCls}
                inputMode="numeric"
                maxLength={12}
                placeholder="ІПН (якщо платник ПДВ)"
                value={co.ipn}
                onChange={(e) => setCo({ ...co, ipn: e.target.value.replace(/\D/g, "") })}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addCompany} className="px-5 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)]">
                Зберегти організацію
              </button>
              <button onClick={() => setAddingCo(false)} className="px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingCo(true)} className="self-start px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
            + Додати організацію
          </button>
        )}
      </Box>
    </div>
  );
};

export default Settings;
