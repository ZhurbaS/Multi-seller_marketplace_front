import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const add_to_card = createAsyncThunk(
  "card/add_to_card",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post("/home/product/add-to-card", info);
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: add_to_card:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

// Код купона зберігається лише на час сесії браузера (сума знижки завжди рахується на сервері).
const loadCoupon = () => {
  try {
    return sessionStorage.getItem("coupon_code") || "";
  } catch {
    return "";
  }
};
const saveCoupon = (code) => {
  try {
    if (code) sessionStorage.setItem("coupon_code", code);
    else sessionStorage.removeItem("coupon_code");
  } catch {
    /* sessionStorage недоступний — купон діятиме до перезавантаження */
  }
};

export const get_card_products = createAsyncThunk(
  "card/get_card_products",
  async (userId, { rejectWithValue, fulfillWithValue, getState }) => {
    try {
      if (!userId || typeof userId !== "string") {
        throw new Error("Невірний userId передано до get_card_products...");
      }

      const couponCode = getState().card.coupon_code;
      const { data } = await api.get(
        `/home/product/get-card-product/${userId}`,
        couponCode ? { params: { coupon: couponCode } } : undefined
      );
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: get_card_products:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const delete_card_product = createAsyncThunk(
  "card/delete_card_product",
  async (card_id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.delete(
        `/home/product/delete-card-product/${card_id}`
      );
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: delete_card_product:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const quantity_inc = createAsyncThunk(
  "card/quantity_inc",
  async (card_id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put(`/home/product/quantity-inc/${card_id}`);
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: quantity_inc:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const quantity_dec = createAsyncThunk(
  "card/quantity_dec",
  async (card_id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.put(`/home/product/quantity-dec/${card_id}`);
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: quantity_dec:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const add_to_wishlist = createAsyncThunk(
  "wishlist/add_to_wishlist",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post(`/home/product/add-to-wishlist`, info);
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: add_to_wishlist:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const get_wishlist_products = createAsyncThunk(
  "wishlist/get_wishlist_products",
  async (userId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get(
        `/home/product/get-wishlist-products/${userId}`
      );
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: get_wishlist_products:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const remove_wishlist = createAsyncThunk(
  "wishlist/remove_wishlist",
  async (wishlistItemId, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.delete(
        `/home/product/remove-wishlist-product/${wishlistItemId}`
      );
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in cardSlice: remove_wishlist:", error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const cardSlice = createSlice({
  name: "card",
  initialState: {
    card_products: [],
    card_product_count: 0,
    wishlist_count: 0,
    wishlist: [],
    price: 0,
    errorMessage: "",
    successMessage: "",
    // Доставка в ціну не входить — її оплачує покупець перевізнику при отриманні.
    order_discount: { percent: 0, amount: 0 },
    total: 0,
    coupon_code: loadCoupon(),
    coupon: null, // { code, status: applied|not_applied|invalid, discount, message }
    coupon_discount: 0,
    next_order_discount: null,
    cart_ttl_days: 30,
    outofstock_products: [],
    buy_product_item: 0,
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
      state.successMessage = "";
    },
    set_coupon_code: (state, { payload }) => {
      state.coupon_code = String(payload || "").trim().toUpperCase();
      saveCoupon(state.coupon_code);
      if (!state.coupon_code) {
        state.coupon = null;
        state.coupon_discount = 0;
      }
    },
    reset_count: (state, _) => {
      state.card_product_count = 0;
      state.wishlist_count = 0;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(add_to_card.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося додати до кошика";
      })
      .addCase(add_to_card.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
        state.card_product_count = state.card_product_count + 1;
      })
      .addCase(get_card_products.fulfilled, (state, { payload }) => {
        state.card_products = payload.card_products;
        state.price = payload.price;
        state.card_product_count = payload.card_product_count;
        state.order_discount = payload.order_discount || { percent: 0, amount: 0 };
        state.total = payload.total ?? payload.price;
        state.coupon = payload.coupon || null;
        state.coupon_discount = payload.coupon_discount || 0;
        // Невідомий/недійсний купон не тримаємо в сесії
        if (payload.coupon?.status === "invalid") {
          state.coupon_code = "";
          saveCoupon("");
        }
        state.next_order_discount = payload.next_order_discount || null;
        state.cart_ttl_days = payload.cart_ttl_days || 30;
        state.outofstock_products = payload.outOfStockProduct;
        state.buy_product_item = payload.buy_product_item;
      })
      .addCase(get_card_products.rejected, (state, { payload }) => {
        if (payload?.error) state.errorMessage = payload.error;
      })
      .addCase(delete_card_product.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
      })
      .addCase(quantity_inc.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
      })
      .addCase(quantity_inc.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося змінити кількість";
      })
      .addCase(quantity_dec.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
      })
      .addCase(quantity_dec.rejected, (state, { payload }) => {
        state.errorMessage = payload?.error || "Не вдалося змінити кількість";
      })
      .addCase(add_to_wishlist.rejected, (state, { payload }) => {
        state.errorMessage = payload.error;
      })
      .addCase(add_to_wishlist.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
        state.wishlist_count =
          state.wishlist_count > 0 ? state.wishlist_count + 1 : 1;
      })
      .addCase(get_wishlist_products.fulfilled, (state, { payload }) => {
        state.wishlist = payload.wishlistProducts;
        state.wishlist_count = payload.wishlistCount;
      })
      .addCase(remove_wishlist.fulfilled, (state, { payload }) => {
        state.successMessage = payload.message;
        state.wishlist = state.wishlist.filter(
          (p) => p._id !== payload.wishlistId
        );
        state.wishlist_count = state.wishlist_count - 1;
      });
  },
});

export const { messageClear, reset_count, set_coupon_code } = cardSlice.actions;
export default cardSlice.reducer;
