import React, { useEffect, useId, useRef, useState } from "react";
import { LuLoaderCircle } from "react-icons/lu";
import { inputCls, labelCls, FieldError, FieldHint } from "./CheckoutUi";

// Комбобокс з підказками (Нова пошта). fetcher(q) → Promise<items>; item.title — підпис у списку,
// item.address / item.area — другий рядок. Вибір пункту викликає onPick(item); ручне введення — onText(text) (скидає вибір у батька).
// Доступність: role=combobox/listbox, ↑/↓/Enter/Esc, aria-activedescendant.
const Autocomplete = ({
  id,
  label,
  value,
  onText,
  onPick,
  fetcher,
  minChars = 2,
  placeholder,
  disabled,
  loadOnFocus = false,
  emptyText = "Нічого не знайдено",
  error,
  hint,
  onBlur,
  autoComplete = "off",
  debounce = 250,
}) => {
  const autoId = useId();
  const baseId = id || `ac-${autoId.replace(/:/g, "")}`;
  const listId = `${baseId}-list`;
  const errId = `${baseId}-err`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef(null);
  const seq = useRef(0);

  const q = (value || "").trim();
  const enough = loadOnFocus || q.length >= minChars;

  // дебаунс запиту підказок
  useEffect(() => {
    if (!open || disabled) return;
    if (!enough) {
      setItems([]);
      return;
    }
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetcher(q);
        if (my === seq.current) {
          setItems(r || []);
          setActive(-1);
        }
      } catch {
        if (my === seq.current) setItems([]);
      } finally {
        if (my === seq.current) setLoading(false);
      }
    }, debounce);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open, disabled]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  const showList = open && !disabled && enough;

  const pick = (it) => {
    onPick(it);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => (items.length ? (a + 1) % items.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (items.length ? (a <= 0 ? items.length - 1 : a - 1) : -1));
    } else if (e.key === "Enter") {
      if (showList && active >= 0 && items[active]) {
        e.preventDefault();
        pick(items[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  // тримаємо активний пункт у видимій області списку
  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, baseId]);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0 relative" ref={box}>
      <label htmlFor={baseId} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <input
          id={baseId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${baseId}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errId].filter(Boolean).join(" ")}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          enterKeyHint="search"
          onChange={(e) => {
            onText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`${inputCls} pr-10`}
        />
        {loading && showList && (
          <LuLoaderCircle aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-(--ink-2) motion-safe:animate-spin" />
        )}
        <ul
          id={listId}
          role="listbox"
          aria-label={label?.replace(/\s*\*$/, "")}
          hidden={!showList}
          className="absolute z-30 top-full mt-1 left-0 right-0 max-h-72 overflow-auto overscroll-contain bg-(--surface) text-(--ink) border border-(--line) rounded-(--r-md) shadow-(--shadow-3) py-1"
        >
          {loading && items.length === 0 && <li className="px-4 py-3 text-sm text-(--ink-2)">Пошук...</li>}
          {!loading && items.length === 0 && (
            <li className="px-4 py-3 text-sm text-(--ink-2)" role="presentation">
              {emptyText}
            </li>
          )}
          {items.map((it, i) => {
            const sub = it.address && it.address !== it.title ? it.address : it.area && !String(it.title || "").includes(it.area) ? `${it.area} обл.` : "";
            return (
              <li
                key={it.ref || i}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(it);
                }}
                onMouseEnter={() => setActive(i)}
                className={`px-4 py-2.5 min-h-12 flex flex-col justify-center cursor-pointer text-[15px] leading-5 ${i === active ? "bg-(--brand-soft)" : ""}`}
              >
                <span>{it.title}</span>
                {sub && <span className="text-sm text-(--ink-2)">{sub}</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <FieldHint id={hintId}>{hint}</FieldHint>
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
};

export default Autocomplete;
