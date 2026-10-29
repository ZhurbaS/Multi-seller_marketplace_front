// Підписи для заявок на повернення (українською)
export const RETURN_STATUS = {
  requested: "Розглядається",
  approved: "Схвалено — очікуємо товар",
  shipped: "Товар у дорозі",
  received: "Товар отримано, перевіряємо",
  refund_pending: "Готуємо повернення коштів",
  refunded: "Кошти повернено",
  exchanged: "Обмінено",
  rejected: "Відхилено",
  cancelled: "Відкликано",
};

export const RETURN_REASON = {
  withdrawal: "Відмова від товару (передумав)",
  defect: "Брак / дефект",
  wrong_item: "Не той товар / некомплект",
  refused: "Відмова від отримання",
  cancel_unshipped: "Скасування до відправки",
  cancel_by_store: "Скасовано магазином",
  other: "Інше",
};

export const RETURN_STATUS_COLOR = {
  requested: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  shipped: "bg-blue-100 text-blue-800",
  received: "bg-blue-100 text-blue-800",
  refund_pending: "bg-orange-100 text-orange-800",
  refunded: "bg-green-100 text-green-800",
  exchanged: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
