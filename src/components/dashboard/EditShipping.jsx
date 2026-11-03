import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import DeliveryFields from "../DeliveryFields";
import { DELIVERY_TYPES, emptyDelivery, deliveryError, fromSaved, toPayload, savedAddressTitle } from "../../utils/delivery";
import { isValidPhone, maskPhone, nextPhone } from "../../utils/phone";

const inputCls = "w-full px-3 py-2 border border-[var(--border-myOrders)] outline-none rounded-md bg-transparent";
const chipCls = (on) =>
  `px-3 py-2 rounded-md border text-sm text-left ${on ? "border-[var(--border-ship-foc)] bg-[var(--bg-stripe)] font-semibold" : "border-[var(--border-myOrders)]"}`;

// Зміна отримувача й доставки в замовленні, поки його не відправлено.
const EditShipping = ({ order, onClose, onSaved }) => {
  const si = order.shippingInfo || {};
  const [name, setName] = useState(si.name || "");
  const [phone, setPhone] = useState(si.phone ? maskPhone(si.phone) : "");
  const [other, setOther] = useState(!!si.recipient?.other);
  const [rec, setRec] = useState({
    lastName: si.recipient?.lastName || "",
    firstName: si.recipient?.firstName || "",
    middleName: si.recipient?.middleName || "",
    phone: si.recipient?.phone ? maskPhone(si.recipient.phone) : "",
  });
  // Поточна адреса (якщо тип доставки не підтримується формою — починаємо з відділення)
  const [del, setDel] = useState(() =>
    DELIVERY_TYPES.some((t) => t.id === si.deliveryType) ? fromSaved(si) : emptyDelivery()
  );
  const [saved, setSaved] = useState({ addresses: [], recipients: [] });
  const [npOn, setNpOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/home/customer/checkout-data")
      .then(({ data }) => {
        setSaved({ addresses: data.addresses || [], recipients: data.recipients || [] });
        setNpOn(!!data.novaPoshta);
      })
      .catch(() => {});
  }, []);

  const error = () => {
    if (name.trim().length < 2) return "Вкажіть ім'я замовника";
    if (!isValidPhone(phone)) return "Вкажіть коректний телефон замовника";
    if (other) {
      if (!rec.lastName.trim()) return "Вкажіть прізвище отримувача";
      if (!rec.firstName.trim()) return "Вкажіть ім'я отримувача";
      if (!isValidPhone(rec.phone)) return "Вкажіть коректний телефон отримувача";
    }
    return deliveryError(del, npOn);
  };

  const save = async () => {
    const err = error();
    if (err) return toast.error(err);
    setBusy(true);
    try {
      const { data } = await api.put(`/home/customer/orders/${order._id}/shipping`, {
        shippingInfo: { ...toPayload(del), name, phone, recipient: { other, ...rec } },
      });
      toast.success(data.message || "Збережено");
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти зміни");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-myOrders,#fff)] text-[var(--text-myOrders)] rounded-md w-full max-w-[640px] p-5 flex flex-col gap-4 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Змінити отримувача та доставку</h3>
        <p className="text-sm bg-amber-50 text-amber-800 rounded-md p-3">
          Зміну можна зробити, поки замовлення не відправлено. Вона може потребувати додаткового часу на опрацювання — ми повідомимо вас листом.
        </p>

        <section className="flex flex-col gap-3">
          <h4 className="font-semibold">Замовник</h4>
          <div className="flex max-md:flex-col gap-3">
            <input className={inputCls} placeholder="Ім'я *" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className={inputCls}
              type="tel"
              placeholder="+38(067)-323-57-85 *"
              value={phone}
              onChange={(e) => setPhone(nextPhone(phone, e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={other} onChange={(e) => setOther(e.target.checked)} />
            Інший отримувач замовлення
          </label>
          {other && (
            <div className="flex flex-col gap-3">
              {saved.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {saved.recipients.map((r) => (
                    <button
                      type="button"
                      key={r._id}
                      className={chipCls(false)}
                      onClick={() => setRec({ lastName: r.lastName, firstName: r.firstName, middleName: r.middleName || "", phone: maskPhone(r.phone) })}
                    >
                      {r.lastName} {r.firstName}
                      <span className="block text-xs opacity-70 font-normal">{r.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
                <input className={inputCls} placeholder="Прізвище *" value={rec.lastName} onChange={(e) => setRec({ ...rec, lastName: e.target.value })} />
                <input className={inputCls} placeholder="Ім'я *" value={rec.firstName} onChange={(e) => setRec({ ...rec, firstName: e.target.value })} />
                <input className={inputCls} placeholder="По батькові" value={rec.middleName} onChange={(e) => setRec({ ...rec, middleName: e.target.value })} />
                <input
                  className={inputCls}
                  type="tel"
                  placeholder="Телефон отримувача *"
                  value={rec.phone}
                  onChange={(e) => setRec({ ...rec, phone: nextPhone(rec.phone, e.target.value) })}
                />
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="font-semibold">Доставка</h4>
          {saved.addresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {saved.addresses.map((a) => {
                const t = savedAddressTitle(a);
                return (
                  <button type="button" key={a._id} className={chipCls(false)} onClick={() => setDel(fromSaved(a))}>
                    {t.head}
                    <span className="block text-xs opacity-70 font-normal">{t.sub}</span>
                  </button>
                );
              })}
            </div>
          )}
          <DeliveryFields form={del} setForm={setDel} npOn={npOn} onNpOff={() => setNpOn(false)} />
        </section>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="px-5 py-2 rounded-md bg-[var(--bg-card-processBtn)] text-[var(--text-card)] disabled:opacity-60"
          >
            {busy ? "Зачекайте..." : "Зберегти зміни"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--border-myOrders)]">
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditShipping;
