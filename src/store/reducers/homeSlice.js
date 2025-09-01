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
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in homeSlice: price_range_product:", error);
      console.log(error.response);
    }
  }
);

export const query_products = createAsyncThunk(
  "product/query_products",
  async (query = {}, { fulfillWithValue, rejectWithValue }) => {
    try {
      const { category, rating, low, high, sortPrice, pageNumber } = query;
      const { data } = await api.get(
        `/home/query-products?category=${category ?? ""}&rating=${
          rating ?? ""
        }&lowPrice=${low ?? 0}&highPrice=${high ?? 999999}&sortPrice=${
          sortPrice ?? ""
        }&pageNumber=${pageNumber ?? 1}`
      );
      console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in homeSlice: query_products:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const homeSlice = createSlice({
  name: "home",
  initialState: {
    categories: [],
    products: [],
    totalProduct: 0,
    perPage: 3,
    latest_product: [],
    topRated_product: [],
    discount_product: [],
    priceRange: {
      low: 0,
      high: 1000,
    },
    loading: false,
    error: null,
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
      })
      .addCase(price_range_product.fulfilled, (state, { payload }) => {
        state.latest_product = payload.latest_product;
        state.priceRange = payload.priceRange;
      })
      .addCase(query_products.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(query_products.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.products = payload.products;
        state.totalProduct = payload.totalProduct;
        state.perPage = payload.perPage;
      })
      .addCase(query_products.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Не вдалося знайти товари за фільтром";
      });
  },
});

export default homeSlice.reducer;
