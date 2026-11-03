import React from "react";

export const INVOICE_CHANNELS = [
  ["email", "На електронну пошту"],
  ["viber", "У Viber"],
  ["whatsapp", "У WhatsApp"],
];

// Куди надіслати рахунок. На e-mail — автоматично; у месенджер — менеджер надішле на ваш номер телефону.
// Рахунок у будь-якому разі доступний у кабінеті (деталі замовлення).
const InvoiceChannelPick = ({ value, onChange, phone }) => (
  <div className="flex flex-col gap-2 mt-1">
    <span className="font-semibold">Куди надіслати рахунок</span>
    <div className="flex gap-4 flex-wrap">
      {INVOICE_CHANNELS.map(([id, label]) => (
        <label key={id} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="invoiceChannel" checked={value === id} onChange={() => onChange(id)} />
          {label}
        </label>
      ))}
    </div>
    {value !== "email" && (
      <p className="text-xs opacity-70">
        Менеджер надішле рахунок (PDF) у {value === "viber" ? "Viber" : "WhatsApp"} на номер {phone || "із замовлення"}, зазвичай протягом
        робочого дня. Рахунок також можна завантажити в особистому кабінеті одразу після оформлення.
      </p>
    )}
  </div>
);

export default InvoiceChannelPick;
