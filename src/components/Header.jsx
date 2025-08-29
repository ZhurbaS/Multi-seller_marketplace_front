import React, { useState } from "react";
import { MdEmail } from "react-icons/md";
import {
  FaPhoneAlt,
  FaUser,
  FaLock,
  FaList,
  FaShoppingCart,
} from "react-icons/fa";
import { IoMdArrowDropdown, IoIosArrowDown } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { IoHeart } from "react-icons/io5";
import { AiFillTikTok } from "react-icons/ai";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaSquareYoutube } from "react-icons/fa6";

const Header = ({ categories }) => {
  const { pathname } = useLocation();

  const [showSidebar, setShowSidebar] = useState(true);
  const [categoryShow, setCategoryShow] = useState(true);
  const user = true;
  const wishlist_count = 3;

  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div className="w-full bg-[var(--bg-header-primary)]">
      <div className="header-top bg-[var(--bg-header)] max-mdlg:hidden">
        <div className="w-[85%] max-lg:w-[90%] mx-auto">
          <div className="flex w-full justify-between items-center h-[50px] text-[var(--text-header)]">
            <ul className="flex justify-start items-center gap-8 font-semibold text-[var(--text-header-list)]">
              <li className="flex relative justify-center items-center gap-2 text-sm after:absolute after:h-[18px] after:w-[1px] after:bg-[var(--bg-header-li)] after:-right-[16px]">
                <span>
                  <MdEmail />
                </span>
                <span>support@gmail.com</span>
              </li>
              <li className="flex relative justify-center items-center gap-2 text-sm">
                <span>
                  <FaPhoneAlt />
                </span>
                <span>044 888 55 22 </span>
              </li>
            </ul>

            <div>
              <div className="flex justify-center items-center gap-10">
                <div className="flex justify-center items-center gap-4 text-[var(--text-header-list)]">
                  <a href="#">
                    <FaSquareYoutube />
                  </a>
                  <a href="#">
                    <IoLogoFacebook />
                  </a>
                  <a href="#">
                    <AiFillTikTok />
                  </a>
                  <a href="#">
                    <FaSquareInstagram />
                  </a>
                </div>
                <div className="flex group cursor-pointer text-[var(--text-header-leng)] text-sm justify-center items-center gap-1 relative after:h-[18px] after:w-[1px] after:bg-[var(--bg-header-li)] after:-right-[16px] after:absolute before:absolute before:h-[18px] before:bg-[var(--bg-header-li)] before:w-[1px] before:-left-[20px]">
                  <img src="http://localhost:5173/images/language.png" alt="" />
                  <span>
                    <IoMdArrowDropdown />
                  </span>
                  <ul className="absolute invisible transition-all top-12 rounded-sm duration-200 text-[var(--text-header-leng-hover)] p-2 w-[100px] flex flex-col gap-3 group-hover:visible group-hover:top-6 group-hover:bg-[var(--bg-header-leng-hover)] z-10">
                    <li>Українська</li>
                    <li>Русский</li>
                    <li>English</li>
                  </ul>
                </div>

                {user ? (
                  <Link
                    className="flex cursor-pointer justify-center items-center gap-2 text-sm text-[var(--text-header-list)]"
                    to="/dashboard"
                  >
                    <span>
                      <FaUser />
                    </span>
                    <span>Сергій Журба</span>
                  </Link>
                ) : (
                  <Link
                    className="flex cursor-pointer justify-center items-center gap-2 text-sm text-[var(--text-header-list)]"
                    to="/login"
                    // style={{ color: "var(--text-header-list)" }} // прямий inline стиль
                  >
                    <span>
                      <FaLock />
                    </span>
                    <span>Вхід</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[var(--bg-header-primary)]">
        <div className="w-[85%] max-lg:w-[90%] mx-auto">
          <div className="h-[80px] max-mdlg:h-[100px] flex justify-between items-center flex-wrap">
            <div className="max-mdlg:w-full w-3/12 max-mdlg:pt-4">
              <div className="flex justify-between items-center ">
                <Link to="/">
                  <img
                    className="w-[235px]"
                    src="http://localhost:5173/images/logoTS.png"
                    alt=""
                  />
                </Link>
                <div
                  className="justify-center items-center w-[30px] h-[30px] bg-[var(--bg-header-primary)] text-[var(--text-header-menu)] !border !border-[var(--border-header-menu)] rounded-sm cursor-pointer max-lg:hidden max-mdlg:flex max-xl:hidden hidden"
                  onClick={() => setShowSidebar(false)}
                >
                  <span>
                    <FaList />
                  </span>
                </div>
              </div>
            </div>

            <div className="max-mdlg:w-full w-9/12 ">
              <div className="flex justify-between max-mdlg:justify-center items-center flex-wrap pl-8">
                <ul className="flex justify-start items-start gap-8 text-sm font-bold uppercase max-mdlg:hidden">
                  <li>
                    <Link
                      className={`p-2 block ${
                        pathname === "/"
                          ? "text-[var(--text-active-menuItem)]"
                          : "text-[var(--text-header-menu)]"
                      }`}
                    >
                      Головна
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={"/shops"}
                      className={`p-2 block ${
                        pathname === "/shops"
                          ? "text-[var(--text-active-menuItem)]"
                          : "text-[var(--text-header-menu)]"
                      }`}
                    >
                      Магазин
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={`p-2 block ${
                        pathname === "/blog"
                          ? "text-[var(--text-active-menuItem)]"
                          : "text-[var(--text-header-menu)]"
                      }`}
                    >
                      Блог
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={`p-2 block ${
                        pathname === "/about"
                          ? "text-[var(--text-active-menuItem)]"
                          : "text-[var(--text-header-menu)]"
                      }`}
                    >
                      Про нас
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={`p-2 block ${
                        pathname === "/contact"
                          ? "text-[var(--text-active-menuItem)]"
                          : "text-[var(--text-header-menu)]"
                      }`}
                    >
                      Контакти
                    </Link>
                  </li>
                </ul>

                <div className="flex max-mdlg:hidden justify-center items-center gap-5">
                  <div className="flex justify-center gap-5">
                    <div className="relative flex justify-center items-center cursor-pointer w-[35px] h-[35px] rounded-full bg-[var(--bg-header-wish)]">
                      <span className="text-xl text-[var(--wishHeart-active)]">
                        <IoHeart />
                      </span>
                      <div className="w-[20px] h-[20px] absolute bg-[var(--bg-countCircle)] rounded-full text-[var(--text-countCircle)] flex justify-center items-center -top-[3px] -right-[5px]">
                        {wishlist_count}
                      </div>
                    </div>
                    <div className="relative flex justify-center items-center cursor-pointer w-[35px] h-[35px] rounded-full bg-[var(--bg-header-wish)]">
                      <span className="text-xl text-[var(--wishHeart-active)]">
                        <FaShoppingCart />
                      </span>
                      <div className="w-[20px] h-[20px] absolute bg-[var(--bg-countCircle)] rounded-full text-[var(--text-countCircle)] flex justify-center items-center -top-[3px] -right-[5px]">
                        {wishlist_count}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden max-mdlg:block">
        <div
          onClick={() => setShowSidebar(true)}
          className={`fixed duration-200 transition-all ${
            showSidebar ? "invisible" : "visible"
          } hidden max-mdlg:block w-screen h-screen bg-[var(--bg-sidebar-primary)] top-0 left-0 z-20`}
        ></div>
        <div
          className={`w-[300px] z-[9999] transition-all duration-200 fixed ${
            showSidebar ? "-left-[300px]" : "left-0 top-0"
          } overflow-y-auto bg-[var(--bg-sidebar-secondary)] h-screen py-6 px-8`}
        >
          <div className="flex justify-start flex-col gap-6">
            <Link to="/">
              <img
                className="w-[235px]"
                src="http://localhost:5173/images/logoTS.png"
                alt=""
              />
            </Link>
            <div className="flex justify-start items-center gap-10">
              <div className="flex group cursor-pointer text-[var(--text-header-leng)] text-sm justify-center items-center gap-1 relative after:h-[18px] after:w-[1px] after:bg-[var(--bg-header-li)] after:-right-[16px] after:absolute">
                <img src="http://localhost:5173/images/language.png" alt="" />
                <span>
                  <IoMdArrowDropdown />
                </span>
                <ul className="absolute invisible transition-all top-12 rounded-sm duration-200 text-[var(--text-header-leng-hover)] p-2 w-[100px] flex flex-col gap-3 group-hover:visible group-hover:top-6 group-hover:bg-[var(--bg-header-leng-hover)] z-10">
                  <li>Українська</li>
                  <li>Русский</li>
                  <li>English</li>
                </ul>
              </div>

              {user ? (
                <Link
                  className="flex cursor-pointer justify-center items-center gap-2 text-sm text-[var(--text-header-list)]"
                  to="/dashboard"
                >
                  <span>
                    <FaUser />
                  </span>
                  <span>Сергій Журба</span>
                </Link>
              ) : (
                <Link
                  className="flex cursor-pointer justify-center items-center gap-2 text-sm text-[var(--text-header-list)]"
                  to="/login"
                  // style={{ color: "var(--text-header-list)" }} // прямий inline стиль
                >
                  <span>
                    <FaLock />
                  </span>
                  <span>Вхід</span>
                </Link>
              )}
            </div>

            <ul className="flex flex-col justify-start items-start text-sm font-bold uppercase">
              <li>
                <Link
                  className={`py-2 block ${
                    pathname === "/"
                      ? "text-[var(--text-active-menuItem)]"
                      : "text-[var(--text-header-menu)]"
                  }`}
                >
                  Головна
                </Link>
              </li>
              <li>
                <Link
                  to={"/shops"}
                  className={`py-2 block ${
                    pathname === "/shops"
                      ? "text-[var(--text-active-menuItem)]"
                      : "text-[var(--text-header-menu)]"
                  }`}
                >
                  Магазин
                </Link>
              </li>
              <li>
                <Link
                  className={`py-2 block ${
                    pathname === "/blog"
                      ? "text-[var(--text-active-menuItem)]"
                      : "text-[var(--text-header-menu)]"
                  }`}
                >
                  Блог
                </Link>
              </li>
              <li>
                <Link
                  className={`py-2 block ${
                    pathname === "/about"
                      ? "text-[var(--text-active-menuItem)]"
                      : "text-[var(--text-header-menu)]"
                  }`}
                >
                  Про нас
                </Link>
              </li>
              <li>
                <Link
                  className={`py-2 block ${
                    pathname === "/contact"
                      ? "text-[var(--text-active-menuItem)]"
                      : "text-[var(--text-header-menu)]"
                  }`}
                >
                  Контакти
                </Link>
              </li>
            </ul>
            <div className="flex justify-start items-center gap-4 text-[var(--text-header-list)]">
              <a href="#">
                <FaSquareYoutube />
              </a>
              <a href="#">
                <IoLogoFacebook />
              </a>
              <a href="#">
                <AiFillTikTok />
              </a>
              <a href="#">
                <FaSquareInstagram />
              </a>
            </div>

            <div className="w-full flex justify-end max-mdlg:justify-start gap-3 items-center">
              <div className="w-[48px] h-[48px] rounded-full flex bg-[var(--bg-sidebar-phone)] justify-center items-center">
                <span>
                  <FaPhoneAlt />
                </span>
              </div>
              <div className="flex justify-end flex-col gap-1">
                <h2 className="text-sm font-medium text-[var(--text-sidebar-phoneNum)]">
                  044 888 55 22
                </h2>
                <span className="text-xs">Підтримка 24/7</span>
              </div>
            </div>

            <ul className="flex flex-col justify-start items-start gap-3 text-[var(--text-sidebar-mail)]">
              <li className="flex justify-start items-center gap-2 text-sm">
                <span>
                  <MdEmail />
                </span>
                <span>support@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-[85%] max-lg:w-[90%] mx-auto">
        <div className="flex w-full flex-wrap max-mdlg:gap-8">
          <div className="w-3/12 max-mdlg:w-full">
            <div className="bg-[var(--bg-header-primary)] relative">
              <div
                onClick={() => setCategoryShow(!categoryShow)}
                className="h-[50px] bg-[var(--bg-btn-allCat)] text-[var(--text-allCat)] flex justify-center max-mdlg:justify-between max-mdlg:px-6 items-center gap-3 font-bold text-md cursor-pointer"
              >
                <div className="flex justify-center items-center gap-3">
                  <span>
                    <FaList />
                  </span>
                  <span>Категорії</span>
                </div>
                <span className="pt-1">
                  <IoIosArrowDown />
                </span>
              </div>

              <div
                className={`${
                  categoryShow ? "h-0" : "h-[400px]"
                } overflow-hidden transition-all max-mdlg:relative duration-500 absolute z-[9999] bg-[var(--bg-allCat)] w-full border-x border-[var(--bg-allCat-bord)]`}
              >
                <ul className="py-2 text-[var(--text-menu-allCat)]">
                  {categories.map((c, i) => {
                    return (
                      <li
                        key={i}
                        className="flex justify-start items-center gap-2 px-[24px] py-[6px]"
                      >
                        <img
                          src={c.image}
                          alt=""
                          className="w-[30px] h-[30px] rounded-full overflow-hidden"
                        />
                        <Link className="text-sm block">{c.name}</Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="w-9/12 pl-8 max-mdlg:pl-0 max-mdlg:w-full">
            <div className="flex flex-wrap w-full justify-between items-center max-mdlg:gap-6 ">
              <div className="w-8/12 max-mdlg:w-full">
                <div className="flex border border-[var(--border-search)] h-[50px] items-center relative gap-6">
                  <div className="relative after:absolute after:h-[25px] after:w-[1px] after:bg-[var(--bg-search-sep)] after:-right-[15px] max-md:hidden">
                    <select
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-[180px] text-[var(--text-menu-allCat)] font-semibold bg-transparent px-2 h-full outline-0 border-none"
                      name=""
                      id=""
                    >
                      <option value="">Вибрати категорію</option>
                      {categories.map((c, i) => (
                        <option key={i} value={c}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    className="w-full relative bg-transparent text-[var(--text-search)] outline-0 px-3 h-full"
                    onChange={(e) => setSearchValue(e.target.value)}
                    type="text"
                    name=""
                    id=""
                    placeholder="Пошук товарів"
                  />
                  <button className="bg-[var(--bg-btn-allCat)] right-0 absolute px-8 h-full font-semibold uppercase text-[var(--text-allCat)]">
                    Пошук
                  </button>
                </div>
              </div>

              <div className="w-4/12 block max-mdlg:hidden pl-2 max-mdlg:w-full max-mdlg:pl-0">
                <div className="w-full flex justify-end max-mdlg:justify-start gap-3 items-center">
                  <div className="w-[48px] h-[48px] rounded-full flex bg-[var(--bg-sidebar-phone)] justify-center items-center">
                    <span>
                      <FaPhoneAlt />
                    </span>
                  </div>
                  <div className="flex justify-end flex-col gap-1">
                    <h2 className="text-md font-medium text-[var(--text-sidebar-phoneNum)]">
                      044 888 55 22
                    </h2>
                    <span className="text-sm">Підтримка 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
