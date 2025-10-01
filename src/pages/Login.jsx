import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaFacebookF } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { customer_login, messageClear } from "../store/reducers/authSlice";
import toast from "react-hot-toast";
import { FadeLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import { getFrontendUrl } from "../api/api";

const Login = () => {
  const navigate = useNavigate();

  const { loader, errorMessage, successMessage, userInfo } = useSelector(
    (state) => state.auth
  );

  const dispatch = useDispatch();

  const [state, setState] = useState({
    email: "",
    phone: "",
    password: "",
  });

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const login = (e) => {
    e.preventDefault();
    // console.log(state);
    dispatch(customer_login(state));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    if (userInfo) {
      navigate("/");
    }
  }, [successMessage, errorMessage]);

  return (
    <div>
      {loader && (
        <div className="w-screen h-screen flex justify-center items-center fixed left-0 top-0 bg-[var(--bg--regLoader)] z-[999]">
          <FadeLoader />
        </div>
      )}
      <Header />
      <div className="bg-[var(--bg-reg)] mt-4">
        <div className="w-full justify-center items-center p-10">
          <div className="grid grid-cols-2 w-[60%] mx-auto bg-[var(--bg-regIn)] rounded-md">
            <div className="px-8 py-8">
              <h2 className="text-center w-full text-xl text-[var(--text-reg)] font-bold">
                Війти
              </h2>

              <div className="">
                <form onSubmit={login} className="text-[var(--text-reg)]">
                  <div className="flex flex-col gap-1 mb-2">
                    <label htmlFor="email" className="">
                      Email
                    </label>
                    <input
                      onChange={inputHandle}
                      value={state.email}
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Email"
                      required
                      className="w-full px-3 py-2 border border-[var(--border-reg)] outline-none focus:border-[var(--border-regFoc)] rounded-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                    <label htmlFor="phone" className="">
                      Номер телефону
                    </label>
                    <input
                      onChange={inputHandle}
                      value={state.phone}
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Номер телефону"
                      required
                      className="w-full px-3 py-2 border border-[var(--border-reg)] outline-none focus:border-[var(--border-regFoc)] rounded-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                    <label htmlFor="password" className="">
                      Пароль
                    </label>
                    <input
                      onChange={inputHandle}
                      value={state.password}
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Пароль"
                      required
                      className="w-full px-3 py-2 border border-[var(--border-reg)] outline-none focus:border-[var(--border-regFoc)] rounded-md"
                    />
                  </div>
                  <button className="px-8 w-full py-2 bg-[var(--bg-regBtn)] shadow-lg hover:shadow-green-500/40 text-[var(--text-regBtn)] rounded-md">
                    Війти
                  </button>
                </form>

                <div className="flex justify-center items-center py-2">
                  <div className="h-[1px] bg-[var(--bg-regOrLine)] w-[95%]"></div>
                  <span className="px-3 text-[var(--text-reg)] ">Чи</span>
                  <div className="h-[1px] bg-[var(--bg-regOrLine)] w-[95%]"></div>
                </div>
                <button className="px-8 w-full py-2 bg-[var(--bg-regFb)] shadow hover:shadow-indigo-500/50 text-[var(--text-regFb)] rounded-md flex justify-center items-center gap-2 mb-3">
                  <span>
                    <FaFacebookF />
                  </span>
                  <span>Війти через Facebook</span>
                </button>

                <button className="px-8 w-full py-2 bg-[var(--bg-regG)] shadow hover:shadow-red-500/50 text-[var(--text-regFb)] rounded-md flex justify-center items-center gap-2 mb-3">
                  <span>
                    <FaGoogle />
                  </span>
                  <span>Війти через Gmail</span>
                </button>
              </div>

              <div className="text-center text-[var(--text-reg)] pt-1">
                <p>
                  Не маєте акаунту?{" "}
                  <Link to="/register" className="text-[var(--text-regLog)]">
                    Зареєструватися
                  </Link>
                </p>
              </div>
              <a target="_blank" href="http://localhost:5001/login">
                <div className="mt-3 px-8 w-full py-2 bg-[var(--bg-sellerLoginBtn)] shadow hover:shadow-red-500/50 text-[var(--text-regFb)] rounded-md flex justify-center items-center gap-2 mb-3">
                  Ввійти як продавець
                </div>
              </a>
              <a target="_blank" href="http://localhost:5001/register">
                <div className="px-8 w-full py-2 bg-[var(--bg-sellerRegisterBtn)] shadow hover:shadow-red-500/50 text-[var(--text-regFb)] rounded-md flex justify-center items-center gap-2 mb-3">
                  Зареєструватися як продавець
                </div>
              </a>
            </div>

            <div className="w-full h-full py-4 pr-4">
              <img src={getFrontendUrl("/images/login.jpg")} alt="" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
