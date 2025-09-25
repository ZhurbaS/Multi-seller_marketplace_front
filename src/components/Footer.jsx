import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiFillTikTok } from "react-icons/ai";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaSquareYoutube } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { IoHeart } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";

const Footer = () => {
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.auth);
  const { card_product_count, wishlist_count } = useSelector(
    (state) => state.card
  );

  return (
    <footer className="bg-[var(--bg-footer)]">
      <div className="w-[85%] flex flex-wrap mx-auto border-b border-[var(--border-copyright)] py-16 max-mdlg:pb-10 max-sm:pb-6">
        <div className="w-3/12 max-lg:w-4/12 max-sm:w-full">
          <div className="flex flex-col gap-3">
            <img
              className="w-[210px] h-[70px]"
              src={`http://localhost:5173/images/logoTS.png`}
              alt="logo"
            />
            <ul className="flex flex-col gap-2 text-[var(--text-footer)]">
              <li>
                Адреса: проспект Берестейський, буд. 50, оф. 10, м. Київ, 01001
              </li>
              <li>Номер телефону: 044 999 88 77</li>
              <li>Email: support@techscout.com</li>
            </ul>
          </div>
        </div>
        <div className="w-5/12 max-lg:w-8/12 max-sm:w-full">
          <div className="flex justify-center max-sm:justify-start max-sm:mt-6 w-full">
            <div>
              <h2 className="font-bold text-lg mb-2">Клієнтам</h2>
              <div className="flex justify-between gap-[80px] max-lg:gap-[40px]">
                <ul className="flex flex-col gap-2 text-[var(--text-footer)] text-sm font-semibold">
                  <li>
                    <Link>Вхід до кабінету</Link>
                  </li>
                  <li>
                    <Link>Про нас</Link>
                  </li>
                  <li>
                    <Link>Оплата і доставка</Link>
                  </li>
                  <li>
                    <Link>Обмін та повернення</Link>
                  </li>
                  <li>
                    <Link>Контактна інформація</Link>
                  </li>
                </ul>
                <ul className="flex flex-col gap-2 text-[var(--text-footer)] text-sm font-semibold">
                  <li>
                    <Link>Сервіс</Link>
                  </li>
                  <li>
                    <Link>Акції</Link>
                  </li>
                  <li>
                    <Link>Блог</Link>
                  </li>
                  <li>
                    <Link>Наші партнери</Link>
                  </li>
                  <li>
                    <Link>Публічна оферта</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="w-4/12 max-lg:w-full max-lg:mt-6">
          <div className="w-full flex flex-col justify-start gap-5">
            <h2 className="font-bold text-lg mb-2">Підписуйтесь!</h2>
            <span>Дізнавайтесь про нові акції першими</span>
            <div className="h-[50px] w-full bg-[var(--bg-subscribe)] border border-[var(--border-subscribe)] relative">
              <input
                className="h-full bg-transparent w-full px-3 outline-0"
                type="text"
                placeholder="Введіть Ваш Email"
              />
              <button className="h-full absolute right-0 bg-[var(--bg-subscribeBtn)] text-[var(--text-subscribe)] uppercase px-4 font-bold text-sm">
                Підписатися
              </button>
            </div>
            <ul className="flex justify-start items-center gap-3">
              <li>
                <a
                  className="w-[38px] h-[38px] hover:bg-[var(--bg-icon-hov)] hover:text-[var(--text-icon)] flex justify-center items-center bg-[var(--bg-icon)] rounded-full"
                  href="#"
                >
                  <FaSquareYoutube />
                </a>
              </li>
              <li>
                <a
                  className="w-[38px] h-[38px] hover:bg-[var(--bg-icon-hov)] hover:text-[var(--text-icon)] flex justify-center items-center bg-[var(--bg-icon)] rounded-full"
                  href="#"
                >
                  <IoLogoFacebook />
                </a>
              </li>
              <li>
                <a
                  className="w-[38px] h-[38px] hover:bg-[var(--bg-icon-hov)] hover:text-[var(--text-icon)] flex justify-center items-center bg-[var(--bg-icon)] rounded-full"
                  href="#"
                >
                  <AiFillTikTok />
                </a>
              </li>
              <li>
                <a
                  className="w-[38px] h-[38px] hover:bg-[var(--bg-icon-hov)] hover:text-[var(--text-icon)] flex justify-center items-center bg-[var(--bg-icon)] rounded-full"
                  href="#"
                >
                  <FaSquareInstagram />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-[90%] flex flex-wrap justify-center items-center text-[var(--text-footer)] mx-auto py-5 text-center">
        <span>© Всі права захищені 2025</span>
      </div>

      <div className="hidden fixed max-mdlg:block w-[50px] h-[110px] bottom-3 right-2 bg-[var(--bg-footer-sidebar-main)] rounded-full p-2">
        <div className="w-full h-full flex gap-3 flex-col justify-center items-center">
          <div
            onClick={() => navigate(userInfo ? "/card" : "/login")}
            className="relative flex justify-center items-center cursor-pointer w-[35px] h-[35px] rounded-full bg-[var(--bg-footer-sidebar)] "
          >
            <span className="text-xl text-[var(--text-footer-sidebar)]">
              <FaShoppingCart />
            </span>
            {card_product_count !== 0 && (
              <div className="w-[20px] h-[20px] absolute bg-[var(--bg-footer-sidebar-ring)] rounded-full text-[var(--text-footer-sidebar-ring)] flex justify-center items-center -top-[3px] -right-[5px]">
                {card_product_count}
              </div>
            )}
          </div>

          <div
            onClick={() =>
              navigate(userInfo ? "/dashboard/my-wishlist" : "/login")
            }
            className="relative flex justify-center items-center cursor-pointer w-[35px] h-[35px] rounded-full bg-[var(--bg-footer-sidebar)] "
          >
            <span className="text-xl text-[var(--text-footer-sidebar)]">
              <IoHeart />
            </span>
            {wishlist_count !== 0 && (
              <div className="w-[20px] h-[20px] absolute bg-[var(--bg-footer-sidebar-ring)] rounded-full text-[var(--text-footer-sidebar-ring)] flex justify-center items-center -top-[3px] -right-[5px]">
                {wishlist_count}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
