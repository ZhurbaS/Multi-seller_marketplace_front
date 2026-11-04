import React, { useEffect } from "react";
import Home from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import Shops from "./pages/Shops";
import Stores from "./pages/Stores";
import Card from "./pages/Card";
import Shipping from "./pages/Shipping";
import Details from "./pages/Details";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useDispatch } from "react-redux";
import { get_category } from "./store/reducers/homeSlice";
import CategoryShop from "./pages/CategoryShop";
import SearchProducts from "./pages/SearchProducts";
import Payment from "./pages/Payment";
import Dashboard from "./pages/Dashboard";
import ProtectUser from "./utils/ProtectUser";
import Index from "./components/dashboard/Index";
import Orders from "./components/dashboard/Orders";
import Settings from "./components/dashboard/Settings";
import ChangePassword from "./components/dashboard/ChangePassword";
import Wishlist from "./components/dashboard/Wishlist";
import OrderDetails from "./components/dashboard/OrderDetails";
import Chat from "./components/dashboard/Chat";
import ConfirmOrder from "./pages/ConfirmOrder";
import MockPay from "./pages/MockPay";
import ScrollToTop from "./components/ScrollToTop";
import Returns from "./components/dashboard/Returns";
import ReturnNew from "./components/dashboard/ReturnNew";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import Oferta from "./pages/Oferta";
import LegalPage from "./pages/LegalPage";
import SubscribeConfirm from "./pages/SubscribeConfirm";
import Preferences from "./pages/Preferences";
import Unsubscribe from "./pages/Unsubscribe";
import CookieBanner from "./components/CookieBanner";
import BottomNav from "./components/BottomNav";
import MobileMenu from "./components/MobileMenu";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(get_category());
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      {/* Ціль скіп-лінка «Перейти до змісту» (сторінки не мають власного <main>) */}
      <div id="main" tabIndex={-1} className="outline-none">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/card" element={<Card />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/products?" element={<CategoryShop />} />
        <Route path="/products/search?" element={<SearchProducts />} />
        <Route path="/product/details/:slug" element={<Details />} />
        <Route path="/order/confirm?" element={<ConfirmOrder />} />
        <Route path="/pay/mock" element={<MockPay />} />
        <Route path="/returns-policy" element={<ReturnsPolicy />} />
        <Route path="/oferta" element={<Oferta />} />
        <Route path="/delivery" element={<LegalPage slug="delivery" />} />
        <Route path="/returns" element={<LegalPage slug="returns" />} />
        <Route path="/warranty" element={<LegalPage slug="warranty" />} />
        <Route path="/privacy" element={<LegalPage slug="privacy" />} />
        <Route path="/cookies" element={<LegalPage slug="cookies" />} />
        <Route path="/subscribe/confirm" element={<SubscribeConfirm />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />

        <Route path="/dashboard" element={<ProtectUser />}>
          <Route path="" element={<Dashboard />}>
            <Route path="" element={<Index />} />
            <Route path="my-orders" element={<Orders />} />
            <Route path="settings" element={<Settings />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="my-wishlist" element={<Wishlist />} />
            <Route path="order/details/:orderId" element={<OrderDetails />} />
            <Route path="returns" element={<Returns />} />
            <Route path="returns/new/:orderId" element={<ReturnNew />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:sellerId" element={<Chat />} />
          </Route>
        </Route>
      </Routes>
      </div>
      <MobileMenu />
      <BottomNav />
      <CookieBanner />
    </>
  );
}

export default App;
