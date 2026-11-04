import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import DeliveryFields from "../DeliveryFields";
import { DELIVERY_TYPES, emptyDelivery, deliveryError, fromSaved, toPayload, savedAddressTitle } from "../../utils/delivery";
import { isValidPhone, maskPhone, nextPhone } from "../../utils/phone";
import { Field, FieldError, Sheet } from "./Kit";
import { btnPrimary, btnSecondary, fullMobile, inputCls } from "./ui";

const pickCls =
  "min-h-11 px-3 py-2 rounded-(--r-md) border border-(--line) bg-(--surface) text-sm text-left hover:bg-(--surface-2) focus:border-(--brand)";

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
  const [errs, setErrs] = useState({}); // інлайн-помилки { поле: текст }

  useEffect(() => {
    api
      .get("/home/customer/checkout-data")
      .then(({ data }) => {
        setSaved({ addresses: data.addresses || [], recipients: data.recipients || [] });
        setNpOn(!!data.novaPoshta);
      })
      .catch(() => {});
  }, []);

  // Перша помилка: [поле, текст]
  const error = () => {
    if (name.trim().length < 2) return ["name", "Вкажіть ім'я замовника"];
    if (!isValidPhone(phone)) return ["phone", "Вкажіть коректний телефон замовника"];
    if (other) {
      if (!rec.lastName.trim()) return ["recLast", "Вкажіть прізвище отримувача"];
      if (!rec.firstName.trim()) return ["recFirst", "Вкажіть ім'я отримувача"];
      if (!isValidPhone(rec.phone)) return ["recPhone", "Вкажіть коректний телефон отримувача"];
    }
    const d = deliveryError(del, npOn);
    return d ? ["delivery", d] : null;
  };

  const save = async () => {
    const err = error();
    if (err) {
      setErrs({ [err[0]]: err[1] });
      return toast.error(err[1]);
    }
    setErrs({});
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

  const clr = (k) => errs[k] && setErrs({ ...errs, [k]: "" });

  return (
    <Sheet
      title="Змінити отримувача та доставку"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={`${btnSecondary} ${fullMobile}`}>
            Скасувати
          </button>
          <button type="button" onClick={save} disabled={busy} className={`${btnPrimary} ${fullMobile} min-h-12`}>
            {busy ? "Зачекайте..." : "Зберегти зміни"}
          </button>
        </>
      }
    >
      <p className="text-sm bg-(--brand-soft) text-(--ink) rounded-(--r-md) p-3">
        Зміну можна зробити, поки замовлення не відправлено. Вона може потребувати додаткового часу на опрацювання — ми повідомимо вас листом.
      </p>

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Замовник</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Ім'я" required error={errs.name}>
            {(a) => (
              <input
                {...a}
                className={inputCls}
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clr("name");
                }}
              />
            )}
          </Field>
          <Field label="Телефон" required error={errs.phone}>
            {(a) => (
              <input
                {...a}
                className={inputCls}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+38(067)-323-57-85"
                value={phone}
                onChange={(e) => {
                  setPhone(nextPhone(phone, e.target.value));
                  clr("phone");
                }}
              />
            )}
          </Field>
        </div>
        <label className="flex items-center gap-3 min-h-11 cursor-pointer text-[0.9375rem]">
          <input
            type="checkbox"
            className="w-5 h-5 accent-(--brand)"
            checked={other}
            onChange={(e) => setOther(e.target.checked)}
          />
          Інший отримувач замовлення
        </label>
        {other && (
          <div className="flex flex-col gap-3">
            {saved.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Збережені отримувачі">
                {saved.recipients.map((r) => (
                  <button
                    type="button"
                    key={r._id}
                    className={pickCls}
                    onClick={() => setRec({ lastName: r.lastName, firstName: r.firstName, middleName: r.middleName || "", phone: maskPhone(r.phone) })}
                  >
                    {r.lastName} {r.firstName}
                    <span className="block text-xs text-(--ink-2) font-normal">{r.phone}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Прізвище" required error={errs.recLast}>
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    autoComplete="family-name"
                    value={rec.lastName}
                    onChange={(e) => {
                      setRec({ ...rec, lastName: e.target.value });
                      clr("recLast");
                    }}
                  />
                )}
              </Field>
              <Field label="Ім'я" required error={errs.recFirst}>
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    autoComplete="given-name"
                    value={rec.firstName}
                    onChange={(e) => {
                      setRec({ ...rec, firstName: e.target.value });
                      clr("recFirst");
                    }}
                  />
                )}
              </Field>
              <Field label="По батькові">
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    autoComplete="additional-name"
                    value={rec.middleName}
                    onChange={(e) => setRec({ ...rec, middleName: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Телефон отримувача" required error={errs.recPhone}>
                {(a) => (
                  <input
                    {...a}
                    className={inputCls}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+38(067)-323-57-85"
                    value={rec.phone}
                    onChange={(e) => {
                      setRec({ ...rec, phone: nextPhone(rec.phone, e.target.value) });
                      clr("recPhone");
                    }}
                  />
                )}
              </Field>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Доставка</h3>
        {saved.addresses.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Збережені адреси">
            {saved.addresses.map((a) => {
              const t = savedAddressTitle(a);
              return (
                <button type="button" key={a._id} className={pickCls} onClick={() => setDel(fromSaved(a))}>
                  {t.head}
                  <span className="block text-xs text-(--ink-2) font-normal">{t.sub}</span>
                </button>
              );
            })}
          </div>
        )}
        <DeliveryFields
          form={del}
          setForm={(v) => {
            setDel(v);
            clr("delivery");
          }}
          npOn={npOn}
          onNpOff={() => setNpOn(false)}
        />
        {errs.delivery && <FieldError>{errs.delivery}</FieldError>}
      </section>
    </Sheet>
  );
};

export default EditShipping;
