import React, { useState } from "react";
import { LuArrowRight, LuX } from "react-icons/lu";
import useBanners from "../hooks/useBanners";
import { BannerLink } from "./PlacementBanner";

// Тонка стрічка оголошення над шапкою (плейсмент announcement, text-банер).
// Не липка — прокручується разом зі сторінкою, тому не впливає на --header-h.
// Закривається ✕; закриті id зберігаються в localStorage `ts-ann-closed`.
const KEY = "ts-ann-closed";
const HEX = /^#[0-9a-f]{6}$/i;

const readClosed = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};

export default function AnnouncementBar() {
  const { banners, loading } = useBanners("announcement");
  const [closed, setClosed] = useState(readClosed);

  if (loading) return null;
  const b = banners.find((x) => x.kind === "text" && !closed.includes(String(x._id)));
  if (!b) return null;

  const close = () => {
    const next = [...new Set([...readClosed(), String(b._id)])].slice(-50);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setClosed(next);
  };

  const style = {};
  if (HEX.test(b.bgColor)) style.backgroundColor = b.bgColor;
  if (HEX.test(b.textColor)) style.color = b.textColor;
  const tokens = style.backgroundColor || style.color ? "" : "bg-(--brand) text-(--on-brand)";

  const text = (
    <>
      {b.headline && <span className="font-semibold">{b.headline}</span>}
      {b.headline && b.subline && " "}
      {b.subline && <span className="opacity-90">{b.subline}</span>}
      {b.href && b.ctaLabel && (
        <span className="ml-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          {b.ctaLabel}
          <LuArrowRight aria-hidden="true" size={16} />
        </span>
      )}
    </>
  );

  return (
    <div role="region" aria-label="Оголошення" style={style} className={`${tokens} text-sm/5`}>
      <div className="container-x flex items-center gap-2 min-h-11">
        <div className="flex-1 min-w-0 py-1.5 text-center">
          <BannerLink
            banner={b}
            className={`inline-block py-1 ${b.href ? "[@media(hover:hover)]:hover:underline" : ""}`}
          >
            {text}
          </BannerLink>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Закрити оголошення"
          className="-mr-2 shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-(--r-md) [@media(hover:hover)]:hover:opacity-80"
        >
          <LuX aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
}
