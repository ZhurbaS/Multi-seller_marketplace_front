// Спільні класи кабінету покупця (лише семантичні токени, див. DESIGN_GUIDE.md).

// Поле форми: 48px, ≥16px (глобально), рамка --line-strong, фокус --brand
export const inputCls =
  "w-full h-12 px-3 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) outline-none focus:border-(--brand) disabled:opacity-60 aria-[invalid=true]:border-(--danger)";
export const textareaCls =
  "w-full min-h-28 px-3 py-3 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) outline-none focus:border-(--brand)";

const btnBase =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-(--r-md) text-[0.9375rem] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
// Головна дія екрана (оплатити) — --cta
export const btnCta = `${btnBase} bg-(--cta) text-(--on-cta) hover:bg-(--cta-hover)`;
// Основна дія форми (зберегти) — --brand
export const btnPrimary = `${btnBase} bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)`;
// Другорядна дія
export const btnSecondary = `${btnBase} border border-(--line-strong) bg-(--surface) text-(--ink) hover:bg-(--surface-2)`;
// Небезпечна дія (відкликати / видалити)
export const btnDanger = `${btnBase} border border-(--danger) bg-(--surface) text-(--danger) hover:bg-(--danger-soft)`;
// На мобільних — на всю ширину, від sm — за вмістом
export const fullMobile = "w-full sm:w-auto";

export const cardCls = "bg-(--surface) border border-(--line) rounded-(--r-lg)";

// Чіп-фільтр (aria-pressed)
export const chipCls = (on) =>
  `inline-flex items-center min-h-11 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
    on
      ? "bg-(--brand-soft) border-(--brand) text-(--brand-ink)"
      : "bg-(--surface) border-(--line) text-(--ink-2) hover:bg-(--surface-2)"
  }`;

// Тони бейджів: колір + завжди текст
export const TONE = {
  success: "bg-(--success-soft) text-(--success)",
  danger: "bg-(--danger-soft) text-(--danger)",
  brand: "bg-(--brand-soft) text-(--brand-ink)",
  neutral: "bg-(--surface-2) text-(--ink-2)",
};

// Тон статусу доставки замовлення
export const deliveryTone = (s) =>
  ({
    delivered: "success",
    cancelled: "danger",
    shipped: "brand",
    processing: "brand",
    packing: "brand",
    placed: "brand",
  })[s] || "neutral";

// Тон статусу заявки на повернення
export const returnTone = (s) =>
  ({
    refunded: "success",
    exchanged: "success",
    rejected: "danger",
    approved: "brand",
    shipped: "brand",
    received: "brand",
    refund_pending: "brand",
  })[s] || "neutral";

// Чи можна оплатити замовлення онлайн
export const canPayOrder = (o, { allowInvoice = false } = {}) =>
  o.payment_status !== "paid" &&
  o.payment_method !== "cod" &&
  (allowInvoice || o.payment_method !== "invoice") &&
  o.delivery_status !== "cancelled";
