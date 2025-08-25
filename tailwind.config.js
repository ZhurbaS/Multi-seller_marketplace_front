/* eslint-disable */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // додав клас .dark для темної теми
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
    // screens: {
    //   "2xs-max": { max: "21.3125rem" }, // до 340px включно
    //   "xs-max": { max: "30.0625rem" }, // до 481px включно
    //   "sm-max": { max: "36.0625rem" }, // до 577px включно
    //   "md-max": { max: "48.0625rem" }, // до 769px включно
    //   "mdlg-max": { max: "62rem" }, // до 992px включно
    //   "lg-max": { max: "67.5625rem" }, // до 1081px включно
    //   "xl-max": { max: "75.0625rem" }, // до 1201px включно
    // },
  },
  plugins: [],
};
