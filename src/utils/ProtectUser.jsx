import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectUser = () => {
  const { userInfo } = useSelector((state) => state.auth);
  // Гостьова сесія без e-mail (кошик без реєстрації) кабінету не має — просимо увійти
  if (userInfo && !(userInfo.guest && !userInfo.email)) {
    return <Outlet />;
  } else {
    return <Navigate to="/login" replace={true} />;
  }
};

export default ProtectUser;
