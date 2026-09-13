import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import "swiper/css";

const NavButtons = ({ title }) => {
  const swiper = useSwiper();

  return (
    <div className="flex justify-between items-center pb-3">
      <div className="text-xl font-bold text-[var(var(--text-latest))]">
        {title}
      </div>
      <div className="flex justify-center items-center gap-3 text-[var(var(--text-latest))]">
        <button
          type="button"
          onClick={() => swiper.slidePrev()}
          className="w-[30px] h-[30px] flex justify-center items-center bg-[var(--bg-latest-leftArrow)] border border-[var(--border-latest-leftArrow)] outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--border-latest-leftArrow)] active:scale-90 transition-transform"
        >
          <FiChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => swiper.slideNext()}
          className="w-[30px] h-[30px] flex justify-center items-center bg-[var(--bg-latest-leftArrow)] border border-[var(--border-latest-leftArrow)] outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--border-latest-leftArrow)] active:scale-90 transition-transform"
        >
          <FiChevronRight />
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

const Products = ({ title, products }) => {
  const { containerRef, width } = useIntegerWidth();

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div style={width ? { width } : undefined}>
        <Swiper slidesPerView={1} spaceBetween={0}>
          <div slot="container-start">
            <NavButtons title={title} />
          </div>
          {products.map((p, i) => (
            <SwiperSlide key={i}>
              <div className="flex flex-col justify-start gap-2 w-full">
                {p.map((pl, j) => (
                  <Link
                    className="flex justify-start items-start w-full"
                    to={`/product/details/${pl.slug}`}
                    key={j}
                  >
                    <img
                      className="w-[110px] h-[110px] object-cover shrink-0"
                      src={pl.images[0]}
                      alt=""
                    />
                    <div className="px-3 flex justify-start items-start gap-1 flex-col text-[var(--text-latest)] min-w-0 flex-1">
                      <h2 className="w-full line-clamp-2 break-words">
                        {pl.name}
                      </h2>
                      <span className="text-lg font-bold">₴{pl.price}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Products;
