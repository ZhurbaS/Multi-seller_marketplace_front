import React from "react";

const ShopProducts = ({ styles }) => {
  return (
    <div
      className={`w-full grid ${
        styles === "grid"
          ? "grid-cols-3 max-mdlg:grid-cols-2 max-md:grid-cols-2"
          : "grid-cols-1 max-mdlg:grid-cols-2 max-md:grid-cols-2"
      } gap-3`}
    >
      {[1, 2, 3, 4, 5, 6].map((p, i) => (
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
              src={`http://localhost:5173/images/products/${i + 1}.webp`}
              alt=""
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopProducts;
