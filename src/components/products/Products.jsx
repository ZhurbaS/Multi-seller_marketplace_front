import React from "react";
import Carousel from "react-multi-carousel";
import { Link } from "react-router-dom";
import "react-multi-carousel/lib/styles.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Products = ({ title }) => {
  const products = [
    [1, 2, 3],
    [4, 5, 6],
  ];

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 1,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 1,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 1,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  const ButtonGroup = ({ next, previous }) => {
    return (
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-[var(var(--text-latest))]">
          {title}
        </div>
        <div className="flex justify-center items-center gap-3 text-[var(var(--text-latest))]">
          <button
            onClick={() => previous()}
            className="w-[30px] h-[30px] flex justify-center items-center bg-[var(--bg-latest-leftArrow)] border border-[var(--border-latest-leftArrow)]"
          >
            <FiChevronLeft />
          </button>
          <button
            onClick={() => next()}
            className="w-[30px] h-[30px] flex justify-center items-center bg-[var(--bg-latest-leftArrow)] border border-[var(--border-latest-leftArrow)]"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-8 flex-col-reverse">
      <Carousel
        autoPlay={false}
        infinite={false}
        arrows={false}
        responsive={responsive}
        transitionDuration={500}
        renderButtonGroupOutside={true}
        customButtonGroup={<ButtonGroup />}
      >
        {products.map((p, i) => {
          return (
            <div className="flex flex-col justify-start gap-2" key={i}>
              {p.map((pl, j) => (
                <Link className="flex justify-start items-start" to="#" key={j}>
                  <img
                    className="w-[110px] h-[110px]"
                    src={`http://localhost:5173/images/products/${pl}.webp`}
                    alt=""
                  />
                  <div className="px-3 flex justify-start items-start gap-1 flex-col text-[var(--text-latest)]">
                    <h2>Назва товару</h2>
                    <span className="text-lg font-bold">₴455</span>
                  </div>
                </Link>
              ))}
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

export default Products;
