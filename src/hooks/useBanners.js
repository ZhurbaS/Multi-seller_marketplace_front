import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/api";

// Банери плейсменту: GET /home/banners/:placement?category=&audience=
// Модульний кеш на 60 с + дедуплікація паралельних запитів (той самий ключ — один запит).
// Помилка / неочікувана відповідь → порожній список (сайт працює без банерів),
// поле error=true дає змогу компоненту за потреби взяти запасне джерело.
const TTL = 60 * 1000;
const DEFAULT_SETTINGS = { autoplay: true, intervalSec: 6 };
const EMPTY = { banners: [], settings: DEFAULT_SETTINGS, error: false };

const cache = new Map(); // key → { at, value }
const pending = new Map(); // key → Promise<value>

const str = (v) => (typeof v === "string" ? v : "");
const img = (v) =>
  v && typeof v === "object" && str(v.url)
    ? { url: v.url, width: Number(v.width) || 0, height: Number(v.height) || 0 }
    : null;

const normBanner = (b) => {
  if (!b || typeof b !== "object") return null;
  const kind = b.kind === "text" ? "text" : "image";
  const out = {
    _id: str(b._id) || String(b._id || ""),
    kind,
    imageDesktop: img(b.imageDesktop),
    imageMobile: img(b.imageMobile),
    alt: str(b.alt),
    headline: str(b.headline),
    subline: str(b.subline),
    ctaLabel: str(b.ctaLabel),
    bgColor: str(b.bgColor),
    textColor: str(b.textColor),
    href: str(b.href) || null,
    external: b.external === true,
    newTab: b.newTab === true,
    device: b.device === "desktop" || b.device === "mobile" ? b.device : "all",
  };
  if (kind === "image" && !out.imageDesktop && !out.imageMobile) return null;
  if (kind === "text" && !out.headline && !out.subline) return null;
  return out;
};

const normalize = (data) => {
  const d = data && typeof data === "object" ? data : {};
  const s = d.settings && typeof d.settings === "object" ? d.settings : {};
  const sec = Number(s.intervalSec);
  return {
    banners: (Array.isArray(d.banners) ? d.banners : []).map(normBanner).filter(Boolean),
    settings: {
      autoplay: s.autoplay !== false,
      intervalSec: sec >= 3 && sec <= 15 ? sec : DEFAULT_SETTINGS.intervalSec,
    },
    error: false,
  };
};

const fresh = (key) => {
  const c = cache.get(key);
  return c && Date.now() - c.at < TTL ? c.value : null;
};

const load = (placement, category, audience) => {
  const key = `${placement}|${category}|${audience}`;
  const hit = fresh(key);
  if (hit) return Promise.resolve(hit);
  if (pending.has(key)) return pending.get(key);
  const p = api
    .get(`/home/banners/${encodeURIComponent(placement)}`, {
      params: { ...(category ? { category } : {}), audience },
    })
    .then(({ data }) => normalize(data))
    .catch(() => ({ ...EMPTY, error: true }))
    .then((value) => {
      cache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
};

export const audienceOf = (userInfo) => {
  if (!userInfo || typeof userInfo !== "object") return "guest";
  if (userInfo.guest && !userInfo.email) return "guest";
  return "customer";
};

export default function useBanners(placement, { category = "" } = {}) {
  const userInfo = useSelector((s) => s.auth?.userInfo);
  const audience = audienceOf(userInfo);
  const cat = str(category).trim();
  const key = `${placement}|${cat}|${audience}`;

  const [state, setState] = useState(() => ({ key, value: fresh(key) }));
  const value = state.key === key ? state.value : fresh(key);

  useEffect(() => {
    if (!placement) return;
    let alive = true;
    load(placement, cat, audience).then((v) => {
      if (alive) setState({ key, value: v });
    });
    return () => {
      alive = false;
    };
  }, [placement, cat, audience, key]);

  const v = value || EMPTY;
  return { banners: v.banners, settings: v.settings, loading: !value, error: v.error };
}
