import React from "react";
import Home from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import Shops from "./pages/Shops";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shops" element={<Shops />} />
      </Routes>
    </>
  );
}

export default App;
