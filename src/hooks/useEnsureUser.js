import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import api from "../api/api";
import { set_token } from "../store/reducers/authSlice";

// Гарантує сесію покупця: якщо не увійшов — тихо створює гостьову сесію (кошик працює без реєстрації;
// e-mail, ім'я й телефон гість указує при оформленні замовлення). → id користувача або null.
export default function useEnsureUser() {
  const { userInfo } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  return useCallback(async () => {
    if (userInfo?.id) return userInfo.id;
    try {
      const { data } = await api.post("/customer/guest-session");
      dispatch(set_token(data.token));
      return jwtDecode(data.token).id;
    } catch {
      toast.error("Не вдалося розпочати сесію. Спробуйте ще раз");
      return null;
    }
  }, [userInfo, dispatch]);
}
