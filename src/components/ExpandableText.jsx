import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { prefersReducedMotion } from "./sectionJump";

/**
 * Довгий текст, скорочений за замовчуванням (≈ `lines` рядків) із затуханням
 * і кнопкою «Показати повністю». Якщо текст коротший за поріг — показується
 * повністю, без кнопок. «Згорнути» повертає до початку блоку.
 * Затухання — mask-image (не залежить від кольору фону під текстом).
 * Для нового товару передавайте key={product._id}, щоб знову згорнути.
 */
const LINE_PX = 24; // leading-6

const ExpandableText = ({ children, lines = 9, className = "" }) => {
  const [open, setOpen] = useState(false);
  const [needed, setNeeded] = useState(false);
  const boxRef = useRef(null);
  const topRef = useRef(null);
  const panelId = useId();
  const maxPx = lines * LINE_PX;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setNeeded(el.scrollHeight > maxPx + LINE_PX * 2); // запас ~2 рядки
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxPx]);

  const collapse = () => {
    setOpen(false);
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) {
      top.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  };

  const clipped = needed && !open;

  return (
    <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+var(--secnav-h,56px)+16px)]">
      <div
        id={panelId}
        ref={boxRef}
        className={`text-base leading-6 ${className} ${clipped ? "overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" : ""}`}
        style={clipped ? { maxHeight: `${maxPx}px` } : undefined}
      >
        {children}
      </div>
      {needed && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={open ? collapse : () => setOpen(true)}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-(--r-md) px-1 -mx-1 text-[0.9375rem] font-semibold text-(--brand-ink) hover:underline"
        >
          {open ? "Згорнути" : "Показати повністю"}
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

export default ExpandableText;
