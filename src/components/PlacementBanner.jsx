import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import useBanners from "../hooks/useBanners";
import { cld, cldSrcSet } from "../utils/cloudinary";
import { observeBannerView, trackClick } from "../utils/bannerTracking";

// Універсальний банер плейсменту (контракт — BANNERS_SPEC.md).
// image → <picture> (мобільне зображення через <source>), розміри з метаданих (без CLS);
// text  → кольорова смуга із заголовком/підзаголовком/CTA.
// Увесь блок клікабельний, якщо є href. Трекінг: view раз за сесію (≥50% у вікні), click.

// Пропорції за замовчуванням (якщо в метаданих немає width/height)
const RATIOS = {
  home_hero: { d: "3/1", m: "2/1" },
  home_mid: { d: "4/1", m: "2/1" },
  catalog_top: { d: "5/1", m: "5/2" },
  product_promo: { d: "2/1", m: "2/1" },
  cart_promo: { d: "5/1", m: "5/2" },
};
const WIDTHS = [480, 800, 1200, 1600];

const ratioOf = (im, fallback) => (im?.width && im?.height ? `${im.width}/${im.height}` : fallback);

const deviceClass = (device) =>
  device === "desktop" ? "hidden md:block" : device === "mobile" ? "md:hidden" : "";

/** Зображення банера: <picture> з окремим мобільним джерелом (до 767px). */
export function BannerPicture({ banner, eager = false, sizes = "100vw", className = "" }) {
  const d = banner.imageDesktop || banner.imageMobile;
  const m = banner.imageDesktop ? banner.imageMobile : null;
  if (!d) return null;
  const dSet = cldSrcSet(d.url, WIDTHS);
  const mSet = m ? cldSrcSet(m.url, [480, 800, 1200]) : "";
  return (
    <picture>
      {m && (
        <source
          media="(max-width: 767px)"
          srcSet={mSet || m.url}
          sizes={mSet ? "100vw" : undefined}
          width={m.width || undefined}
          height={m.height || undefined}
        />
      )}
      <img
        src={cld(d.url, 1200)}
        srcSet={dSet || undefined}
        sizes={dSet ? sizes : undefined}
        alt={banner.alt || ""}
        width={d.width || 1600}
        height={d.height || 533}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding={eager ? "sync" : "async"}
        draggable="false"
        className={`block w-full h-full object-cover object-center ${className}`}
      />
    </picture>
  );
}

/** Обгортка-посилання банера (або div без href) з трекінгом view/click. */
export function BannerLink({ banner, className = "", style, children, ...rest }) {
  const ref = useRef(null);
  const id = banner._id;
  useEffect(() => observeBannerView(ref.current, id), [id]);

  const onClick = () => trackClick(id);
  const href = banner.href;
  if (!href) {
    return (
      <div ref={ref} className={className} style={style} {...rest}>
        {children}
      </div>
    );
  }
  const internal = !banner.external && href.startsWith("/") && !href.startsWith("//");
  const blank = banner.newTab === true;
  const tabProps =
    blank || banner.external
      ? { ...(blank ? { target: "_blank" } : {}), rel: "noopener noreferrer" }
      : {};
  if (internal && !blank) {
    return (
      <Link ref={ref} to={href} onClick={onClick} className={className} style={style} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      className={className}
      style={style}
      {...tabProps}
      {...rest}
    >
      {children}
      {blank && <span className="sr-only"> (відкриється в новій вкладці)</span>}
    </a>
  );
}

/** Текстовий банер-смуга (кольори з адмінки, запасні — токени). */
export function TextBanner({ banner, className = "", compact = false }) {
  const style = {};
  if (/^#[0-9a-f]{6}$/i.test(banner.bgColor)) style.backgroundColor = banner.bgColor;
  if (/^#[0-9a-f]{6}$/i.test(banner.textColor)) style.color = banner.textColor;
  const hasColors = style.backgroundColor || style.color;
  return (
    <BannerLink
      banner={banner}
      style={style}
      className={`block rounded-(--r-lg) ${hasColors ? "" : "bg-(--brand-soft) text-(--ink)"} ${
        banner.href ? "[@media(hover:hover)]:hover:opacity-95" : ""
      } ${className}`}
    >
      <span
        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${
          compact ? "px-4 py-3" : "px-4 py-4 md:px-6 md:py-5"
        }`}
      >
        <span className="flex-1 min-w-0">
          {banner.headline && (
            <span className="block text-base/6 md:text-lg/7 font-semibold">{banner.headline}</span>
          )}
          {banner.subline && <span className="block text-sm/5 md:text-[0.9375rem]/6 opacity-90">{banner.subline}</span>}
        </span>
        {banner.href && banner.ctaLabel && (
          <span className="inline-flex shrink-0 items-center justify-center gap-2 self-start sm:self-auto min-h-11 px-4 rounded-(--r-md) border border-current font-semibold text-[0.9375rem]">
            {banner.ctaLabel}
            <LuArrowRight aria-hidden="true" size={18} />
          </span>
        )}
      </span>
    </BannerLink>
  );
}

/** Один банер (image або text) з урахуванням пристрою. */
export function BannerItem({ banner, placement, eager = false, sizes = "100vw", className = "" }) {
  const dev = deviceClass(banner.device);
  if (banner.kind === "text") {
    return <TextBanner banner={banner} className={`${dev} ${className}`} />;
  }
  const r = RATIOS[placement] || RATIOS.home_mid;
  const dImg = banner.imageDesktop || banner.imageMobile;
  const mImg = banner.imageMobile || banner.imageDesktop;
  const style = { "--ar-d": ratioOf(dImg, r.d), "--ar-m": ratioOf(mImg, r.m) };
  return (
    <BannerLink
      banner={banner}
      style={style}
      className={`${dev} relative overflow-hidden rounded-(--r-lg) bg-(--surface-2) aspect-(--ar-m) md:aspect-(--ar-d) focus-visible:outline-offset-2 ${className}`}
    >
      <BannerPicture banner={banner} eager={eager} sizes={sizes} />
    </BannerLink>
  );
}

/**
 * Банер(и) плейсменту. Нічого не рендерить, поки завантажується або банерів немає.
 * home_mid: до 2 — на md+ у 2 колонки; решта плейсментів — один банер.
 */
export default function PlacementBanner({ placement, category = "", className = "", label = "Пропозиція" }) {
  const { banners, loading } = useBanners(placement, { category });
  if (loading || !banners.length) return null;

  const list = placement === "home_mid" ? banners.slice(0, 2) : banners.slice(0, 1);
  const two = list.length === 2;
  const sizes =
    placement === "product_promo"
      ? "(min-width: 1080px) 560px, 100vw"
      : two
        ? "(min-width: 768px) 50vw, 100vw"
        : "(min-width: 1760px) 1696px, 100vw";

  return (
    <aside aria-label={label} className={className}>
      <div className={two ? "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4" : ""}>
        {list.map((b, i) => (
          <BannerItem key={b._id || i} banner={b} placement={placement} sizes={sizes} />
        ))}
      </div>
    </aside>
  );
}
