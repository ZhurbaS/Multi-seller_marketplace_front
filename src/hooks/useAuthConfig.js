import { useEffect, useState } from "react";
import api from "../api/api";

// Що доступно для входу: Google (якщо задано GOOGLE_CLIENT_ID на бекенді) і вхід за кодом
export default function useAuthConfig() {
  const [cfg, setCfg] = useState({ google: null, otp: true, loaded: false });
  useEffect(() => {
    let alive = true;
    api
      .get("/customer/auth-config")
      .then(({ data }) => alive && setCfg({ ...data, loaded: true }))
      .catch(() => alive && setCfg({ google: null, otp: true, loaded: true }));
    return () => {
      alive = false;
    };
  }, []);
  return cfg;
}
