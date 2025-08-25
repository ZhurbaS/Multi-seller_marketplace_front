import React from "react";
import { FaEye, FaRegHeart } from "react-icons/fa";
import { RiShoppingCartLine } from "react-icons/ri";
import Rating from "../Rating";

const FeatureProducts = () => {
  return (
    <div className="w-[85%] flex flex-wrap mx-auto">
      <div className="w-full ">
        <div className="text-center flex justify-center items-center flex-col text-4xl text-[var(--text-title-featured)] font-bold relative pb-[45px]">
          <h2>Популярні товари</h2>
          <div className="w-[100px] h-[2px] bg-[var(--bg-line-featured)] mt-4"></div>
        </div>
      </div>

      <div className="w-full grid grid-cols-4 max-mdlg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-6">
        {[1, 2, 3, 4, 5, 6].map((p, i) => (
          <div
            key={i}
            className="border border-[var(--border-category)] group transition-all duration-500 hover:shadow-md hover:-mt-3"
          >
            <div className="relative overflow-hidden">
              <div className="flex justify-center items-center absolute text-[var(--text-featured-disc)] w-[38px] h-[38px] rounded-full bg-[var(--bg-featured-disc)] font-semibold text-xs left-2 top-2">
                8%
              </div>
              <img
                className="max-sm:w-full w-full h-[240px]"
                src={`http://localhost:5173/images/products/${i + 1}.webp`}
                alt=""
              />
              <ul className="flex transition-all duration-700 -bottom-10 justify-center items-center gap-2 absolute w-full group-hover:bottom-3">
                <li className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all">
                  <FaRegHeart />
                </li>
                <li className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all">
                  <FaEye />
                </li>
                <li className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all">
                  <RiShoppingCartLine />
                </li>
              </ul>
            </div>

            <div className="py-3 text-[var(--text-featured-pr_name)] px-2">
              <h2 className="font-bold">Назва товару</h2>
              <div className="flex justify-start items-center gap-3">
                <span className="text-md font-semibold">₴755</span>
                <div className="flex">
                  <Rating ratings={4.5} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureProducts;
