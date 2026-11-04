import React from "react";
import { LuShoppingCart, LuBell } from "react-icons/lu";

/**
 * Липка панель дії на мобільних (< lg): «ціна + У кошик».
 * Показується, коли основна кнопка пішла за екран (керує батьківський
 * IntersectionObserver), 64px + safe-area, bottom: 0.
 */
const StickyBuyBar = ({
  visible,
  name,
  price,
  oldPrice,
  label,
  onAction,
  variant = "cart", // "cart" | "notify"
}) => {
  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-(--surface) border-t border-(--line) shadow-(--shadow-3) motion-safe:transition-transform motion-safe:duration-200 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(12px, var(--sab))" }}
    >
      {/* 4px + 48px + max(12px, safe-area) = 64px + safe-area */}
      <div className="container-x flex items-center gap-3 pt-1 min-h-12">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-(--ink-2) truncate">{name}</p>
          <p className="flex items-baseline gap-2">
            <span className="price text-lg font-bold text-(--price) leading-6">
              ₴{price}
            </span>
            {oldPrice ? (
              <s className="price text-sm text-(--ink-2)">
                <span className="sr-only">Стара ціна </span>₴{oldPrice}
              </s>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className={`min-h-12 px-5 inline-flex items-center justify-center gap-2 rounded-(--r-md) text-base font-semibold shrink-0 ${
            variant === "cart"
              ? "bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta)"
              : "bg-(--brand) hover:bg-(--brand-hover) text-(--on-brand)"
          }`}
        >
          {variant === "cart" ? (
            <LuShoppingCart className="size-5" aria-hidden="true" />
          ) : (
            <LuBell className="size-5" aria-hidden="true" />
          )}
          {label}
        </button>
      </div>
    </div>
  );
};

export default StickyBuyBar;
