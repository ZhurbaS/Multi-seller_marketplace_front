import React from "react";
import { LuCircleAlert, LuCheck } from "react-icons/lu";

// Спільні елементи форм оформлення замовлення (DESIGN_GUIDE §5): поле 48px, шрифт ≥16px,
// лейбл над полем, помилка під полем з іконкою (aria-describedby + aria-live).

export const inputCls =
  "w-full h-12 px-3 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) placeholder:text-(--ink-2)/70 outline-none focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/25 disabled:bg-(--surface-2) disabled:text-(--ink-2) disabled:cursor-not-allowed aria-[invalid=true]:border-(--danger)";

export const labelCls = "text-sm font-medium text-(--ink)";

// Текст помилки під полем; порожній рядок → нічого (контейнер aria-live лишається, щоб читачі екрана оголошували появу)
export const FieldError = ({ id, children }) => (
  <p id={id} aria-live="polite" className={children ? "flex items-start gap-1.5 text-sm text-(--danger)" : "sr-only"}>
    {children ? (
      <>
        <LuCircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{children}</span>
      </>
    ) : null}
  </p>
);

export const FieldHint = ({ id, children }) =>
  children ? (
    <p id={id} className="text-sm text-(--ink-2)">
      {children}
    </p>
  ) : null;

// Текстове поле з лейблом, підказкою й помилкою
export const TextField = ({ id, label, error, hint, className = "", ...rest }) => {
  const errId = `${id}-err`;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 w-full min-w-0 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={inputCls}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(" ")}
        {...rest}
      />
      <FieldHint id={hintId}>{hint}</FieldHint>
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
};

// Чекбокс 24px із зоною натискання ≥44px; підпис ≥14px
export const Checkbox = ({ checked, onChange, children, className = "", ...rest }) => (
  <label className={`flex items-start gap-3 min-h-11 py-2.5 cursor-pointer text-sm leading-5 text-(--ink) ${className}`}>
    <span className="relative inline-flex size-6 shrink-0 -my-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer absolute inset-0 size-6 m-0 appearance-none rounded-(--r-sm) border-2 border-(--line-strong) bg-(--surface) checked:bg-(--brand) checked:border-(--brand) cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)"
        {...rest}
      />
      <LuCheck aria-hidden="true" className="pointer-events-none relative m-auto size-4 text-(--on-brand) opacity-0 peer-checked:opacity-100" strokeWidth={3} />
    </span>
    <span className="pt-0.5">{children}</span>
  </label>
);

// Радіо-картка ≥56px (спосіб оплати, тип платника, канал рахунку, тип доставки)
export const RadioCard = ({ name, checked, onChange, title, sub, icon, className = "" }) => (
  <label
    className={`flex items-center gap-3 min-h-14 px-4 py-3 rounded-(--r-md) border cursor-pointer transition-colors ${
      checked ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand)" : "border-(--line) bg-(--surface) hover:border-(--line-strong)"
    } ${className}`}
  >
    <input type="radio" name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-(--brand) cursor-pointer" />
    {icon && (
      <span aria-hidden="true" className={`shrink-0 text-xl ${checked ? "text-(--brand-ink)" : "text-(--ink-2)"}`}>
        {icon}
      </span>
    )}
    <span className="flex flex-col min-w-0">
      <span className={`text-[15px] leading-5 text-(--ink) ${checked ? "font-semibold" : "font-medium"}`}>{title}</span>
      {sub && <span className="text-sm text-(--ink-2) leading-5">{sub}</span>}
    </span>
  </label>
);

// Чіп збереженого запису (отримувач / адреса / організація) з окремою кнопкою «✕» (≥44px)
export const SavedChip = ({ selected, onSelect, title, sub, onRemove, removeLabel }) => (
  <div
    className={`flex items-stretch min-h-14 rounded-(--r-md) border ${
      selected ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand)" : "border-(--line) bg-(--surface)"
    }`}
  >
    <button type="button" onClick={onSelect} aria-pressed={selected} className="flex-1 min-w-0 text-left px-3 py-2">
      <span className={`block text-sm text-(--ink) truncate ${selected ? "font-semibold" : "font-medium"}`}>{title}</span>
      {sub && <span className="block text-sm text-(--ink-2) truncate">{sub}</span>}
    </button>
    {onRemove && (
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="tap shrink-0 text-(--ink-2) hover:text-(--danger) rounded-(--r-md)"
      >
        <span aria-hidden="true">✕</span>
      </button>
    )}
  </div>
);
