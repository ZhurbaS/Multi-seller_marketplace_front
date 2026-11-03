import React, { useEffect, useState } from "react";
import api from "../api/api";

const INVOICE_CHANNELS = [
  ["email", "На електронну пошту"],
  ["viber", "У Viber"],
  ["whatsapp", "У WhatsApp"],
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
    <div className="flex flex-col gap-2 mt-1">
      <span className="font-semibold">Куди надіслати рахунок</span>
      <div className="flex gap-4 flex-wrap">
        {INVOICE_CHANNELS.filter(([id]) => available.includes(id)).map(([id, label]) => (
          <label key={id} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="invoiceChannel" checked={value === id} onChange={() => onChange(id)} />
            {label}
          </label>
        ))}
      </div>
      {value !== "email" && (
        <p className="text-xs opacity-70">
          Рахунок (PDF) буде надіслано у {value === "viber" ? "Viber" : "WhatsApp"} на номер {phone || "із замовлення"}. Якщо автоматична відправка
          недоступна, його надішле менеджер. Рахунок також можна завантажити в особистому кабінеті одразу після оформлення.
        </p>
      )}
    </div>
  );
};

export default InvoiceChannelPick;
