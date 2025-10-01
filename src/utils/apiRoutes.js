// utils/apiRoutes.js
export const getApiUrl = (path = "") => {
  const baseUrl =
    import.meta.env.VITE_MODE === "pro"
      ? import.meta.env.VITE_PRODUCTION
      : import.meta.env.VITE_LOCAL;

  return `${baseUrl}${path}`;
};
