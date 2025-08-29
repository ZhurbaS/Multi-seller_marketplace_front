import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const get_category = createAsyncThunk(
  "product/get_category",
  async (_, { fulfillWithValue }) => {
    try {
      const { data } = await api.get("/home/get-categories");
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in homeSlice: get_category:", error);
      console.log(error.response);
    }
  }
);

export const get_products = createAsyncThunk(
  "product/get_products",
  async (_, { fulfillWithValue }) => {
    try {
      const { data } = await api.get("/home/get-products");
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in homeSlice: get_products:", error);
      console.log(error.response);
    }
  }
);

export const price_range_product = createAsyncThunk(
  "product/price_range_product",
  async (_, { fulfillWithValue }) => {
    try {
      const { data } = await api.get("/home/price-range-latest-product");
      console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in homeSlice: get_products:", error);
      console.log(error.response);
    }
  }
);

export const homeSlice = createSlice({
  name: "home",
  initialState: {
    categories: [],
    products: [],
    latest_product: [],
    topRated_product: [],
    discount_product: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(get_category.fulfilled, (state, { payload }) => {
        state.categories = payload;
      })
      .addCase(get_products.fulfilled, (state, { payload }) => {
        state.products = payload.products;
        state.latest_product = payload.latest_product;
        state.topRated_product = payload.topRated_product;
        state.discount_product = payload.discount_product;
      });
  },
});

export default homeSlice.reducer;
