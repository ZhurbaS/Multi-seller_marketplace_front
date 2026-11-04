import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from "react-icons/lu";
import useAutoScroll from "../hooks/useAutoScroll";
import useBanners from "../hooks/useBanners";
import { BannerLink, BannerPicture } from "./PlacementBanner";
import { get_banners } from "../store/reducers/homeSlice";

// Старі seller-банери (GET /banners) → форма PublicBanner (запасний варіант,
// якщо новий ендпойнт /home/banners/home_hero недоступний).
const fromLegacy = (b) => ({
  _id: "",
  kind: "image",
  imageDesktop: b?.banner ? { url: b.banner, width: 1600, height: 534 } : null,
  imageMobile: null,
  alt: "",
  headline: b?.title || b?.name || "",
  href: b?.link ? `/product/details/${b.link}` : null,
  external: false,
  newTab: false,
  device: "all",
});

// Hero-карусель на нативному scroll-snap: свайп на touch, автопрокрутка з паузою
// (useAutoScroll), зображення заповнює слайд (cover, 2:1 → 3:1 від md),
// стрілки лише на пристроях з наведенням, точки 8px з тап-зоною 24×44.
// Дані — плейсмент home_hero (useBanners); autoplay/інтервал — з settings адмінки.
const Banner = () => {
  const dispatch = useDispatch();
  const hero = useBanners("home_hero");
  const legacy = useSelector((state) => state.home.banners);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // Сумісність: новий ендпойнт не відповів → старі банери з redux
  useEffect(() => {
    if (hero.error) dispatch(get_banners());
  }, [dispatch, hero.error]);

  const banners = useMemo(() => {
    const list = hero.error ? (legacy || []).map(fromLegacy) : hero.banners;
    return list.filter((b) => b.kind === "image" && (b.imageDesktop || b.imageMobile)).slice(0, 6);
  }, [hero.error, hero.banners, legacy]);
  const autoplay = hero.settings.autoplay !== false;
  const interval = Math.round((hero.settings.intervalSec || 6) * 1000);

  // Активний слайд — за позицією прокрутки
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth || 1;
        setActive(Math.round(el.scrollLeft / w));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [banners.length]);

  const { paused, toggle, canPlay } = useAutoScroll(
    trackRef,
    () => {
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      const n = banners.length || 1;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % n;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    { interval, enabled: autoplay && banners.length > 1 },
  );

  // Під час завантаження резервуємо місце (без стрибка макета)
  if (hero.loading) {
    return (
      <div className="container-x pt-3 md:pt-6" aria-hidden="true">
        <div className="aspect-[2/1] md:aspect-[3/1] rounded-(--r-lg) bg-(--surface-2)" />
      </div>
    );
  }
  if (!banners.length) return null;

  const total = banners.length;
  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const next = (i + total) % total;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "hidden [@media(hover:hover)]:grid absolute top-1/2 -translate-y-1/2 w-11 h-11 place-items-center rounded-full bg-(--surface) text-(--ink) text-xl shadow-(--shadow-2) motion-safe:transition-colors hover:bg-(--surface-2)";

  return (
    <section
      className="container-x pt-3 md:pt-6"
      aria-roledescription="карусель"
      aria-label="Акції та пропозиції"
    >
      <div className="relative">
        <div
          ref={trackRef}
          id="ts-banner-track"
          className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain no-scrollbar rounded-(--r-lg) bg-(--surface-2)"
          aria-live={!autoplay || paused || !canPlay ? "polite" : "off"}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goTo(active + 1);
            if (e.key === "ArrowLeft") goTo(active - 1);
          }}
        >
          {banners.map((b, i) => (
            <BannerLink
              key={b._id || i}
              banner={b}
              className="relative block w-full shrink-0 snap-start aspect-[2/1] md:aspect-[3/1] focus-visible:-outline-offset-2"
              role="group"
              aria-roledescription="слайд"
              aria-label={`Банер ${i + 1} з ${total}${b.alt || b.headline ? `: ${b.alt || b.headline}` : ""}`}
              aria-hidden={i === active ? undefined : "true"}
              tabIndex={i === active ? 0 : -1}
            >
              <BannerPicture banner={b} eager={i === 0} sizes="(min-width: 1760px) 1696px, 100vw" />
            </BannerLink>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              className={`${arrow} left-3`}
              aria-controls="ts-banner-track"
              onClick={() => goTo(active - 1)}
              aria-label="Попередній банер"
            >
              <LuChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${arrow} right-3`}
              aria-controls="ts-banner-track"
              onClick={() => goTo(active + 1)}
              aria-label="Наступний банер"
            >
              <LuChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex justify-center items-center mt-1 gap-1" role="group" aria-label="Керування банерами">
          {autoplay && canPlay && (
            <button
              type="button"
              onClick={toggle}
              className="w-11 h-11 grid place-items-center rounded-full text-(--ink-2) hover:text-(--ink)"
              aria-label={paused ? "Запустити автопрокрутку банерів" : "Зупинити автопрокрутку банерів"}
              aria-pressed={paused}
            >
              {paused ? <LuPlay aria-hidden="true" size={18} /> : <LuPause aria-hidden="true" size={18} />}
            </button>
          )}
          {banners.map((b, i) => (
            <button
              key={b._id || i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Показати банер ${i + 1} з ${total}`}
              aria-controls="ts-banner-track"
              aria-current={i === active ? "true" : undefined}
              className="group w-6 h-11 grid place-items-center"
            >
              <span
                className={`block h-2 rounded-full motion-safe:transition-all ${
                  i === active ? "w-5 bg-(--brand)" : "w-2 bg-(--line-strong)"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Banner;
