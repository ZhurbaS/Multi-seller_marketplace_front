import React from "react";
import Home from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import Shops from "./pages/Shops";
import Card from "./pages/Card";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/card" element={<Card />} />
      </Routes>
    </>
  );
}

export default App;
