import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";

const Shops = () => {
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
      <Footer />
    </div>
  );
};

export default Shops;
