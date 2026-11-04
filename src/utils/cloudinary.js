// Cloudinary-трансформації для зображень: cld(url, w) вставляє `f_auto,q_auto,w_<w>`
// одразу після `/upload/` (лише для res.cloudinary.com). Інші URL — без змін.
// Якщо в URL уже є трансформація з w_ — не дублюємо.
const UPLOAD = "/upload/";

export function cld(url, w) {
  if (!url || typeof url !== "string") return url || "";
  url = url.replace(/^http:\/\/res\.cloudinary\.com\//i, "https://res.cloudinary.com/");
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(url)) return url;
  const i = url.indexOf(UPLOAD);
  if (i === -1) return url;
  const rest = url.slice(i + UPLOAD.length);
  const firstSeg = rest.split("/")[0] || "";
  if (/(^|,)w_\d+/.test(firstSeg)) return url;
  const width = Math.max(1, Math.round(Number(w) || 0));
  const tr = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return `${url.slice(0, i + UPLOAD.length)}${tr}/${rest}`;
}

// srcSet для набору ширин; для не-Cloudinary URL повертає "" (браузер візьме src).
export function cldSrcSet(url, widths = [480, 800, 1200, 1600]) {
  if (!url || !/^https?:\/\/res\.cloudinary\.com\//i.test(url) || !url.includes(UPLOAD)) return "";
  return widths.map((w) => `${cld(url, w)} ${w}w`).join(", ");
}

export default cld;
