import React, { useEffect, useState } from "react";
import { LuMail, LuMessageCircle, LuPhone } from "react-icons/lu";
import api from "../api/api";
import { RadioCard } from "./CheckoutUi";

const INVOICE_CHANNELS = [
  ["email", "На електронну пошту", <LuMail key="i" />, "PDF-рахунок надійде автоматично"],
  ["viber", "У Viber", <LuMessageCircle key="i" />, "На номер телефону із замовлення"],
  ["whatsapp", "У WhatsApp", <LuPhone key="i" />, "На номер телефону із замовлення"],
];

// Куди надіслати рахунок. Месенджери показуємо лише якщо адмін їх увімкнув (за замовчуванням — тільки e-mail).
// На e-mail — автоматично; у месенджер — на номер телефону із замовлення. Рахунок у будь-якому разі доступний у кабінеті.
const InvoiceChannelPick = ({ value, onChange, phone }) => {
  const [available, setAvailable] = useState(["email"]);
  useEffect(() => {
    let alive = true;
    api
      .get("/pay/invoice-channels")
      .then(({ data }) => {
        if (!alive) return;
        const list = data.channels?.length ? data.channels : ["email"];
        setAvailable(list);
        if (!list.includes(value)) onChange("email");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (available.length < 2) return null;
  return (
    <fieldset className="flex flex-col gap-2 mt-1">
      <legend className="text-[15px] font-semibold text-(--ink) mb-2">Куди надіслати рахунок</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INVOICE_CHANNELS.filter(([id]) => available.includes(id)).map(([id, label, icon, sub]) => (
          <RadioCard key={id} name="invoiceChannel" checked={value === id} onChange={() => onChange(id)} title={label} sub={sub} icon={icon} />
        ))}
      </div>
      {value !== "email" && (
        <p className="text-sm text-(--ink-2)" aria-live="polite">
          Рахунок (PDF) буде надіслано у {value === "viber" ? "Viber" : "WhatsApp"} на номер {phone || "із замовлення"}. Якщо автоматична відправка
          недоступна, його надішле менеджер. Рахунок також можна завантажити в особистому кабінеті одразу після оформлення.
        </p>
      )}
    </fieldset>
  );
};

export default InvoiceChannelPick;
