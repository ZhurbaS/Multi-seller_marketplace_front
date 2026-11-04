import { useEffect, useState } from "react";
import api from "../api/api";

// Публічні налаштування розсилок (GET /home/marketing-config):
// { telegramBot: '<username>'|null, consentText: { footer, checkout, version } }.
// Кешуємо на рівні модуля — один запит на сесію, усі компоненти отримують ту саму відповідь.
const EMPTY = { telegramBot: null, consentText: {}, loaded: false };
let cache = null;
let pending = null;

const load = () => {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = api
      .get("/home/marketing-config")
      .then(({ data }) => {
        cache = {
          telegramBot: data?.telegramBot || null,
          consentText: data?.consentText || {},
          loaded: true,
        };
        return cache;
      })
      .catch(() => {
        pending = null; // наступний монтаж спробує ще раз
        return { ...EMPTY, loaded: true };
      });
  }
  return pending;
};

export default function useMarketingConfig() {
  const [cfg, setCfg] = useState(cache || EMPTY);
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    load().then((c) => alive && setCfg(c));
    return () => {
      alive = false;
    };
  }, []);
  return cfg;
}

// Запасні тексти згоди (коли бекенд ще не віддав свої)
export const FALLBACK_CONSENT = "Хочу отримувати новини та пропозиції на e-mail. Можна відписатися будь-коли.";

// Теми розсилки (ключі — як у Contact.channels.*.topics)
export const TOPICS = [
  { key: "promo", label: "Акції та знижки", hint: "Розпродажі, промокоди, спецціни" },
  { key: "news", label: "Новинки", hint: "Нові товари й бренди в каталозі" },
  { key: "restock", label: "Повернення в наявність", hint: "Коли популярні товари знову є" },
  { key: "tips", label: "Поради й огляди", hint: "Як обрати техніку, корисні статті" },
];
export const DEFAULT_TOPICS = { promo: true, news: true, restock: true, tips: false };

export const FREQUENCIES = [
  { key: "normal", label: "Звичайна", hint: "Не частіше двох листів на тиждень" },
  { key: "weekly", label: "Раз на тиждень", hint: "Короткий дайджест" },
  { key: "monthly", label: "Раз на місяць", hint: "Лише найважливіше" },
];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Людська назва статусу e-mail підписки
export const emailStatusLabel = (s) =>
  ({
    subscribed: "Підписка активна",
    pending: "Очікує підтвердження",
    unsubscribed: "Ви відписані",
    bounced: "Адреса недоступна",
    complained: "Розсилку вимкнено",
    cleaned: "Не підтверджено",
    none: "Не підписані",
  })[s] || "Не підписані";

export const telegramStatusLabel = (s) =>
  ({
    subscribed: "Підключено",
    unsubscribed: "Вимкнено",
    blocked: "Бот заблоковано",
    none: "Не підключено",
  })[s] || "Не підключено";

// <meta name="robots" content="noindex"> на час показу сторінки
export function useNoindex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

// Кнопки публічних сторінок підписки (/subscribe/confirm, /preferences, /unsubscribe)
const subBtnBase =
  "inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-12 px-5 rounded-(--r-md) text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed";
export const subBtnBrand = `${subBtnBase} bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)`;
export const subBtnGhost = `${subBtnBase} border border-(--line-strong) bg-(--surface) text-(--ink) hover:bg-(--surface-2)`;
