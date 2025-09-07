import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const get_dashboard_index_data = createAsyncThunk(
  "dashboard/get_dashboard_index_data",
  async (userId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(
        `/home/customer/get-dashboard-data/${userId}`
      );

      //   console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error(
        "💥 Error in dashboardSlice: get_dashboard_index_data:",
        error
      );
      return rejectWithValue(error.response.data);
    }
  }
);

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    recentOrders: [],
    errorMessage: "",
    successMessage: "",
    totalOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
      state.successMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      get_dashboard_index_data.fulfilled,
      (state, { payload }) => {
        state.recentOrders = payload.recentOrders;
        state.totalOrders = payload.totalOrders;
        state.pendingOrders = payload.pendingOrders;
        state.cancelledOrders = payload.cancelledOrders;
      }
    );
  },
});

export const { messageClear } = dashboardSlice.actions;
export default dashboardSlice.reducer;
