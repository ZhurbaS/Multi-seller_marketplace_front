// Перехід до розділу сторінки товару (опис / характеристики / відгуки).
// 1) повідомляє секції (Accordion, SpecsTable), що їх треба розкрити;
// 2) після рендера плавно прокручує до секції (з урахуванням scroll-margin);
// 3) оновлює хеш без «стрибка» (посиланням можна поділитися).
export const SECTION_EVENT = "ts:open-section";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function jumpToSection(id, { expand = false, focus = false } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: { id, expand } }));
  // Два кадри: React встигає зняти hidden з панелі акордеона
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      if (focus) {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
      if (window.location.hash !== `#${id}`) {
        window.history.replaceState(window.history.state, "", `#${id}`);
      }
    })
  );
}
