import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import store from "./store/index";
import { Auth0Provider } from "@auth0/auth0-react";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{ redirect_uri: window.location.origin }}
  >
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
  </Auth0Provider>
  // </StrictMode>
);
