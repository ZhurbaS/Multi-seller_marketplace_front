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

export const homeSlice = createSlice({
  name: "home",
  initialState: {
    categories: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(get_category.fulfilled, (state, { payload }) => {
      state.categories = payload;
    });
  },
});

export default homeSlice.reducer;
