// import axios from "axios";

// const local = import.meta.env.VITE_LOCAL;
// const production = import.meta.env.VITE_PRODUCTION;

// let api_url = "";
// let mode = import.meta.env.VITE_MODE;

// if (mode === "pro") {
//   api_url = production;
// } else {
//   api_url = local;
// }

// const api = axios.create({
//   baseURL: `${api_url}/api`,
// });

// export default api;

import axios from "axios";

// API URL
const localApi = import.meta.env.VITE_LOCAL;
const productionApi = import.meta.env.VITE_PRODUCTION;

// Frontend URL
const localFrontend = import.meta.env.VITE_LOCAL_FRONT;
const productionFrontend = import.meta.env.VITE_PRODUCTION_FRONT;

// Environment mode
const mode = import.meta.env.VITE_MODE || "dev";

// Вибір потрібних URL
const apiBaseUrl = mode === "pro" ? productionApi : localApi;
const frontendBaseUrl = mode === "pro" ? productionFrontend : localFrontend;

// Axios інстанс
const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
});

// Функції для використання
export const getApiUrl = (path = "") => `${apiBaseUrl}/api${path}`;
export const getFrontendUrl = (path = "") => `${frontendBaseUrl}${path}`;

// Експортуємо за замовчуванням
export default api;
