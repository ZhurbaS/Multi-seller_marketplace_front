import React, { useEffect, useRef, useState } from "react";

// Поле з підказками (Нова пошта). fetcher(q) → Promise<items>; item.title — підпис у списку.
// Вибір пункту викликає onPick(item); ручне введення тексту — onText(text) (скидає вибір у батька).
const Autocomplete = ({ label, value, onText, onPick, fetcher, minChars = 2, placeholder, disabled, loadOnFocus = false, emptyText = "Нічого не знайдено" }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);
  const seq = useRef(0);

  // дебаунс запиту підказок
  useEffect(() => {
    if (!open || disabled) return;
    const q = value || "";
    if (!loadOnFocus && q.trim().length < minChars) {
      setItems([]);
      return;
    }
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetcher(q.trim());
        if (my === seq.current) setItems(r || []);
      } catch {
        if (my === seq.current) setItems([]);
      } finally {
        if (my === seq.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open, disabled]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="flex flex-col gap-1 w-full relative" ref={box}>
      <label className="text-sm">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full px-3 py-2 border border-[var(--border-ship)] outline-none focus:border-[var(--border-ship-foc)] rounded-md bg-transparent disabled:opacity-50"
      />
      {open && !disabled && (loadOnFocus || (value || "").trim().length >= minChars) && (
        <ul className="absolute z-20 top-full left-0 right-0 mt-1 max-h-64 overflow-auto bg-white text-black border border-slate-300 rounded-md shadow-lg">
          {loading && <li className="px-3 py-2 text-sm opacity-60">Пошук...</li>}
          {!loading && items.length === 0 && <li className="px-3 py-2 text-sm opacity-60">{emptyText}</li>}
          {items.map((it) => (
            <li
              key={it.ref}
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(it);
                setOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
            >
              {it.title}
              {it.address && it.address !== it.title && <div className="text-xs opacity-60">{it.address}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
