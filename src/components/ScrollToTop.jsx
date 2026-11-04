import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router не скидає прокрутку при навігації — повертаємось угору
// на кожній зміні маршруту (миттєво, попри глобальний scroll-behavior: smooth).
// Якщо в URL є #якір — прокручуємо до нього.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
