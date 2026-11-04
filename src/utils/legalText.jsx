import React, { useRef } from "react";
import { LuChevronDown, LuPrinter } from "react-icons/lu";

// Безпечний показ тексту оферти (без HTML): ## / ### заголовки, «- » списки, **жирний**, абзаци через порожній рядок.
const inline = (text, keyPrefix) =>
  String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
      )
    );

const toBlocks = (text) =>
  String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

// Рівень заголовка блоку: «# »/«## » → 2 (H1 сторінки вже є — назва документа), «### » → 3
const headingOf = (b) => {
  if (b.startsWith("### ")) return { level: 3, text: b.slice(4) };
  if (b.startsWith("## ")) return { level: 2, text: b.slice(3) };
  if (b.startsWith("# ")) return { level: 2, text: b.slice(2) };
  return null;
};

const stripMd = (s) => String(s).replace(/\*\*/g, "");

// Заголовки для змісту: [{ id, level, text }] — ті самі id, що й у LegalText
const tocItems = (text, idPrefix) => {
  const out = [];
  toBlocks(text).forEach((b, i) => {
    const h = headingOf(b);
    if (h) out.push({ id: `${idPrefix}-${i}`, level: h.level, text: stripMd(h.text) });
  });
  return out;
};

// Типографіка юридичного тексту: 16px, line-height 1.65, ширина рядка ≤70ch
const legalProse = "max-w-[70ch] text-base leading-[1.65] text-(--ink)";
const h2Cls = "mt-6 text-lg leading-6 font-bold text-(--ink) md:text-[1.375rem] md:leading-[1.875rem] scroll-mt-[calc(var(--header-h)+16px)] break-after-avoid";
const h3Cls = "mt-3 text-[1.0625rem] leading-6 font-semibold text-(--ink) scroll-mt-[calc(var(--header-h)+16px)] break-after-avoid";

export function LegalText({ text, idPrefix = "sec" }) {
  const blocks = toBlocks(text);
  return (
    <div className={`flex flex-col gap-4 ${legalProse}`}>
      {blocks.map((b, i) => {
        const h = headingOf(b);
        if (h?.level === 3)
          return (
            <h3 key={i} id={`${idPrefix}-${i}`} className={h3Cls}>
              {inline(h.text, i)}
            </h3>
          );
        if (h?.level === 2)
          return (
            <h2 key={i} id={`${idPrefix}-${i}`} className={h2Cls}>
              {inline(h.text, i)}
            </h2>
          );
        if (b.split("\n").every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-6 marker:text-(--ink-2)">
              {b.split("\n").map((l, j) => (
                <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line break-words">
            {inline(b, i)}
          </p>
        );
      })}
    </div>
  );
}

// Заголовок розділу поза LegalText (наприклад, фіксовані блоки на сторінці «Обмін та повернення»)
export const LegalH2 = ({ id, children }) => (
  <h2 id={id} className={h2Cls.replace("mt-6 ", "")}>
    {children}
  </h2>
);

// Зміст-якорі: на мобільних — згорнутий акордеон «Зміст», від lg — липка бічна навігація.
// text — документ у форматі LegalText; before/after — додаткові пункти [{ id, text }].
export function LegalToc({ text, idPrefix = "sec", before = [], after = [] }) {
  const det = useRef(null);
  const items = [
    ...before.map((x) => ({ level: 2, ...x })),
    ...tocItems(text, idPrefix),
    ...after.map((x) => ({ level: 2, ...x })),
  ];
  if (items.length < 2) return null;

  const list = (onPick) => (
    <ol className="flex flex-col">
      {items.map((it) => (
        <li key={it.id}>
          <a
            href={`#${it.id}`}
            onClick={onPick}
            className={`flex min-h-11 items-center rounded-(--r-sm) py-1.5 pr-2 text-sm leading-5 text-(--ink-2) hover:bg-(--surface-2) hover:text-(--brand-ink) lg:min-h-9 ${
              it.level === 3 ? "pl-6" : "pl-2 font-medium"
            }`}
          >
            {it.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <aside className="print:hidden lg:h-full">
      <details ref={det} className="group mb-6 rounded-(--r-md) border border-(--line) bg-(--surface) lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-base font-semibold text-(--ink) [&::-webkit-details-marker]:hidden">
          Зміст
          <LuChevronDown aria-hidden="true" className="size-5 text-(--ink-2) group-open:rotate-180 motion-safe:transition-transform" />
        </summary>
        <nav aria-label="Зміст документа" className="border-t border-(--line) px-2 py-2">
          {list(() => det.current && (det.current.open = false))}
        </nav>
      </details>
      <nav
        aria-label="Зміст документа"
        className="sticky top-[calc(var(--header-h)+16px)] hidden max-h-[calc(100dvh-var(--header-h)-32px)] overflow-y-auto overscroll-contain lg:block"
      >
        <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-(--ink-2) uppercase">Зміст</p>
        {list()}
      </nav>
    </aside>
  );
}

// Кнопка «Друкувати» (ховається при друці)
export const PrintButton = () => (
  <button
    type="button"
    onClick={() => window.print()}
    className="inline-flex min-h-11 items-center gap-2 rounded-(--r-md) border border-(--line) bg-(--surface) px-3 text-sm font-medium text-(--ink) hover:bg-(--surface-2) print:hidden"
  >
    <LuPrinter aria-hidden="true" className="size-5" />
    Друкувати
  </button>
);

// Каркас сторінки документа: H1, мета (редакція/дата), зміст і текст; Header/Footer ховаються при друці
export const LegalLayout = ({ header, footer, title, meta, toc, children }) => (
  <div className="flex min-h-dvh flex-col bg-(--page) print:bg-(--surface)">
    <div className="contents print:hidden">{header}</div>
    <main id="main" className="flex-1">
      <div className="container-x py-6 md:py-10 print:py-0">
        <div className={toc ? "lg:has-[aside]:grid lg:has-[aside]:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:has-[aside]:grid-cols-[280px_minmax(0,1fr)]" : ""}>
          {toc && <div className="lg:order-1">{toc}</div>}
          <article className="min-w-0 lg:order-2">
            <div className="mb-6 flex flex-col gap-3 border-b border-(--line) pb-5">
              <h1 className="max-w-[70ch] text-[1.375rem] leading-7 font-bold text-(--ink) md:text-[1.75rem] md:leading-9">{title}</h1>
              {meta && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-(--r-sm) bg-(--brand-soft) px-3 py-1.5 text-sm font-medium text-(--brand-ink) print:bg-transparent print:px-0">
                    {meta}
                  </p>
                  <PrintButton />
                </div>
              )}
            </div>
            {children}
          </article>
        </div>
      </div>
    </main>
    <div className="contents print:hidden">{footer}</div>
  </div>
);
