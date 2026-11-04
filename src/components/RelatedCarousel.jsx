import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from "react-icons/lu";
import Rating from "./Rating";
import useAutoScroll from "../hooks/useAutoScroll";

/**
 * «Вам також може сподобатись» на сторінці товару.
 * Відповідальна автопрокрутка (WCAG 2.2.2): кожні 5 с наступний слайд, по колу
 * (у кінці — перемотування на початок); пауза при наведенні/фокусі/дотику,
 * кнопка ⏸/▶, вимкнено при prefers-reduced-motion (усе — у useAutoScroll).
 * Стрілки — власні кнопки 44×44 (aria-label, токени кольору), центровані по
 * вертикалі без margin-top Swiper; на сенсорних екранах приховані (свайп).
 */
const RelatedCarousel = ({ products = [], title = "Вам також може сподобатись" }) => {
  const wrapRef = useRef(null);
  const bulletsRef = useRef(null);
  const [swiper, setSwiper] = useState(null);

  const next = () => {
    if (!swiper) return;
    if (swiper.isEnd) swiper.slideTo(0);
    else swiper.slideNext();
  };
  const prev = () => {
    if (!swiper) return;
    if (swiper.isBeginning) swiper.slideTo(swiper.slides.length - 1);
    else swiper.slidePrev();
  };

  const { paused, toggle, canPlay } = useAutoScroll(wrapRef, next, {
    interval: 5000,
    enabled: products.length > 1,
  });

  if (!products.length) return null;

  const arrow =
    "hidden [@media(hover:hover)]:grid absolute top-1/2 -translate-y-1/2 z-10 size-11 place-items-center rounded-full border border-(--line) bg-(--surface) text-(--brand) shadow-(--shadow-2) hover:bg-(--brand-soft)";

  return (
    <section
      aria-labelledby="related-title"
      aria-roledescription="карусель"
      className="mt-10 lg:mt-14"
      style={{
        "--swiper-navigation-color": "var(--brand)",
        "--swiper-pagination-color": "var(--brand)",
        "--swiper-pagination-bullet-inactive-color": "var(--line-strong)",
        "--swiper-pagination-bullet-inactive-opacity": "1",
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="related-title"
          className="text-lg leading-6 md:text-[1.375rem] md:leading-[1.875rem] font-bold text-(--ink)"
        >
          {title}
        </h2>
        {canPlay && products.length > 1 && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={paused}
            aria-label={paused ? "Відновити автопрокрутку рекомендацій" : "Зупинити автопрокрутку рекомендацій"}
            className="shrink-0 size-11 grid place-items-center rounded-full border border-(--line) bg-(--surface) text-(--ink-2) hover:text-(--ink) hover:bg-(--surface-2)"
          >
            {paused ? <LuPlay className="size-5" aria-hidden="true" /> : <LuPause className="size-5" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div ref={wrapRef} className="relative">
        <Swiper
          onSwiper={setSwiper}
          onBeforeInit={(s) => {
            if (typeof s.params.pagination === "object") s.params.pagination.el = bulletsRef.current;
          }}
          slidesPerView={1.3}
          spaceBetween={12}
          pagination={{ clickable: false }}
          breakpoints={{
            565: { slidesPerView: 2, spaceBetween: 16 },
            1280: { slidesPerView: 3, spaceBetween: 24 },
          }}
          modules={[Pagination]}
        >
          {products.map((p, i) => (
            <SwiperSlide key={p._id || i} className="!h-auto">
              <Link
                to={`/product/details/${p.slug}`}
                className="flex flex-col h-full rounded-(--r-lg) border border-(--line) bg-(--surface) overflow-hidden hover:shadow-(--shadow-2)"
              >
                <div className="relative aspect-square bg-(--surface-2)">
                  <img
                    className="w-full h-full object-contain"
                    src={p.images?.[0]}
                    alt={p.name}
                    width={400}
                    height={400}
                    loading="lazy"
                  />
                  {!!p.discount && p.discount !== 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-(--sale) text-(--on-sale) px-2 py-0.5 text-xs font-bold">
                      −{p.discount}%
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col gap-1">
                  <h3 className="text-[0.9375rem] leading-5 font-medium text-(--ink) line-clamp-2">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="price text-lg font-bold text-(--price)">₴{p.price}</span>
                    <span className="flex text-sm">
                      <Rating ratings={p.rating} />
                    </span>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        <button type="button" onClick={prev} aria-label="Попередні товари" className={`${arrow} left-1`}>
          <LuChevronLeft className="size-6" aria-hidden="true" />
        </button>
        <button type="button" onClick={next} aria-label="Наступні товари" className={`${arrow} right-1`}>
          <LuChevronRight className="size-6" aria-hidden="true" />
        </button>
      </div>

      {/* Індикатор позиції (декоративний) */}
      <div className="flex justify-center py-6" aria-hidden="true">
        <div ref={bulletsRef} className="flex justify-center gap-2 !static !w-auto" />
      </div>
    </section>
  );
};

export default RelatedCarousel;
