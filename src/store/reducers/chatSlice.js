import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const add_friend = createAsyncThunk(
  "chat/add_friend",
  async (info, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post("/chat/customer/add-customer-friend", info);
      
      //   console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      console.error("💥 Error in chatSlice: add_friend:", error);
      //   console.log(error.response);
      return rejectWithValue(error.response.data);
    }
  }
);

export const chatSlice = createSlice({
  name: "chat",
  initialState: {
    my_friends: [],
    fd_messages: [],
    currentFd: "",
    errorMessage: "",
    successMessage: "",
  },
  reducers: {
    messageClear: (state, _) => {
      state.errorMessage = "";
      state.successMessage = "";
    },
  },
  extraReducers: (builder) => {
    // builder
    //   .addCase(customer_login.fulfilled, (state, { payload }) => {
    //     const userInfo = decodeToken(payload.token);
    //     state.loader = false;
    //     state.successMessage = payload.message;
    //     state.userInfo = userInfo;
    //   });
  },
});

export const { messageClear } = chatSlice.actions;
export default chatSlice.reducer;
