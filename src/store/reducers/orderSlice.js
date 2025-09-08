import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const place_order = createAsyncThunk(
  "order/place_order",
  async ({
    price,
    products,
    shipping_fee,
    items,
    shippingInfo,
    userId,
    navigate,
  }) => {
    try {
      const { data } = await api.post("/home/oders/place-order", {
        price,
        products,
        shipping_fee,
        items,
        shippingInfo,
        userId,
        navigate,
      });
      navigate("/payment", {
        state: {
          price: price + shipping_fee,
          items,
          orderId: data.orderId,
        },
      });
      //   console.log(data);
    } catch (error) {
      console.error("💥 Error in orderSlice: place_order:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const get_orders = createAsyncThunk(
  "order/get_orders",
  async ({ customerId, status }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(
        `/home/customer/get-orders/${customerId}/${status}`
      );

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in orderSlice: get_orders:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const get_orders_details = createAsyncThunk(
  "order/get_orders_details",
  async (orderId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(
        `/home/customer/get-orders-details/${orderId}`
      );

      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in orderSlice: get_orders_details:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const orderSlice = createSlice({
  name: "order",
  initialState: {
    myOrders: [],
    myOrder: {},
    errorMessage: "",
    successMessage: "",
    loading: false,
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
      state.successMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(get_orders.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.myOrders = payload.orders;
        state.errorMessage = "";
      })
      // .addCase(get_orders.pending, (state) => {
      //   state.loading = true;
      // })
      // .addCase(get_orders.rejected, (state, { payload }) => {
      //   state.loading = false;
      //   payload?.error || payload?.message || "Something went wrong";
      // })
      .addCase(get_orders_details.fulfilled, (state, { payload }) => {
        // state.loading = false;
        state.myOrder = payload.order;
        // state.errorMessage = "";
      });
  },
});

export const { messageClear } = orderSlice.actions;
export default orderSlice.reducer;
