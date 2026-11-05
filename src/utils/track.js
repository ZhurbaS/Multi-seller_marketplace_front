import { getApiUrl } from "../api/api";

// Privacy-first трекінг переглядів товару (DASHBOARD_SPEC §4).
// Нічого не пише в cookie/localStorage/sessionStorage; credentials: 'omit'.
// Дедуп лише в пам'яті модуля: повтор того самого товару одразу після відкриття
// (React StrictMode, повторний рендер) не рахується; новий захід на товар — рахується.
// Будь-які помилки мовчки ігноруються.
const DEDUP_MS = 3000;
let last = { id: null, at: 0 };

const validId = (id) => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);

const cut = (v, n) => (typeof v === "string" && v ? v.slice(0, n) : undefined);

function readUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = {
      source: cut(p.get("utm_source"), 100),
      medium: cut(p.get("utm_medium"), 100),
      campaign: cut(p.get("utm_campaign"), 100),
    };
    return utm.source || utm.medium || utm.campaign ? utm : undefined;
  } catch {
    return undefined;
  }
}

function readRef() {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    if (!host || host === window.location.hostname) return undefined;
    return host.slice(0, 100);
  } catch {
    return undefined;
  }
}

export function trackProductView(productId) {
  try {
    if (!validId(productId)) return;
    const now = Date.now();
    if (last.id === productId && now - last.at < DEDUP_MS) return;
    last = { id: productId, at: now };

    const payload = { type: "view", productId };
    const ref = readRef();
    const utm = readUtm();
    if (ref) payload.ref = ref;
    if (utm) payload.utm = utm;

    const url = getApiUrl("/home/track");
    const body = JSON.stringify(payload);
    if (typeof fetch === "function") {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
      return;
    }
    navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
  } catch {
    /* ignore */
  }
}
