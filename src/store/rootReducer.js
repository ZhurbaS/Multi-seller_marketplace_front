import authSlice from "./reducers/authSlice";
import homeSlice from "./reducers/homeSlice";

const rootReducer = {
  home: homeSlice,
  auth: authSlice,
};

export default rootReducer;
