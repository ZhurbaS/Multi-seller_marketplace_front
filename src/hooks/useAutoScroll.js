import { useCallback, useEffect, useRef, useState } from "react";

// Відповідальна автопрокрутка (WCAG 2.2.2): стартує сама, але
// — є кнопка паузи (toggle), — зупиняється при наведенні/фокусі/дотику,
// — не працює при prefers-reduced-motion, у фоновій вкладці та поза екраном.
// advance() — функція, що показує наступний слайд (з перемотуванням на початок).
export default function useAutoScroll(ref, advance, { interval = 6000, enabled = true } = {}) {
  const [userPaused, setUserPaused] = useState(false);
  const hold = useRef(false); // тимчасова пауза (hover/focus/touch)
  const visible = useRef(true);
  const adv = useRef(advance);
  useEffect(() => {
    adv.current = advance;
  });

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const active = enabled && !userPaused && !reduce;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => (hold.current = true);
    const off = () => (hold.current = false);
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    el.addEventListener("focusin", on);
    el.addEventListener("focusout", off);
    el.addEventListener("touchstart", on, { passive: true });
    el.addEventListener("touchend", () => setTimeout(off, 4000), { passive: true });
    let io;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.3 });
      io.observe(el);
    }
    return () => {
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
      el.removeEventListener("focusin", on);
      el.removeEventListener("focusout", off);
      el.removeEventListener("touchstart", on);
      io?.disconnect();
    };
  }, [ref, enabled]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (hold.current || !visible.current || document.hidden) return;
      adv.current();
    }, interval);
    return () => clearInterval(id);
  }, [active, interval]);

  const toggle = useCallback(() => setUserPaused((v) => !v), []);
  return { paused: userPaused, toggle, canPlay: !reduce };
}
