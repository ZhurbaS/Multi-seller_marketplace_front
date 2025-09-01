import React from "react";
import { FaEye, FaRegHeart } from "react-icons/fa";
import { RiShoppingCartLine } from "react-icons/ri";
import Rating from "../Rating";

const ShopProducts = ({ styles, products }) => {
  return (
    <div
      className={`w-full grid ${
        styles === "grid"
          ? "grid-cols-3 max-mdlg:grid-cols-2 max-md:grid-cols-2"
          : "grid-cols-1 max-mdlg:grid-cols-2 max-md:grid-cols-2"
      } gap-3`}
    >
      {products.map((p, i) => (
        <div
          key={i}
          className={`flex transition-all duration-1000 hover:shadow-md hover:-translate-y-3 ${
            styles === "grid"
              ? "flex flex-col justify-start items-start"
              : "justify-start items-center max-mdlg:flex-col max-mdlg:justify-start max-mdlg:items-start"
          } w-full gap-4 bg-[var(--bg-products)] p-1 rounded-md`}
        >
          <div
            className={
              styles === "grid"
                ? "w-full relative group h-[210px] max-md:h-[270px] max-xs:h-[170px] overflow-hidden"
                : "max-mdlg:w-full relative group h-[210px] max-md:h-[270px] overflow-hidden"
            }
          >
            <img
              className="h-[240px] rounded-md max-md:h[270px] max-xs:h-[170px] w-full object-cover"
              src={p.images[0]}
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
          <div className="flex justify-start items-start flex-col gap-1">
            <h2 className="font-bold">{p.name}</h2>
            <div className="flex justify-start items-center gap-3">
              <span className="text-md font-semibold">₴{p.price}</span>
              <div className="flex">
                <Rating ratings={p.rating} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopProducts;
