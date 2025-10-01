import React, { useEffect, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import {
  price_range_product,
  query_products,
} from "../store/reducers/homeSlice";
import { getFrontendUrl } from "../api/api";

const Shops = () => {
  const dispatch = useDispatch();
  const {
    products,
    categories,
    priceRange,
    latest_product,
    totalProduct,
    perPage,
  } = useSelector((state) => state.home);

  useEffect(() => {
    dispatch(price_range_product());
  }, []);

  useEffect(() => {
    setState({
      values: [priceRange.low, priceRange.high],
    });
  }, [priceRange]);

  const [filter, setFilter] = useState(true);

  const [state, setState] = useState({
    values: [priceRange.low, priceRange.high],
  });
  const [rating, setRating] = useState("");
  const [styles, setStyles] = useState("grid");
  // const [perPage, setPerPage] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

  const [sortPrice, setSortPrice] = useState("");
  const [category, setCategory] = useState("");
  const queryCategory = (e, value) => {
    if (e.target.checked) {
      setCategory(value);
    } else {
      setCategory("");
    }
  };

  useEffect(() => {
    // console.log("Price range values:", state.values);
    dispatch(
      query_products({
        low: state.values[0],
        high: state.values[1],
        category,
        rating,
        sortPrice,
        pageNumber,
      })
    );
  }, [state.values, category, rating, sortPrice, pageNumber]);

  const resetRating = () => {
    setRating("");
    dispatch(
      query_products({
        low: state.values[0],
        high: state.values[1],
        category,
        rating: "",
        sortPrice,
        pageNumber,
      })
    );
  };

  return (
    <div>
      <Header />
      <section
        style={{
          backgroundImage: `url(${
            import.meta.env.VITE_PRODUCTION_FRONT
          }/images/banner/shop.png)`,
        }}
        className="h-[220px] mt-6 bg-cover bg-no-repeat relative bg-left"
      >
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
                  <div
                    key={i}
                    className="flex justify-start items-center gap-2 py-1"
                  >
                    <input
                      checked={category === c.name ? true : false}
                      onChange={(e) => queryCategory(e, c.name)}
                      type="checkbox"
                      className=""
                      id={c.name}
                    />
                    <label
                      className="text-[var(--text-filterCat)] block cursor-pointer"
                      htmlFor={c.name}
                    >
                      {c.name}
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
                  min={priceRange.low}
                  max={priceRange.high}
                  values={state.values}
                  onChange={(values) => setState({ values })}
                  onFinalChange={(values) => {
                    setState({ values }); // оновлює стан після відпускання
                    dispatch(
                      query_products({
                        low: values[0],
                        high: values[1],
                        category,
                        rating,
                        sortPrice,
                        pageNumber,
                      })
                    );
                  }}
                  renderTrack={({ props, children }) => {
                    const { key, ...rest } = props; // виділяємо key
                    return (
                      <div
                        key={key}
                        {...rest}
                        className="w-full h-[6px] bg-[var(--bg-range)] rounded-full cursor-pointer"
                      >
                        {children}
                      </div>
                    );
                  }}
                  renderThumb={({ props }) => {
                    const { key, ...rest } = props;
                    return (
                      <div
                        key={key}
                        className="w-[15px] h-[15px] bg-[var(--bg-rangeCircle)] rounded-full transition-all duration-150
                      active:ring-2
                      active:ring-[var(--bg-rangeCircle)]
                      focus:outline-none"
                        {...rest}
                      />
                    );
                  }}
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
                    onClick={resetRating}
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
                <Products title="Нові товари" products={latest_product} />
              </div>
            </div>

            <div className="w-9/12 max-mdlg:w-8/12 max-md:w-full">
              <div className="pl=8 max-md:pl-0">
                <div className="py-4 bg-[var(--bg-uMenu:)] mb-10 px-3 rounded-md flex justify-between items-start border border-[var(--border-uMenu)]">
                  <h2 className="text-lg font-medium text-[var(--text-uMenu)] ">
                    ({totalProduct}) товарів
                  </h2>
                  <div className="flex justify-center items-center gap-3">
                    <select
                      onChange={(e) => setSortPrice(e.target.value)}
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
                  <ShopProducts products={products} styles={styles} />
                </div>

                <div className="">
                  {totalProduct > perPage && (
                    <Pagination
                      pageNumber={pageNumber}
                      setPageNumber={setPageNumber}
                      totalItem={totalProduct}
                      perPage={perPage}
                      showItem={Math.floor(totalProduct / perPage)}
                    />
                  )}
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
