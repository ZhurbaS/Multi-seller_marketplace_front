import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

// Публічні умови повернення (текст, строки) — для сторінки умов і підказок
export const get_return_policy = createAsyncThunk(
  "returns/get_return_policy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/home/returns/policy");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// Заявки покупця (адмін може вимкнути їх показ у кабінеті — тоді cabinetVisible=false)
export const get_my_returns = createAsyncThunk(
  "returns/get_my_returns",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/home/returns", { params });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const returnSlice = createSlice({
  name: "returns",
  initialState: {
    policy: null,
    requests: [],
    cabinetVisible: true,
    enabled: true,
    loaded: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(get_return_policy.fulfilled, (state, { payload }) => {
        state.policy = payload;
        state.cabinetVisible = payload.cabinetVisible;
        state.enabled = payload.enabled;
      })
      .addCase(get_my_returns.fulfilled, (state, { payload }) => {
        state.requests = payload.requests || [];
        state.cabinetVisible = payload.cabinetVisible !== false;
        state.enabled = payload.enabled !== false;
        state.loaded = true;
      });
  },
});

export default returnSlice.reducer;
