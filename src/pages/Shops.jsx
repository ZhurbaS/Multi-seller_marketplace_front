import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { Range } from "react-range";
import { AiFillStar } from "react-icons/ai";
import { CiStar } from "react-icons/ci";
import Products from "../components/products/Products";
import { BsFillGridFill } from "react-icons/bs";
import { FaThList } from "react-icons/fa";
import ShopProducts from "../components/products/ShopProducts";
import Pagination from "../components/Pagination";

const Shops = () => {
  const [filter, setFilter] = useState(true);
  const categories = [
    "Мобільні телефони",
    "Ноутбуки",
    "Колонки",
    "Верхній одяг",
    "Взуття",
    "Годинники",
    "Домашній декор",
    "Смарт-годинники",
  ];

  const [state, setState] = useState({ values: [1, 200000] });
  const [rating, setRating] = useState("");
  const [styles, setStyles] = useState("grid");
  const [perPage, setPerPage] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div>
      <Header />
      <section className="bg-[url('http://localhost:5173/images/banner/shop.png')] h-[220px] mt-6 bg-cover bg-no-repeat relative bg-left">
        <div className="absolute left-0 top-0 w-full h-full bg-[var(--bg-section)]">
          <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto ">
            <div className="flex flex-col justify-center gap-1 items-center h-full w-full text-[var(--text-section)]">
              <h2 className="text-3xl font-bold">Магазин</h2>
              <div className="flex justify-center items-center gap-2 text-2xl w-full">
                <Link to="/">Головна</Link>
                <span className="pt-1">
                  <IoIosArrowForward />
                </span>
                <span>Магазин</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto ">
          <div className={`max-md:block hidden ${!filter ? "mb-6" : "mb-0"}`}>
            <button
              onClick={() => setFilter(!filter)}
              className="text-center w-full py-2 px-3 bg-[var(--bg-filter)] text-[var(--text-filter)]"
            >
              Фільтр
            </button>
          </div>

          <div className="w-full flex flex-wrap">
            <div
              className={`w-3/12 max-mdlg:w-4/12 max-md:w-full pr-8 ${
                filter
                  ? "max-md:h-0 max-md:overflow-hidden max-md:mb-6"
                  : "max-md:h-auto max-md:overflow-auto max-md:mb-0"
              }`}
            >
              <h2 className="text-3xl font-bold mb-3 text-[var(--text-filterCat)]">
                Категорія
              </h2>
              <div className="py-2">
                {categories.map((c, i) => (
                  <div className="flex justify-start items-center gap-2 py-1">
                    <input type="checkbox" className="" id={c} />
                    <label
                      className="text-[var(--text-filterCat)] block cursor-pointer"
                      htmlFor={c}
                    >
                      {c}
                    </label>
                  </div>
                ))}
              </div>

              <div className="px-2 py-2 flex flex-col gap-5">
                <h2 className="text-3xl font-bold mb-3 text-[var(--text-filterCat)]">
                  Ціна
                </h2>

                <Range
                  step={5}
                  min={1}
                  max={200000}
                  values={state.values}
                  onChange={(values) => setState({ values })}
                  renderTrack={({ props, children }) => (
                    <div
                      {...props}
                      className="w-full h-[6px] bg-[var(--bg-range)] rounded-full cursor-pointer"
                    >
                      {children}
                    </div>
                  )}
                  renderThumb={({ props }) => (
                    <div
                      className="w-[15px] h-[15px] bg-[var(--bg-rangeCircle)] rounded-full transition-all duration-150
                      active:ring-2
                      active:ring-[var(--bg-rangeCircle)]
                      focus:outline-none"
                      {...props}
                    />
                  )}
                />
                <div>
                  <span className="text-[var(--text-range)] font-bold text-lg">
                    ₴{Math.floor(state.values[0])} - ₴
                    {Math.floor(state.values[1])}
                  </span>
                </div>
              </div>

              <div className="py-3 flex flex-col gap-4">
                <h2 className="text-3xl font-bold mb-3 text-[var(--text-filterCat)]">
                  Рейтинг
                </h2>
                <div className="flex flex-col gap-3">
                  <div
                    onClick={() => setRating(5)}
                    className="text-[var(--text-rating)] flex justify-start items-start gap-2 text-xl cursor-pointer"
                  >
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                  </div>
                  <div
                    onClick={() => setRating(4)}
                    className="text-[var(--text-rating)] flex justify-start items-start gap-2 text-xl cursor-pointer"
                  >
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                  </div>
                  <div
                    onClick={() => setRating(3)}
                    className="text-[var(--text-rating)] flex justify-start items-start gap-2 text-xl cursor-pointer"
                  >
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                  </div>
                  <div
                    onClick={() => setRating(2)}
                    className="text-[var(--text-rating)] flex justify-start items-start gap-2 text-xl cursor-pointer"
                  >
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                  </div>
                  <div
                    onClick={() => setRating(1)}
                    className="text-[var(--text-rating)] flex justify-start items-start gap-2 text-xl cursor-pointer"
                  >
                    <span>
                      <AiFillStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                  </div>
                  <div
                    onClick={() => setRating(0)}
                    className="text-[var(--text-rating)] flex justify-start items-start gap-2 text-xl cursor-pointer"
                  >
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                    <span>
                      <CiStar />
                    </span>
                  </div>
                </div>
              </div>
              <div className="py-5 flex flex-col gap-4 max-md:hidden">
                <Products title="Нові товари" />
              </div>
            </div>

            <div className="w-9/12 max-mdlg:w-8/12 max-md:w-full">
              <div className="pl=8 max-md:pl-0">
                <div className="py-4 bg-[var(--bg-uMenu:)] mb-10 px-3 rounded-md flex justify-between items-start border border-[var(--border-uMenu)]">
                  <h2 className="text-lg font-medium text-[var(--text-uMenu)] ">
                    14 товарів
                  </h2>
                  <div className="flex justify-center items-center gap-3">
                    <select
                      className="p-1 border border-[var(--border-uMenu)] outline-0 text-[var(--text-uMenu)] font-semibold"
                      name=""
                      id=""
                    >
                      <option value="">Сортування</option>
                      <option value="low-to-high">за зростанням ціни</option>
                      <option value="high-to-low">за зменшенням ціни</option>
                    </select>
                    <div className="flex justify-center items-start gap-4 max-md:hidden">
                      <div
                        onClick={() => setStyles("grid")}
                        className={`p-2 ${
                          styles === "grid" && "bg-[var(--bg-uMenu-styles)]"
                        } text-[var(--text-uMenu)] hover:bg-[var(--bg-uMenu-styles)] cursor-pointer rounded-sm`}
                      >
                        <BsFillGridFill />
                      </div>
                      <div
                        onClick={() => setStyles("list")}
                        className={`p-2 ${
                          styles === "list" && "bg-[var(--bg-uMenu-styles)]"
                        } text-[var(--text-uMenu)] hover:bg-[var(--bg-uMenu-styles)] cursor-pointer rounded-sm`}
                      >
                        <FaThList />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pb-8">
                  <ShopProducts styles={styles} />
                </div>

                <div className="">
                  <Pagination
                    pageNumber={pageNumber}
                    setPageNumber={setPageNumber}
                    totalItem={10}
                    perPage={perPage}
                    showItem={Math.floor(10 / 3)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Shops;
