import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaList } from "react-icons/fa";
import { Link, Outlet } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { BsFillCartCheckFill } from "react-icons/bs";
import { IoHeart } from "react-icons/io5";
import { IoMdChatbubbles } from "react-icons/io";
import { RiLogoutBoxFill } from "react-icons/ri";
import { RiLockPasswordFill } from "react-icons/ri";

const Dashboard = () => {
  const [filterShow, setFilterShow] = useState(false);

  return (
    <div>
      <Header />
      <div className="bg-[var(--bg-dash)] mt-5">
        <div className="w-[90%] mx-auto max-mdlg:block hidden">
          <div className="">
            <button
              onClick={() => setFilterShow(!filterShow)}
              className="text-center py-3 px-3 bg-[var(--bg-dashListBtn)] text-[var(--text-dashListBtn)]"
            >
              <FaList />
            </button>
          </div>
        </div>

        <div className="h-full mx-auto">
          <div className="py-5 flex mex-mdlg:w-[90%] mx-auto relative">
            <div
              className={`rounded-md z-50 max-mdlg:absolute ${
                filterShow ? "-left-4" : "-left-[360px]"
              } w-[270px] ml-4 bg-[var(--bg-dashSec)]`}
            >
              <ul className="py-2 text-[var(--text-dash)] px-4">
                <li className="flex justify-start items-center gap-2 py-2">
                  <span className="text-xl">
                    <IoHome />
                  </span>
                  <Link to="/dashboard" className="block">
                    Особистий кабінет
                  </Link>
                </li>
                <li className="flex justify-start items-center gap-2 py-2">
                  <span className="text-xl">
                    <BsFillCartCheckFill />
                  </span>
                  <Link to="/dashboard/my-orders" className="block">
                    Мої замовлення
                  </Link>
                </li>
                <li className="flex justify-start items-center gap-2 py-2">
                  <span className="text-xl">
                    <IoHeart />
                  </span>
                  <Link to="/dashboard/my-wishlist" className="block">
                    Список бажань
                  </Link>
                </li>
                <li className="flex justify-start items-center gap-2 py-2">
                  <span className="text-xl">
                    <IoMdChatbubbles />
                  </span>
                  <Link to="/dashboard/chat" className="block">
                    Чат
                  </Link>
                </li>
                <li className="flex justify-start items-center gap-2 py-2">
                  <span className="text-xl">
                    <RiLockPasswordFill />
                  </span>
                  <Link to="/dashboard/change-password" className="block">
                    Змінити пароль
                  </Link>
                </li>
                <li className="flex justify-start items-center gap-2 py-2">
                  <span className="text-xl">
                    <RiLogoutBoxFill />
                  </span>
                  <Link to="/dashboard" className="block">
                    Вийти
                  </Link>
                </li>
              </ul>
            </div>

            <div className="w-[calc(100%-270px)] max-mdlg:w-full)">
              <div className="mx-4 max-mdlg:mx-0">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
