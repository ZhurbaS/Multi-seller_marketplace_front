import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useSelector } from "react-redux";
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
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(emptyDelivery());

  const load = () =>
    api
      .get("/home/customer/checkout-data")
      .then(({ data }) => {
        setData({ addresses: data.addresses || [], recipients: data.recipients || [], companies: data.companies || [] });
        setNpOn(!!data.novaPoshta);
        setProfile({ name: data.profile?.name || "", phone: data.profile?.phone ? maskPhone(data.profile.phone) : "" });
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
        <p className="text-sm opacity-70">Email: {userInfo?.email}</p>
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

      <Box title="Інші отримувачі" hint="Люди, на яких ви оформлюєте замовлення (родичі, колеги).">
        <div className="flex flex-wrap gap-2">
          {data.recipients.map((r) => (
            <Chip key={r._id} head={`${r.lastName} ${r.firstName}`} sub={r.phone} onDelete={() => forget("recipient", r._id)} />
          ))}
          {data.recipients.length === 0 && <span className="text-sm opacity-70">Немає збережених отримувачів.</span>}
        </div>
      </Box>

      <Box title="Організації" hint="Реквізити юрособ та ФОП для замовлень за рахунком.">
        <div className="flex flex-wrap gap-2">
          {data.companies.map((c) => (
            <Chip key={c._id} head={c.companyName} sub={`ЄДРПОУ ${c.edrpou}`} onDelete={() => forget("company", c._id)} />
          ))}
          {data.companies.length === 0 && <span className="text-sm opacity-70">Немає збережених організацій.</span>}
        </div>
      </Box>
    </div>
  );
};

export default Settings;
