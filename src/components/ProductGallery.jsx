import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuChevronLeft, LuChevronRight, LuX, LuZoomIn } from "react-icons/lu";

// Індекс слайда за поточною прокруткою scroll-snap треку
const indexFromScroll = (el) =>
  el && el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0;

const scrollToIndex = (el, i, smooth = true) => {
  if (!el) return;
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollTo({
    left: i * el.clientWidth,
    behavior: smooth && !reduce ? "smooth" : "auto",
  });
};

/* ---------- Повноекранний перегляд (lightbox) ---------- */
const Lightbox = ({ images, start, name, onClose }) => {
  const trackRef = useRef(null);
  const closeRef = useRef(null);
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const lastTap = useRef(0);

  // Блокування скролу сторінки, фокус, Esc, повернення фокусу
  useEffect(() => {
    const prevFocus = document.activeElement;
    document.documentElement.classList.add("ts-sheet-open");
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        setZoomed(false);
        scrollToIndex(trackRef.current, Math.min(images.length - 1, indexFromScroll(trackRef.current) + 1));
      }
      if (e.key === "ArrowLeft") {
        setZoomed(false);
        scrollToIndex(trackRef.current, Math.max(0, indexFromScroll(trackRef.current) - 1));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("ts-sheet-open");
      document.removeEventListener("keydown", onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
  }, [onClose, images.length]);

  useEffect(() => {
    scrollToIndex(trackRef.current, start, false);
  }, [start]);

  const toggleZoom = (e) => {
    const box = e.currentTarget;
    const rect = box.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setZoomed((z) => {
      const next = !z;
      if (next) {
        // після рендеру — прокрутка до точки дотику
        requestAnimationFrame(() => {
          box.scrollLeft = px * box.scrollWidth - rect.width / 2;
          box.scrollTop = py * box.scrollHeight - rect.height / 2;
        });
      }
      return next;
    });
  };

  // Подвійний тап (touch) — зум ×2; для миші — dblclick
  const onPointerUp = (e) => {
    if (e.pointerType === "mouse") return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleZoom(e);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Фото товару ${name || ""}`.trim()}
      className="fixed inset-0 z-[70] flex flex-col h-[100dvh] bg-(--ink) text-(--surface) overscroll-contain"
    >
      <div className="flex items-center justify-between gap-2 px-2 pt-[max(8px,var(--sat))]">
        <span className="px-3 text-sm tabular-nums" aria-live="polite">
          {index + 1}/{images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Закрити перегляд"
          className="tap rounded-full hover:bg-(--header-hover)"
        >
          <LuX className="size-6" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={() => setIndex(indexFromScroll(trackRef.current))}
        className={`flex-1 min-h-0 flex no-scrollbar overscroll-contain snap-x snap-mandatory ${
          zoomed ? "overflow-hidden" : "overflow-x-auto"
        }`}
      >
        {images.map((img, i) => (
          <div
            key={i}
            onDoubleClick={toggleZoom}
            onPointerUp={onPointerUp}
            style={{ touchAction: "pinch-zoom pan-x pan-y" }}
            className={`relative w-full h-full flex-none snap-center ${
              zoomed && i === index ? "overflow-auto" : "overflow-hidden flex items-center justify-center"
            }`}
          >
            <img
              src={img}
              alt={`${name || "Товар"} — фото ${i + 1} з ${images.length}`}
              draggable={false}
              loading={Math.abs(i - start) > 1 ? "lazy" : "eager"}
              className={
                zoomed && i === index
                  ? "max-w-none w-[200%] h-auto cursor-zoom-out select-none"
                  : "max-h-full max-w-full object-contain cursor-zoom-in select-none"
              }
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 px-4 pt-2 pb-[max(12px,var(--sab))]">
        <button
          type="button"
          aria-label="Попереднє фото"
          disabled={index === 0}
          onClick={() => {
            setZoomed(false);
            scrollToIndex(trackRef.current, index - 1);
          }}
          className="tap rounded-full hover:bg-(--header-hover) disabled:opacity-40"
        >
          <LuChevronLeft className="size-6" aria-hidden="true" />
        </button>
        <p className="text-xs text-(--on-header-2) text-center">
          Подвійний тап або жест — зум
        </p>
        <button
          type="button"
          aria-label="Наступне фото"
          disabled={index >= images.length - 1}
          onClick={() => {
            setZoomed(false);
            scrollToIndex(trackRef.current, index + 1);
          }}
          className="tap rounded-full hover:bg-(--header-hover) disabled:opacity-40"
        >
          <LuChevronRight className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
};

/* ---------- Галерея товару ---------- */
const ProductGallery = ({ images = [], name = "", discount = 0 }) => {
  const trackRef = useRef(null);
  const thumbsRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(null); // індекс для lightbox або null
  const list = images.length ? images : [];
  const total = list.length;

  // Новий товар — на перше фото
  useEffect(() => {
    setIndex(0);
    scrollToIndex(trackRef.current, 0, false);
  }, [images]);

  // Тримати активну мініатюру у видимій зоні
  useEffect(() => {
    const row = thumbsRef.current;
    const btn = row?.children[index];
    if (row && btn) {
      const left = btn.offsetLeft - row.clientWidth / 2 + btn.clientWidth / 2;
      row.scrollTo({ left, behavior: "auto" });
    }
  }, [index]);

  const go = (i) => {
    const n = Math.max(0, Math.min(total - 1, i));
    scrollToIndex(trackRef.current, n);
    setIndex(n);
  };

  const closeViewer = useCallback(() => setViewer(null), []);

  if (!total) {
    return (
      <div className="aspect-square w-full rounded-(--r-lg) bg-(--surface-2)" aria-hidden="true" />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative rounded-(--r-lg) border border-(--line) bg-(--surface) overflow-hidden"
        role="region"
        aria-roledescription="карусель"
        aria-label="Фото товару"
      >
        <div
          ref={trackRef}
          onScroll={() => setIndex(indexFromScroll(trackRef.current))}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar overscroll-x-contain"
        >
          {list.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setViewer(i)}
              aria-label={`Відкрити фото ${i + 1} з ${total} на весь екран`}
              className="relative w-full flex-none snap-center aspect-square p-4 sm:p-6 cursor-zoom-in"
            >
              <img
                src={img}
                alt={i === 0 ? name : `${name} — фото ${i + 1}`}
                width={800}
                height={800}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                draggable={false}
                className="w-full h-full object-contain select-none"
              />
            </button>
          ))}
        </div>

        {discount > 0 && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-(--sale) text-(--on-sale) px-2.5 py-1 text-xs font-bold tabular-nums">
            −{discount}%
          </span>
        )}

        <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-(--surface) text-(--ink) shadow-(--shadow-1) border border-(--line) px-2.5 py-1 text-xs font-semibold tabular-nums">
          {index + 1}/{total}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 hidden [@media(hover:hover)]:inline-flex size-9 items-center justify-center rounded-full bg-(--surface) text-(--ink-2) border border-(--line)">
          <LuZoomIn className="size-5" aria-hidden="true" />
        </span>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Попереднє фото"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="hidden [@media(hover:hover)]:inline-flex tap absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-(--surface) text-(--ink) border border-(--line) shadow-(--shadow-2) disabled:opacity-0"
            >
              <LuChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Наступне фото"
              onClick={() => go(index + 1)}
              disabled={index >= total - 1}
              className="hidden [@media(hover:hover)]:inline-flex tap absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-(--surface) text-(--ink) border border-(--line) shadow-(--shadow-2) disabled:opacity-0"
            >
              <LuChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain py-0.5 px-0.5"
          aria-label="Мініатюри фото"
        >
          {list.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={`flex-none size-14 rounded-(--r-md) border-2 bg-(--surface) p-1 ${
                i === index ? "border-(--brand)" : "border-(--line) hover:border-(--line-strong)"
              }`}
            >
              <img
                src={img}
                alt=""
                width={56}
                height={56}
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {viewer !== null && (
        <Lightbox images={list} start={viewer} name={name} onClose={closeViewer} />
      )}
    </div>
  );
};

export default ProductGallery;
