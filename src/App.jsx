import React from "react";
import Home from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import Shops from "./pages/Shops";
import Card from "./pages/Card";
import Shipping from "./pages/Shipping";
import Details from "./pages/Details";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/card" element={<Card />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/product/details/:slug" element={<Details />} />
      </Routes>
    </>
  );
}

export default App;
