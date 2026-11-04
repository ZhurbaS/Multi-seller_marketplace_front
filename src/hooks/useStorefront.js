import { useEffect, useState } from "react";
import api from "../api/api";

// Налаштування вітрини (GET /home/storefront). Запит кешується в модульній змінній:
// один мережевий виклик на сесію, решта компонентів отримують ту саму відповідь.
// Помилка / відсутність відповіді → безпечні значення (compact=false, магазинів 0).
const DEFAULTS = {
  compact: false,
  mode: null,
  productCount: 0,
  catalogBgUrl: "",
  storesCount: 0,
  showStoresLink: false,
};

let cache = null; // нормалізована відповідь
let pending = null; // Promise поточного запиту

const normalize = (d) => {
  const data = d && typeof d === "object" ? d : {};
  return {
    compact: data.compact === true,
    mode: data.mode ?? null,
    productCount: Number(data.productCount) || 0,
    catalogBgUrl: typeof data.catalogBgUrl === "string" ? data.catalogBgUrl.trim() : "",
    storesCount: Number(data.storesCount) || 0,
    showStoresLink: data.showStoresLink === true,
  };
};

const load = () => {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = api
      .get("/home/storefront")
      .then(({ data }) => (cache = normalize(data)))
      .catch(() => (cache = { ...DEFAULTS }))
      .finally(() => {
        pending = null;
      });
  }
  return pending;
};

export default function useStorefront() {
  const [state, setState] = useState(() => cache || DEFAULTS);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    load().then((v) => {
      if (!alive) return;
      setState(v);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return {
    compact: state.compact,
    catalogBgUrl: state.catalogBgUrl,
    storesCount: state.storesCount,
    showStoresLink: state.showStoresLink,
    productCount: state.productCount,
    loading,
  };
}
