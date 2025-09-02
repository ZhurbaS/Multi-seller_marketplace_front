import authSlice from "./reducers/authSlice";
import cardSlice from "./reducers/cardSlice";
import homeSlice from "./reducers/homeSlice";

const rootReducer = {
  home: homeSlice,
  auth: authSlice,
  card: cardSlice,
};

export default rootReducer;
