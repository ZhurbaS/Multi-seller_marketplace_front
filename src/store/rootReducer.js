import authSlice from "./reducers/authSlice";
import cardSlice from "./reducers/cardSlice";
import { chatSlice } from "./reducers/chatSlice";
import dashboardSlice from "./reducers/dashboardSlice";
import homeSlice from "./reducers/homeSlice";
import orderSlice from "./reducers/orderSlice";

const rootReducer = {
  home: homeSlice,
  auth: authSlice,
  card: cardSlice,
  order: orderSlice,
  dashboard: dashboardSlice,
  chat: chatSlice,
};

export default rootReducer;
