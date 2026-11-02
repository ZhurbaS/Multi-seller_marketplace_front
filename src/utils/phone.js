// Маска українського телефону: +38(067)-323-57-85
export const phoneDigits = (v) => String(v || "").replace(/\D/g, "");

export function maskPhone(value) {
  let d = phoneDigits(value);
  if (!d) return "";
  if (d === "3" || d === "38") return `+${d}`;
  if (d.startsWith("380")) d = d.slice(2);
  else if (d.startsWith("38") && d.length > 2) d = d.slice(2);
  if (d[0] !== "0") d = `0${d}`;
  d = d.slice(0, 10);
  let out = `+38(${d.slice(0, 3)}`;
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += `-${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

// onChange-обробник: коректно працює Backspace по символах маски (дужки, дефіси)
export function nextPhone(prev, next) {
  if (next.length < prev.length && phoneDigits(next) === phoneDigits(prev)) {
    return maskPhone(phoneDigits(prev).slice(0, -1));
  }
  return maskPhone(next);
}

export const isValidPhone = (v) => /^380\d{9}$/.test(phoneDigits(v)) || /^0\d{9}$/.test(phoneDigits(v));
