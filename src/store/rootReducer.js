import authSlice from "./reducers/authSlice";
import cardSlice from "./reducers/cardSlice";
import homeSlice from "./reducers/homeSlice";
import orderSlice from "./reducers/orderSlice";

const rootReducer = {
  home: homeSlice,
  auth: authSlice,
  card: cardSlice,
  order: orderSlice,
};

export default rootReducer;
