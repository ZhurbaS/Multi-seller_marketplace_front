import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from "react-icons/lu";
import AllNav from "./products/allNav";
import useAutoScroll from "../hooks/useAutoScroll";

// Карусель категорій: автопрокрутка по колу (з паузою), стрілки на ПК,
// свайп на дотикових. Назва під фото — контраст гарантований.
const Categories = () => {
  const { categories } = useSelector((state) => state.home);
  const trackRef = useRef(null);

  const step = (dir = 1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild;
    const w = first ? first.getBoundingClientRect().width + 12 : el.clientWidth / 2;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * w * 2, behavior: "smooth" });
  };

  // Чи стрічка реально не вміщається (інакше стрілки/автопрокрутка зайві)
  const [overflow, setOverflow] = useState(false);
  const few = categories.length <= 4; // 1–4 категорії: великі центровані плитки
  useEffect(() => {
    const el = trackRef.current;
    if (!el || few) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 4);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [few, categories.length]);
  const scrolling = !few && overflow;

  const { paused, toggle, canPlay } = useAutoScroll(trackRef, () => step(1), {
    interval: 4000,
    enabled: scrolling,
  });

  if (!categories.length) return null;

  const arrow =
    "hidden [@media(hover:hover)]:grid absolute top-1/2 -translate-y-1/2 w-11 h-11 place-items-center rounded-full bg-(--surface) text-(--ink) text-xl shadow-(--shadow-2) hover:bg-(--surface-2) z-10";

  return (
    <section aria-labelledby="home-categories">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <AllNav title="Категорії товарів" to="/shops" id="home-categories" />
        </div>
        {canPlay && scrolling && (
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 w-11 h-11 grid place-items-center rounded-full text-(--ink-2) hover:text-(--ink)"
            aria-label={paused ? "Запустити автопрокрутку категорій" : "Зупинити автопрокрутку категорій"}
            aria-pressed={paused}
          >
            {paused ? <LuPlay aria-hidden="true" size={18} /> : <LuPause aria-hidden="true" size={18} />}
          </button>
        )}
      </div>
      <div className="relative">
        <ul
          ref={trackRef}
          className={
            few
              ? "flex flex-wrap justify-center gap-3 md:gap-4"
              : `flex gap-3 overflow-x-auto snap-x snap-proximity overscroll-x-contain no-scrollbar -mx-4 px-4 scroll-px-4 pb-1 md:mx-0 md:px-0 ${overflow ? "" : "justify-center"}`
          }
        >
          {categories.map((c, i) => (
            <li
              key={c._id || i}
              className={
                few
                  ? "w-[calc(50%-6px)] sm:w-44 md:w-52 lg:w-56"
                  : "shrink-0 snap-start w-[38%] xs:w-[30%] sm:w-[22%] md:w-[18%] lg:w-[14%] xl:w-[12.5%] 2xl:w-[10.5%]"
              }
            >
              <Link
                to={`/products?category=${encodeURIComponent(c.name)}`}
                className="group flex flex-col items-center gap-2 h-full p-1.5 rounded-(--r-md) text-center"
              >
                <span className="block w-full aspect-square rounded-(--r-md) bg-(--surface) border border-(--line) overflow-hidden motion-safe:transition-shadow [@media(hover:hover)]:group-hover:shadow-(--shadow-2)">
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width="160"
                    height="160"
                    className="w-full h-full object-contain p-2"
                  />
                </span>
                <span className="text-sm/5 font-medium text-(--ink) line-clamp-2 break-words [@media(hover:hover)]:group-hover:text-(--brand-ink)">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {scrolling && (
          <>
            <button type="button" className={`${arrow} -left-3`} onClick={() => step(-1)} aria-label="Попередні категорії">
              <LuChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className={`${arrow} -right-3`} onClick={() => step(1)} aria-label="Наступні категорії">
              <LuChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default Categories;
