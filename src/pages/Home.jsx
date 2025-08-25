import React from "react";
import Header from "../components/Header";
import Banner from "../components/Banner";
import Categories from "../components/Categories";
import FeatureProducts from "../components/products/FeatureProducts";

const Home = () => {
  return (
    <div className="w-full">
      <Header />
      <Banner />
      <Categories />
      <div className="py-[45px]">
        <FeatureProducts />
      </div>
    </div>
  );
};

export default Home;
