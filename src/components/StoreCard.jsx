import React, { useMemo } from "react";
import {
  LuClock,
  LuMail,
  LuMapPin,
  LuNavigation,
  LuPackageCheck,
  LuPhone,
  LuStore,
} from "react-icons/lu";

/* ---------- Години роботи: розпізнавання «Пн–Пт 10:00–19:00» ---------- */

// Індекс дня тижня як у Date#getDay (0 — неділя)
const DAY_PREFIXES = [
  [0, ["нд", "нед", "вс"]],
  [1, ["пн", "пон"]],
  [2, ["вт", "вів"]],
  [3, ["ср", "сер"]],
  [4, ["чт", "чет"]],
  [5, ["пт", "п'ят", "пʼят", "п’ят"]],
  [6, ["сб", "суб"]],
];
const dayIndex = (word) => {
  const w = word.trim().toLowerCase().replace(/\.$/, "");
  if (!w) return null;
  for (const [i, list] of DAY_PREFIXES) if (list.some((p) => w.startsWith(p))) return i;
  return null;
};

const DASH = "[-–—]";
const TIME_RE = new RegExp(`(\\d{1,2})[:.](\\d{2})\\s*${DASH}\\s*(\\d{1,2})[:.](\\d{2})`);
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// Рядок → { days:number[], from, to } (хвилини) | { days, closed:true } | null
const parseLine = (line) => {
  const raw = line.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const tm = lower.match(TIME_RE);
  const closed = /вихідн|зачинен|не працю/.test(lower);
  if (!tm && !closed) return null;

  const dayPart = (tm ? lower.slice(0, tm.index) : lower.replace(/вихідн\S*|зачинен\S*|не працю\S*/g, ""))
    .replace(/[\s:\-–—]+$/, "")
    .trim();

  let days = [];
  if (!dayPart || /щодня|щоденно|без вихідних/.test(dayPart)) {
    days = ALL_DAYS;
  } else {
    for (const chunk of dayPart.split(/[,;]/)) {
      const parts = chunk.split(new RegExp(DASH));
      if (parts.length === 2) {
        const a = dayIndex(parts[0]);
        const b = dayIndex(parts[1]);
        if (a == null || b == null) return null;
        // Діапазон по колу тижня в порядку Пн..Нд
        const order = [1, 2, 3, 4, 5, 6, 0];
        let i = order.indexOf(a);
        const end = order.indexOf(b);
        for (let guard = 0; guard < 7; guard++) {
          days.push(order[i]);
          if (i === end) break;
          i = (i + 1) % 7;
        }
      } else {
        const d = dayIndex(chunk);
        if (d == null) return null;
        days.push(d);
      }
    }
  }
  if (!days.length) return null;
  if (!tm) return { days, closed: true };
  const [, h1, m1, h2, m2] = tm.map(Number);
  if (h1 > 24 || h2 > 24 || m1 > 59 || m2 > 59) return null;
  return { days, from: h1 * 60 + m1, to: h2 * 60 + m2 };
};

// Поточні день/хвилина за київським часом (запасний варіант — локальний час)
const nowInKyiv = () => {
  const d = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Kyiv",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    if (wd >= 0) return { day: wd, min: Number(get("hour")) * 60 + Number(get("minute")) };
  } catch {
    /* немає підтримки часових поясів */
  }
  return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
};

// true — відчинено, false — зачинено, null — формат не розпізнано
const openStatus = (lines) => {
  const rules = lines.map(parseLine);
  if (!rules.length || rules.some((r) => r === null)) return null;
  const { day, min } = nowInKyiv();
  const prev = (day + 6) % 7;
  let open = false;
  for (const r of rules) {
    if (r.closed) continue;
    if (r.to > r.from) {
      if (r.days.includes(day) && min >= r.from && min < r.to) open = true;
    } else {
      // нічна зміна (напр. 20:00–02:00)
      if (r.days.includes(day) && min >= r.from) open = true;
      if (r.days.includes(prev) && min < r.to) open = true;
    }
  }
  return open;
};

/* ---------- Посилання ---------- */

const telHref = (phone) => {
  let d = String(phone).replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(d)) d = `+38${d}`;
  else if (/^380\d{9}$/.test(d)) d = `+${d}`;
  return `tel:${d}`;
};

