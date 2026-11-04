// Тема магазину: зберігається в localStorage (для миттєвого застосування
// в index.html) і підтягується з бекенду за хешем.
// Бекенд повертає { hash, css } — css будується сервером лише з валідних hex.
import api from "../api/api";

const KEY = "ts-theme";

function apply(css) {
  let el = document.getElementById("ts-theme");
  if (!el) {
    el = document.createElement("style");
    el.id = "ts-theme";
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
  const m = /--header-bg:\s*(#[0-9a-fA-F]{6})/.exec(css || "");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && m) meta.setAttribute("content", m[1]);
}

export async function initTheme() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    saved = null;
  }
  try {
    const { data } = await api.get("/home/settings/theme", {
      params: saved?.hash ? { hash: saved.hash } : undefined,
    });
    if (data && typeof data.css === "string") {
      apply(data.css);
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ hash: data.hash, css: data.css }),
        );
      } catch {
        /* приватний режим */
      }
    }
  } catch {
    /* тема за замовчуванням з index.css */
  }
}
