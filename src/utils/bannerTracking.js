import { getApiUrl } from "../api/api";

// Трекінг банерів: view — раз за сесію на банер (sessionStorage), click — кожен клік.
// Надсилання через fetch keepalive (переживає перехід сторінки; коректний CORS для JSON),
// запасний — navigator.sendBeacon.
// Будь-які помилки мовчки ігноруються — сайт працює без трекінгу.
const SEEN_KEY = "ts-ban-seen";
const seenMem = new Set();

const readSeen = () => {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set(seenMem);
  }
};

const markSeen = (id) => {
  seenMem.add(id);
  try {
    const s = readSeen();
    s.add(id);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-200)));
  } catch {
    /* ignore */
  }
};

const isSeen = (id) => seenMem.has(id) || readSeen().has(id);

// Валідний ObjectId — запасні (legacy) банери можуть не мати власних лічильників
const validId = (id) => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);

export function sendBannerEvent(id, type) {
  if (!validId(id) || (type !== "view" && type !== "click")) return;
  try {
    const url = getApiUrl(`/home/banners/${id}/event`);
    const body = JSON.stringify({ type });
    if (typeof fetch === "function") {
      // keepalive — запит завершиться навіть після переходу на іншу сторінку
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

export const trackClick = (id) => sendBannerEvent(id, "click");

// Спостерігає за елементом: коли ≥50% видно — один view за сесію. Повертає cleanup.
export function observeBannerView(el, id) {
  if (!el || !validId(id) || isSeen(id)) return () => {};
  if (typeof IntersectionObserver === "undefined") return () => {};
  let io;
  try {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5 && !document.hidden) {
            io.disconnect();
            if (isSeen(id)) return;
            markSeen(id);
            sendBannerEvent(id, "view");
            return;
          }
        }
      },
      { threshold: [0.5] },
    );
    io.observe(el);
  } catch {
    return () => {};
  }
  return () => io?.disconnect();
}