const routeHref = (s) => {
  if (s.mapUrl) return s.mapUrl;
  const lat = Number(s.lat);
  const lng = Number(s.lng);
  if (s.lat != null && s.lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const q = [s.address, s.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || s.name || "")}`;
};

/* ---------- Картка ---------- */

const btn =
  "flex-1 min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-(--r-md) text-[0.9375rem] font-semibold motion-safe:transition-colors";

const StoreCard = ({ store: s, headingLevel = 2 }) => {
  const lines = useMemo(
    () =>
      String(s.hours || "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [s.hours]
  );
  const status = useMemo(() => (lines.length ? openStatus(lines) : null), [lines]);
  const H = `h${headingLevel}`;
  const addressLine = [s.address, s.city].filter(Boolean).join(", ");
  const hasRoute = !!(s.mapUrl || addressLine || (s.lat != null && s.lng != null));

  return (
    <article className="flex flex-col h-full bg-(--surface) border border-(--line) rounded-(--r-lg) overflow-hidden shadow-(--shadow-1)">
      <div className="aspect-[16/9] bg-(--surface-2)">
        {s.photo ? (
          <img
            src={s.photo}
            alt={`Магазин ${s.name || ""}`.trim()}
            loading="lazy"
            decoding="async"
            width="640"
            height="360"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-(--ink-2)" aria-hidden="true">
            <span className="grid place-items-center w-16 h-16 rounded-full bg-(--surface) border border-(--line)">
              <LuStore size={30} className="text-(--brand-ink)" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 gap-3 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <H className="text-lg/6 font-bold text-(--ink) break-words">{s.name}</H>
          {s.pickup && (
            <span className="inline-flex items-center gap-1 rounded-full bg-(--success-soft) text-(--success) text-xs font-semibold px-2.5 py-1">
              <LuPackageCheck aria-hidden="true" size={14} />
              Є самовивіз
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-2.5 text-[0.9375rem]/6 text-(--ink)">
          {addressLine && (
            <li className="flex items-start gap-2.5">
              <LuMapPin aria-hidden="true" size={20} className="shrink-0 mt-0.5 text-(--brand-ink)" />
              <span>
                <span className="sr-only">Адреса: </span>
                {s.address}
                {s.city && <span className="block text-sm text-(--ink-2)">{s.city}</span>}
              </span>
            </li>
          )}

          {lines.length > 0 && (
            <li className="flex items-start gap-2.5">
              <LuClock aria-hidden="true" size={20} className="shrink-0 mt-0.5 text-(--brand-ink)" />
              <div className="min-w-0">
                <span className="sr-only">Години роботи: </span>
                {status !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 mb-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      status ? "bg-(--success-soft) text-(--success)" : "bg-(--surface-2) text-(--ink-2)"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-2 h-2 rounded-full ${status ? "bg-(--success)" : "bg-(--line-strong)"}`}
                    />
                    {status ? "Відчинено зараз" : "Зачинено"}
                  </span>
                )}
                <ul className="text-sm/5 text-(--ink-2) tabular-nums">
                  {lines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </li>
          )}

          {s.phone && (
            <li className="flex items-center gap-2.5">
              <LuPhone aria-hidden="true" size={20} className="shrink-0 text-(--brand-ink)" />
              <a
                href={telHref(s.phone)}
                className="inline-flex items-center min-h-11 -my-2.5 font-semibold text-(--ink) [@media(hover:hover)]:hover:text-(--brand-ink) [@media(hover:hover)]:hover:underline"
              >
                <span className="sr-only">Телефон: </span>
                {s.phone}
              </a>
            </li>
          )}

          {s.email && (
            <li className="flex items-center gap-2.5 min-w-0">
              <LuMail aria-hidden="true" size={20} className="shrink-0 text-(--brand-ink)" />
              <a
                href={`mailto:${s.email}`}
                className="inline-flex items-center min-h-11 -my-2.5 min-w-0 break-all text-(--brand-ink) [@media(hover:hover)]:hover:underline"
              >
                <span className="sr-only">E-mail: </span>
                {s.email}
              </a>
            </li>
          )}
        </ul>

        {s.description && (
          <p className="text-sm/6 text-(--ink-2) max-w-[70ch] whitespace-pre-line">{s.description}</p>
        )}

        {(hasRoute || s.phone) && (
          <div className="mt-auto pt-2 flex flex-wrap gap-2">
            {hasRoute && (
              <a
                href={routeHref(s)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} bg-(--brand) text-(--on-brand) [@media(hover:hover)]:hover:bg-(--brand-hover)`}
                aria-label={`Маршрут до магазину ${s.name || ""} (відкриється в новій вкладці)`}
              >
                <LuNavigation aria-hidden="true" size={18} />
                Маршрут
              </a>
            )}
            {s.phone && (
              <a
                href={telHref(s.phone)}
                className={`${btn} border border-(--line-strong) text-(--ink) bg-(--surface) [@media(hover:hover)]:hover:bg-(--surface-2)`}
                aria-label={`Подзвонити в магазин ${s.name || ""}: ${s.phone}`}
              >
                <LuPhone aria-hidden="true" size={18} />
                Подзвонити
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default StoreCard;
