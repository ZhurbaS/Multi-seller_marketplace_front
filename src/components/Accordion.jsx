import React, { useEffect, useId, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { SECTION_EVENT } from "./sectionJump";

const MD_QUERY = "(min-width: 768px)";

const getMatch = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(MD_QUERY).matches
    : false;

/**
 * Секція сторінки: на мобільних — акордеон (кнопка з aria-expanded),
 * від md — звичайний блок із заголовком (вміст завжди видно).
 * Вміст завжди змонтований (лише приховується), щоб дочірні компоненти
 * (напр. відгуки) могли завантажувати дані одразу.
 * `badge` — короткий підсумок у заголовку, видно й у згорнутому стані
 * (напр. «★ 4,5 · 12»). Секція розкривається за якорем (#id) і за подією
 * SECTION_EVENT (липка навігація, рядок рейтингу біля назви).
 */
const SCROLL_MT = "scroll-mt-[calc(var(--header-h)+var(--secnav-h,56px)+8px)]";

const Accordion = ({ id, title, badge, defaultOpen = false, children }) => {
  const [isDesktop, setIsDesktop] = useState(getMatch);
  const [open, setOpen] = useState(defaultOpen);
  const autoId = useId();
  const panelId = `${id || autoId}-panel`;
  const headId = `${id || autoId}-head`;

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(MD_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Перехід за якорем (#reviews тощо) — розкриваємо секцію
  useEffect(() => {
    if (!id) return;
    const check = () => {
      if (window.location.hash === `#${id}`) setOpen(true);
    };
    check();
    const onJump = (e) => {
      if (e.detail?.id === id) setOpen(true);
    };
    window.addEventListener("hashchange", check);
    window.addEventListener(SECTION_EVENT, onJump);
    return () => {
      window.removeEventListener("hashchange", check);
      window.removeEventListener(SECTION_EVENT, onJump);
    };
  }, [id]);

  if (isDesktop) {
    return (
      <section
        id={id}
        aria-labelledby={headId}
        className={`border-t border-(--line) pt-6 first:border-t-0 first:pt-0 ${SCROLL_MT}`}
      >
        <h2
          id={headId}
          className="text-[1.375rem] leading-[1.875rem] font-bold text-(--ink) mb-4"
        >
          {title}
          {badge != null && (
            <span className="ml-2 text-base font-medium text-(--ink-2)">
              {badge}
            </span>
          )}
        </h2>
        <div id={panelId}>{children}</div>
      </section>
    );
  }

  return (
    <section id={id} className={`border-b border-(--line) ${SCROLL_MT}`}>
      <h2 className="m-0">
        <button
          type="button"
          id={headId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="w-full min-h-14 flex items-center justify-between gap-3 py-3 text-left text-lg leading-6 font-semibold text-(--ink)"
        >
          <span className="min-w-0">
            {title}
            {badge != null && (
              <span className="ml-2 text-base font-medium text-(--ink-2) whitespace-nowrap">
                {badge}
              </span>
            )}
          </span>
          <LuChevronDown
            aria-hidden="true"
            className={`size-6 shrink-0 text-(--ink-2) motion-safe:transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headId}
        hidden={!open}
        className="pb-5"
      >
        {children}
      </div>
    </section>
  );
};

export default Accordion;
