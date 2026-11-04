import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Rating from "../Rating";
import { baseUnitPrice } from "../../utils/pricing";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import "swiper/css";

const formatUah = (n) =>
  `₴${(Number(n) || 0).toLocaleString("uk-UA", { maximumFractionDigits: 2 })}`;

const NavButtons = ({ title }) => {
  const swiper = useSwiper();
  const btn =
    "w-11 h-11 grid place-items-center rounded-full border border-(--line) bg-(--surface) text-(--ink) text-xl motion-safe:active:scale-95 motion-safe:transition-transform [@media(hover:hover)]:hover:bg-(--surface-2)";

  return (
    <div className="flex justify-between items-center gap-2 pb-3">
      <h2 className="text-lg/6 font-bold text-(--ink)">{title}</h2>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => swiper.slidePrev()} className={btn} aria-label="Попередні товари">
          <LuChevronLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={() => swiper.slideNext()} className={btn} aria-label="Наступні товари">
          <LuChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// Swiper measures its container in floating-point pixels (e.g. 379.72px).
// During a GPU-accelerated slide transition, the browser can round the
// transformed slide's edge and the overflow-hidden clip edge to slightly
// different sub-pixel values, leaving a hairline sliver of the next slide
// visible at certain container widths. Snapping the container to a whole
// number of pixels removes that fractional boundary entirely, so there is
// nothing left to round inconsistently.
const useIntegerWidth = () => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect?.width;
      if (measured) setWidth(Math.floor(measured));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, width };
};

// Компактний список товарів (бічні колонки каталогу): products — масив «сторінок» по 3 товари.
const Products = ({ title, products = [] }) => {
  const { containerRef, width } = useIntegerWidth();

  return (
    <section ref={containerRef} className="w-full overflow-hidden">
      <div style={width ? { width } : undefined}>
        <Swiper slidesPerView={1} spaceBetween={0}>
          <div slot="container-start">
            <NavButtons title={title} />
          </div>
          {products.map((p, i) => (
            <SwiperSlide key={i}>
              <ul className="flex flex-col gap-2 w-full">
                {p.map((pl, j) => {
                  const d = Number(pl.discount) || 0;
                  return (
                    <li key={pl._id || j}>
                      <Link
                        className="flex items-start gap-3 w-full p-2 rounded-(--r-md) bg-(--surface) border border-(--line) motion-safe:transition-shadow [@media(hover:hover)]:hover:shadow-(--shadow-2)"
                        to={`/product/details/${pl.slug}`}
                      >
                        <span className="relative shrink-0 w-[88px] aspect-square">
                          <img
                            className="w-full h-full object-contain"
                            src={pl.images?.[0]}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            width="88"
                            height="88"
                          />
                          {d > 0 && (
                            <span className="absolute left-0 top-0 rounded-(--r-sm) bg-(--sale) text-(--on-sale) text-xs font-bold px-1 tabular-nums">
                              −{d}%
                            </span>
                          )}
                        </span>
                        <span className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="text-sm/5 text-(--ink) line-clamp-2 break-words">
                            {pl.name}
                          </span>
                          <span className="text-sm">
                            <Rating ratings={pl.rating} showValue />
                          </span>
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className={`price text-base font-bold ${d > 0 ? "text-(--sale)" : "text-(--price)"}`}>
                              <span className="sr-only">Ціна: </span>
                              {formatUah(baseUnitPrice(pl))}
                            </span>
                            {d > 0 && (
                              <s className="text-xs text-(--ink-2) tabular-nums">
                                <span className="sr-only">Стара ціна: </span>
                                {formatUah(pl.price)}
                              </s>
                            )}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Products;
