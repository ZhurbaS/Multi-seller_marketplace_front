// Згода на cookies (категорії: необхідні — завжди; аналітика; маркетинг).
// Вибір зберігаємо у first-party cookie «ts_consent» (до 12 місяців) разом із версією політики.
// Скрипти аналітики/реклами завантажуються лише після згоди (Google Consent Mode v2: до вибору — denied).

const COOKIE = "ts_consent";
const VERSION = 1; // збільшіть, щоб знову запитати згоду (нові категорії/постачальники)
const MONTHS = 12;
const EVENT = "ts-consent-change";

export const GA_ID = import.meta.env.VITE_GA_ID || "";
export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "";

export function readConsent() {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (!m) return null;
    const c = JSON.parse(decodeURIComponent(m[1]));
    if (!c || c.v !== VERSION) return null; // версія змінилась — запитуємо знову
    return { analytics: c.a === 1, marketing: c.m === 1, at: c.t };
  } catch {
    return null;
  }
}

export function saveConsent({ analytics, marketing }) {
  const value = encodeURIComponent(JSON.stringify({ v: VERSION, a: analytics ? 1 : 0, m: marketing ? 1 : 0, t: Date.now() }));
  const maxAge = MONTHS * 30 * 24 * 60 * 60;
  document.cookie = `${COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (!analytics) clearAnalyticsCookies();
  applyConsent({ analytics, marketing });
  window.dispatchEvent(new Event(EVENT));
}

export const onConsentChange = (fn) => {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};

// Видаляємо cookies Google Analytics після відкликання згоди
function clearAnalyticsCookies() {
  const host = location.hostname.split(".");
  const domains = ["", ...host.map((_, i) => "." + host.slice(i).join("."))];
  document.cookie.split("; ").forEach((c) => {
    const name = c.split("=")[0];
    if (/^_ga($|_)|^_gid$|^_gat/.test(name)) {
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; Path=/${d ? `; Domain=${d}` : ""}`;
      });
    }
  });
}

function gtag() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments); // eslint-disable-line prefer-rest-params
}

// Consent Mode v2: до вибору користувача все заборонено
export function initConsentMode() {
  if (!GA_ID || window.__tsConsentInit) return;
  window.__tsConsentInit = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || gtag;
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
}

function loadScript(src) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

// Оновлюємо Consent Mode й підвантажуємо скрипти тільки за згодою
export function applyConsent({ analytics, marketing }) {
  if (GA_ID) {
    initConsentMode();
    window.gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: marketing ? "granted" : "denied",
      ad_user_data: marketing ? "granted" : "denied",
      ad_personalization: marketing ? "granted" : "denied",
    });
    if ((analytics || marketing) && !window.__tsGaLoaded) {
      window.__tsGaLoaded = true;
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`);
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { anonymize_ip: true });
    }
  }
  if (META_PIXEL_ID && marketing && !window.__tsFbLoaded) {
    window.__tsFbLoaded = true;
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
}

// Відкрити панель налаштувань (кнопка в футері)
export const openCookieSettings = () => window.dispatchEvent(new Event("ts-open-cookie-settings"));
export const OPEN_EVENT = "ts-open-cookie-settings";
