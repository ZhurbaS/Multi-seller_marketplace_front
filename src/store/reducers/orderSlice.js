import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import toast from "react-hot-toast";
import { set_coupon_code } from "./cardSlice";

export const place_order = createAsyncThunk(
  "order/place_order",
  async ({ products, items, shippingInfo, couponCode, buyer, navigate }, { rejectWithValue, dispatch }) => {
    try {
      // Суму, знижки й доставку (її в замовленні немає) рахує сервер;
      // клієнт надсилає лише товари й адресу.
      const { data } = await api.post("/home/orders/place-order", {
        products,
        shippingInfo,
        couponCode: couponCode || "",
        buyer,
      });
      if (couponCode) dispatch(set_coupon_code("")); // купон використано
      navigate("/payment", {
        state: {
          price: data.price, // остаточна сума від сервера
          items,
          orderId: data.orderId,
          buyerKind: buyer?.kind || "individual", // «За рахунком» пропонуємо лише юрособам
        },
      });
    } catch (error) {
      console.error("💥 Error in orderSlice: place_order:", error);
      toast.error(
        error.response?.data?.error || "Не вдалося оформити замовлення"
      );
      return rejectWithValue(error.response?.data);
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
