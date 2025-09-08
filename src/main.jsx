import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import store from "./store/index";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <Suspense fallback={<div>Завантаження...</div>}>
        <App />
        <Toaster
          toastOptions={{
            position: "bottom-right",
            style: {
              background: "var(--bg-toaster)",
              color: "var(--color-toaster)",
            },
          }}
        />
      </Suspense>
    </BrowserRouter>
  </Provider>
  // </StrictMode>
);
