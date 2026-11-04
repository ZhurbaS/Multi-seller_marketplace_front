import React, { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LuCheck, LuChevronDown, LuX } from "react-icons/lu";

/*
 * Вибір категорії пошуку — select-only combobox (WAI-ARIA APG).
 * Desktop: тригер role="combobox" + випадаюча панель role="listbox" під ним;
 *   фокус лишається на тригері, активний пункт — через aria-activedescendant.
 * Мобільні (< lg): нижній лист (role="dialog" aria-modal) з тим самим listbox,
 *   Esc / backdrop / «✕» 44px, блокування скролу (ts-sheet-open), фокус у листі.
 * Клавіатура: ↑ ↓ Home End Enter Space Esc Tab + пошук за першими літерами.
 */

const SHEET_MQ = "(max-width: 1079.98px)";
const subscribeMq = (cb) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SHEET_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getMq = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(SHEET_MQ).matches : false);
const useSheetMode = () => useSyncExternalStore(subscribeMq, getMq, () => false);

const ALL_LABEL = "Усі категорії";

const CategorySelect = ({
  value = "",
  onChange,
  categories = [],
  label = "Категорія пошуку",
  variant = "inline", // inline — злитий із полем пошуку; chip — окрема кнопка (мобільний оверлей)
  className = "",
}) => {
  const uid = useId().replace(/:/g, "");
  const listId = `ts-cat-list-${uid}`;
  const labelId = `ts-cat-label-${uid}`;
  const optId = (i) => `ts-cat-opt-${uid}-${i}`;

  const sheet = useSheetMode();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typeRef = useRef({ str: "", t: 0 });

  const items = useMemo(() => {
    const seen = new Set();
    const list = [{ value: "", label: ALL_LABEL }];
    for (const c of categories) {
      const name = c?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      list.push({ value: name, label: name });
    }
    return list;
  }, [categories]);

  const selectedIndex = Math.max(0, items.findIndex((it) => it.value === value));
  const current = items[selectedIndex] || items[0];

  const openList = useCallback(
    (idx) => {
      setActive(typeof idx === "number" ? idx : selectedIndex);
      setOpen(true);
    },
    [selectedIndex]
  );

  const close = useCallback(
    (focusTrigger = true) => {
      setOpen(false);
      if (focusTrigger) triggerRef.current?.focus({ preventScroll: true });
    },
    []
  );

  const commit = useCallback(
    (idx, focusTrigger = true) => {
      const it = items[idx];
      if (it && it.value !== value) onChange?.(it.value);
      close(focusTrigger);
    },
    [items, value, onChange, close]
  );

  // Пошук за першими літерами
  const typeAhead = (ch) => {
    const now = Date.now();
    const st = typeRef.current;
    st.str = now - st.t > 600 ? ch : st.str + ch;
    st.t = now;
    const q = st.str.toLocaleLowerCase("uk");
    const start = st.str.length === 1 ? active + 1 : active;
    for (let k = 0; k < items.length; k++) {
      const i = (start + k) % items.length;
      if (items[i].label.toLocaleLowerCase("uk").startsWith(q)) return i;
    }
    return -1;
  };

  // Спільна обробка клавіш для відкритого списку
  const onListKey = (e) => {
    const last = items.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        return true;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) commit(active);
        else setActive((i) => Math.max(0, i - 1));
        return true;
      case "Home":
        e.preventDefault();
        setActive(0);
        return true;
      case "End":
        e.preventDefault();
        setActive(last);
        return true;
      case "PageDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 8));
        return true;
      case "PageUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 8));
        return true;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        return true;
      case "Escape":
        e.preventDefault();
        e.stopPropagation(); // не закривати батьківський оверлей
        close();
        return true;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const i = typeAhead(e.key);
          if (i >= 0) setActive(i);
          return true;
        }
        return false;
    }
  };

  const onTriggerKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList(e.key === "ArrowUp" && !e.altKey ? Math.max(0, selectedIndex - 1) : undefined);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        openList(e.key === "Home" ? 0 : items.length - 1);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = typeAhead(e.key);
        if (i >= 0) openList(i);
      }
      return;
    }
    if (sheet) return; // у режимі листа клавіші обробляє сам лист
    if (e.key === "Tab") {
      // APG: Tab вибирає активний пункт і переводить фокус далі
      commit(active, false);
      return;
    }
    onListKey(e);
  };

  // Desktop: клік поза компонентом закриває панель
  useEffect(() => {
    if (!open || sheet) return;
    const onDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, sheet]);

  // Прокрутка до активного пункту
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(optId(active));
    el?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  // Мобільний лист: блок скролу + фокус у списку + повернення фокуса
  useEffect(() => {
    if (!open || !sheet) return;
    const root = document.documentElement;
    const had = root.classList.contains("ts-sheet-open");
    if (!had) root.classList.add("ts-sheet-open");
    const trigger = triggerRef.current;
    requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    return () => {
      if (!had) root.classList.remove("ts-sheet-open");
      trigger?.focus({ preventScroll: true });
    };
  }, [open, sheet]);

  // Якщо перемкнули режим під час відкритого списку — закриваємо
  useEffect(() => {
    setOpen(false);
  }, [sheet]);

  const optionClass = (i, inSheet) => {
    const isSel = i === selectedIndex;
    const isAct = i === active;
    return [
      "flex w-full items-center gap-3 px-3 rounded-(--r-sm) cursor-pointer select-none text-left",
      inSheet ? "min-h-12 text-base" : "min-h-11 pointer-fine:min-h-10 text-[15px]",
      isAct ? "bg-(--brand-soft)" : "hover:bg-(--brand-soft)",
      isSel ? "text-(--brand-ink) font-semibold" : "text-(--ink)",
    ].join(" ");
  };

  const renderOptions = (inSheet) =>
    items.map((it, i) => {
      const isSel = i === selectedIndex;
      const opt = (
        <div
          key={it.value || "__all"}
          id={optId(i)}
          role="option"
          aria-selected={isSel}
          className={optionClass(i, inSheet)}
          onPointerMove={() => i !== active && setActive(i)}
          onMouseDown={(e) => e.preventDefault()} // фокус лишається на тригері/списку
          onClick={() => commit(i)}
        >
          <span className="flex-1 min-w-0 truncate">{it.label}</span>
          <LuCheck
            size={18}
            aria-hidden="true"
            className={`shrink-0 ${isSel ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      );
      if (i === 0 && items.length > 1) {
        return (
          <React.Fragment key="__all">
            {opt}
            <div role="presentation" className="my-1 mx-2 h-px bg-(--line)" />
          </React.Fragment>
        );
      }
      return opt;
    });

  const triggerClass =
    variant === "chip"
      ? "inline-flex max-w-full items-center gap-2 min-h-11 px-4 rounded-full border border-(--line) bg-(--surface) text-(--ink) text-[15px]"
      : "h-full w-full flex items-center gap-2 pl-4 pr-3 bg-transparent text-(--ink) font-medium text-[15px] hover:bg-(--surface-2) outline-0 focus-visible:bg-(--surface-2) focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--brand) rounded-l-[9px]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && !sheet ? optId(active) : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={triggerClass}
      >
        {variant === "chip" && <span className="text-(--ink-2) shrink-0">Категорія:</span>}
        <span className={`min-w-0 truncate ${variant === "chip" ? "font-semibold" : "flex-1 text-left"}`}>
          {current.label}
        </span>
        <LuChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-(--ink-2) motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Desktop: випадаюча панель */}
      {open && !sheet && (
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[max(100%,280px)] max-w-[min(380px,calc(100vw-32px))] max-h-[min(420px,60dvh)] overflow-y-auto overscroll-contain p-1.5 rounded-(--r-md) bg-(--surface) border border-(--line) shadow-(--shadow-3) text-(--ink)"
        >
          {renderOptions(false)}
        </div>
      )}

      {/* Мобільні: нижній лист */}
      {open &&
        sheet &&
        createPortal(
          <SheetPanel
            listId={listId}
            labelId={labelId}
            label={label}
            listRef={listRef}
            activeId={optId(active)}
            onKeyDown={onListKey}
            onClose={() => close()}
          >
            {renderOptions(true)}
          </SheetPanel>,
          document.body
        )}
    </div>
  );
};

const SheetPanel = ({ listId, labelId, label, listRef, activeId, onKeyDown, onClose, children }) => {
  const panelRef = useRef(null);
  const titleId = `${labelId}-t`;

  const onPanelKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab" && panelRef.current) {
      // фокус-пастка в межах листа (✕ і список)
      e.stopPropagation();
      const els = panelRef.current.querySelectorAll('button, [tabindex="0"]');
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" onKeyDown={onPanelKey}>
      <div aria-hidden="true" className="absolute inset-0 bg-(--overlay)" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex flex-col max-h-[85dvh] rounded-t-(--r-lg) bg-(--surface) text-(--ink) shadow-(--shadow-3) overscroll-contain"
        style={{ paddingBottom: "max(12px, var(--sab))" }}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-(--line)" />
        <div className="flex items-center justify-between gap-2 pl-4 pr-2 pt-1 pb-2 border-b border-(--line)">
          <h2 id={titleId} className="text-lg font-semibold">
            {label}
          </h2>
          <button type="button" onClick={onClose} aria-label="Закрити" className="tap rounded-(--r-md) text-(--ink)">
            <LuX size={24} aria-hidden="true" />
          </button>
        </div>
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-labelledby={titleId}
          aria-activedescendant={activeId}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Tab") return;
            onKeyDown(e);
          }}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 outline-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default CategorySelect;
