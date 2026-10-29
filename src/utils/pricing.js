// Лише для ВІДОБРАЖЕННЯ цін на сайті. Остаточні суми завжди рахує сервер
// (back/utiles/pricing.js) — тут формули ті самі, щоб покупець бачив правильну ціну.

export const baseUnitPrice = (p) =>
  p.price - Math.floor((p.price * (p.discount || 0)) / 100);

export const tierPercent = (tiers, qty) =>
  (tiers || []).reduce(
    (best, t) => (qty >= t.minQty && t.percent > best ? t.percent : best),
    0
  );

export const unitPrice = (p, qty) => {
  const base = baseUnitPrice(p);
  return base - Math.floor((base * tierPercent(p.priceTiers, qty)) / 100);
};

// Текст про очікуваний термін поставки: "20–30 днів", "до 30 днів", "від 20 днів" або ""
export const restockText = (p) => {
  const { restockDaysMin: a, restockDaysMax: b } = p;
  if (a && b) return a === b ? `${a} дн.` : `${a}–${b} дн.`;
  if (b) return `до ${b} дн.`;
  if (a) return `від ${a} дн.`;
  return "";
};
