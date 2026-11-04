import React, { useEffect, useId, useRef, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { SECTION_EVENT, prefersReducedMotion } from "./sectionJump";

/**
 * Характеристики: перші `limit` рядків + «Усі характеристики (N)».
 * Якщо рядків не більше ніж limit + 2 — показуємо все без кнопки
 * (ховати 1–2 рядки за кнопкою безглуздо).
 * Мобільні: <dl>; від md — 2-колонкова таблиця.
 * Посилання «Усі характеристики» з верхнього блоку розкриває список (подія SECTION_EVENT).
 */
const SpecsTable = ({ specs, limit = 8, sectionId = "specs" }) => {
  const [open, setOpen] = useState(false);
  const topRef = useRef(null);
  const listId = useId();
  const canCollapse = specs.length > limit + 2;
  const shown = canCollapse && !open ? specs.slice(0, limit) : specs;

  useEffect(() => {
    const onOpen = (e) => {
      if (e.detail?.id === sectionId && e.detail?.expand) setOpen(true);
    };
    window.addEventListener(SECTION_EVENT, onOpen);
    return () => window.removeEventListener(SECTION_EVENT, onOpen);
  }, [sectionId]);

  const collapse = () => {
    setOpen(false);
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) {
      top.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+var(--secnav-h,56px)+16px)]">
      <div id={listId}>
        {/* мобільні: список визначень */}
        <dl className="md:hidden flex flex-col divide-y divide-(--line)">
          {shown.map((spec, i) => (
            <div key={i} className="py-2.5 flex flex-col gap-0.5">
              <dt className="text-sm text-(--ink-2) break-words">{spec.key}</dt>
              <dd className="text-(--ink) break-words">{spec.value}</dd>
            </div>
          ))}
        </dl>
        {/* від md: 2-колонкова таблиця */}
        <table className="hidden md:table w-full text-(--ink)">
          <caption className="sr-only">Характеристики товару</caption>
          <tbody>
            {shown.map((spec, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-(--surface-2)" : ""}>
                <th
                  scope="row"
                  className="py-2.5 px-4 text-left font-medium text-(--ink-2) w-[40%] align-top break-words"
                >
                  {spec.key}
                </th>
                <td className="py-2.5 px-4 align-top break-words">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canCollapse && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={open ? collapse : () => setOpen(true)}
          className="mt-3 w-full sm:w-auto min-h-12 px-5 inline-flex items-center justify-center gap-2 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) font-semibold hover:bg-(--surface-2)"
        >
          {open ? "Згорнути характеристики" : `Усі характеристики (${specs.length})`}
          {open ? (
            <LuChevronUp className="size-5" aria-hidden="true" />
          ) : (
            <LuChevronDown className="size-5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};

export default SpecsTable;
