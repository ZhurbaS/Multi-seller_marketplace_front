import React, { useEffect, useRef, useState } from "react";
import { jumpToSection } from "./sectionJump";

/**
 * Липка навігація по розділах товару (anchor-tabs + scroll-spy).
 * Мобільні: горизонтальний рядок чіпсів; від lg — вкладки з підкресленням.
 * Липка під шапкою (top = --header-h). Активний розділ — через IntersectionObserver.
 * sections: [{ id, label, meta? }] — meta: короткий текст поруч (кількість тощо).
 */
const ProductTabs = ({ sections }) => {
  const [active, setActive] = useState(sections[0]?.id);
  const listRef = useRef(null);
  const navRef = useRef(null);
  const ids = sections.map((s) => s.id).join(",");
  // Accordion перемальовує <section> при перетині md — перепідписуємо спостерігач
  const [layoutKey, setLayoutKey] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 768px)");
    if (!mq) return;
    const onChange = () => setTimeout(() => setLayoutKey((k) => k + 1), 0);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scroll-spy: «активна» та секція, що перетинає смугу під шапкою+навігацією
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const list = ids.split(",").filter(Boolean);
    const els = list.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const headerH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
    const navH = navRef.current?.offsetHeight || 56;
    const seen = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const first = list.find((id) => seen.get(id));
        if (first) setActive(first);
      },
      { rootMargin: `-${Math.round(headerH + navH + 8)}px 0px -55% 0px`, threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, layoutKey]);

  // Тримаємо активний чіпс у полі зору (горизонтально, без прокрутки сторінки)
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector(`[data-id="${active}"]`);
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    const left = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left) });
  }, [active]);

  const onClick = (e, id) => {
    e.preventDefault();
    setActive(id);
    jumpToSection(id);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Розділи товару"
      className="sticky top-(--header-h) z-30 -mx-4 px-4 lg:mx-0 lg:px-0 bg-(--page)/95 backdrop-blur border-b border-(--line) motion-safe:transition-[top] motion-safe:duration-200"
    >
      <ul
        ref={listRef}
        className="flex gap-2 overflow-x-auto no-scrollbar py-2 lg:py-0 lg:gap-6"
      >
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                data-id={s.id}
                onClick={(e) => onClick(e, s.id)}
                aria-current={on ? "true" : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[0.9375rem] font-semibold
                  rounded-full border px-4
                  lg:rounded-none lg:border-0 lg:border-b-[3px] lg:px-0 lg:min-h-14
                  ${
                    on
                      ? "border-(--brand) bg-(--brand-soft) text-(--brand-ink) lg:bg-transparent"
                      : "border-(--line) bg-(--surface) text-(--ink) lg:bg-transparent lg:border-transparent lg:text-(--ink-2) hover:text-(--brand-ink)"
                  }`}
              >
                {s.label}
                {s.meta != null && (
                  <span className={`text-sm font-medium tabular-nums ${on ? "" : "text-(--ink-2)"}`}>
                    {s.meta}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ProductTabs;
