import { Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import "./index.css";
import { initTheme } from "./utils/theme";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import store from "./store/index";

// Тости: на мобільних — зверху по центру (не перекривають нижню панель), від lg — справа знизу
const MOBILE_MQ = "(max-width: 1079.98px)";
// eslint-disable-next-line react-refresh/only-export-components -- точка входу, HMR не потрібен
function AppToaster() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return (
    <Toaster
      position={mobile ? "top-center" : "bottom-right"}
      containerStyle={mobile ? { top: "calc(var(--sat) + 8px)" } : undefined}
      toastOptions={{
        style: {
          background: "var(--ink)",
          color: "var(--surface)",
          borderRadius: "var(--r-md)",
        },
      }}
    />
  );
}

initTheme();
createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <Suspense fallback={<div>Завантаження...</div>}>
        <App />
        <AppToaster />
      </Suspense>
    </BrowserRouter>
  </Provider>
  // </StrictMode>
);
