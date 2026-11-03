// Підписи статусів і адреси доставки (українською)
export const PAYMENT_STATUS = { paid: "Оплачено", unpaid: "Не оплачено" };

export const DELIVERY_STATUS = {
  pending: "Очікує обробки",
  placed: "Розміщено",
  processing: "Опрацьовується",
  packing: "Готується до відправки",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

export const payLabel = (s) => PAYMENT_STATUS[s] || s || "—";
export const deliveryLabel = (s) => DELIVERY_STATUS[s] || s || "—";

export const DELIVERY_TYPE = {
  nova_poshta_warehouse: "Нова пошта — у відділення",
  nova_poshta_postomat: "Нова пошта — у поштомат",
  nova_poshta_courier: "Нова пошта — кур'єр",
  ukrposhta: "Укрпошта",
  pickup: "Самовивіз",
};

// Адреса доставки одним рядком (підтримує старі замовлення з іншим набором полів)
export const formatAddress = (si) => {
  if (!si || typeof si !== "object") return String(si || "");
  const parts = [
    si.district,
    si.city,
    si.warehouse ? `відділення № ${si.warehouse}` : "",
    si.area,
    si.address,
    si.post,
  ].filter(Boolean);
  return parts.join(", ");
};

export const recipientText = (si) => {
  const r = si?.recipient;
  if (!r?.other) return "";
  return `${r.lastName} ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}, ${r.phone}`;
};

// Короткий номер замовлення (старі замовлення без номера — останні 6 символів id)
export const orderNo = (o) => `№${o?.orderNumber || String(o?._id || "").slice(-6).toUpperCase()}`;

// Дата й час українською: «26 жовтня 2026, 14:35»
export const formatDateTime = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("uk-UA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
export const formatDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const PAYMENT_METHOD = {
  monobank: "Картка (monobank)",
  liqpay: "Картка (LiqPay)",
  mock: "Тестова оплата",
  cod: "Оплата при отриманні",
  invoice: "Безготівковий розрахунок за рахунком",
};
export const methodLabel = (m) => PAYMENT_METHOD[m] || "Спосіб оплати не обрано";

// Колір значка статусу замовлення (Tailwind-класи)
export const statusBadge = (s) =>
  ({
    cancelled: "bg-red-100 text-red-700",
    delivered: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    processing: "bg-amber-100 text-amber-700",
    packing: "bg-amber-100 text-amber-700",
  }[s] || "bg-slate-100 text-slate-700");

// Розрахунок рядка замовлення (для старих замовлень без unitPrice)
export const unitPriceOf = (p) =>
  p.unitPrice ?? (p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100) * 100) / 100 : p.price);
