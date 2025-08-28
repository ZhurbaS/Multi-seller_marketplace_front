import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const homeSlice = createSlice({
  name: "home",
  initialState: {
    categories: [],
  },
  reducers: {},
  extraReducers: (builder) => {},
});

export default homeSlice.reducer;
