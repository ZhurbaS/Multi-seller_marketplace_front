import React, { useState } from "react";
import { Range } from "react-range";
import { LuStar } from "react-icons/lu";

const CATEGORY_LIMIT = 8;

const Section = ({ title, badge, children }) => (
  <fieldset className="border-b border-(--line) py-4 first:pt-0 last:border-b-0">
    <legend className="contents">
      <span className="mb-2 flex items-center gap-2 text-base font-semibold text-(--ink)">
        {title}
        {badge ? (
          <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-(--brand-soft) px-1.5 text-xs font-semibold text-(--brand-ink)">
            {badge}
          </span>
        ) : null}
      </span>
    </legend>
    {children}
  </fieldset>
);

const optionRow =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-(--r-sm) px-1 text-[0.9375rem] text-(--ink) hover:bg-(--surface-2)";
const radioCls = "h-5 w-5 shrink-0 accent-(--brand)";

const Stars = ({ value }) => (
  <span className="flex items-center gap-0.5" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <LuStar
        key={i}
        size={18}
        className={i <= value ? "fill-current text-(--star)" : "text-(--line-strong)"}
      />
    ))}
  </span>
);

/* ---------- Категорія ---------- */
const CategoryFilter = ({ idp, categories, category, onChange }) => {
  const [all, setAll] = useState(false);
  const list =
    all || categories.length <= CATEGORY_LIMIT + 1
      ? categories
      : categories.slice(0, CATEGORY_LIMIT);
  const hiddenActive =
    !all && category && !list.some((c) => c.name === category);
  return (
    <Section title="Категорія" badge={category ? 1 : 0}>
      <div className="flex flex-col">
        <label className={optionRow}>
          <input
            type="radio"
            name={`${idp}-cat`}
            className={radioCls}
            checked={!category}
            onChange={() => onChange("")}
          />
          Усі категорії
        </label>
        {(hiddenActive ? [...list, { name: category, _id: "active" }] : list).map(
          (c) => (
            <label key={c._id || c.name} className={optionRow}>
              <input
                type="radio"
                name={`${idp}-cat`}
                className={radioCls}
                checked={category === c.name}
                onChange={() => onChange(c.name)}
              />
              <span className="min-w-0 break-words">{c.name}</span>
            </label>
          )
        )}
        {categories.length > CATEGORY_LIMIT + 1 && (
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            aria-expanded={all}
            className="mt-1 min-h-11 self-start rounded-(--r-sm) px-1 text-[0.9375rem] font-semibold text-(--brand-ink) hover:underline"
          >
            {all ? "Згорнути" : `Показати всі (${categories.length})`}
          </button>
        )}
      </div>
    </Section>
  );
};

/* ---------- Ціна: слайдер + поля від/до ---------- */
const PriceFilter = ({ idp, lo, hi, min, max, onApply }) => {
  const clamp = (v) => Math.min(hi, Math.max(lo, v));
  const [vals, setVals] = useState([clamp(min ?? lo), clamp(max ?? hi)]);
  const [txt, setTxt] = useState([String(min ?? lo), String(max ?? hi)]);
  const canSlide = hi > lo;

  const commit = (a, b) => {
    let x = Number(String(a).replace(",", "."));
    let y = Number(String(b).replace(",", "."));
    if (!Number.isFinite(x) || String(a).trim() === "") x = lo;
    if (!Number.isFinite(y) || String(b).trim() === "") y = hi;
    if (x > y) [x, y] = [y, x];
    x = Math.floor(x);
    y = Math.ceil(y);
    setTxt([String(x), String(y)]);
    if (canSlide) setVals([clamp(x), clamp(y)]);
    const nMin = x <= lo ? null : x;
    const nMax = y >= hi ? null : y;
    if (nMin !== (min ?? null) || nMax !== (max ?? null)) onApply(nMin, nMax);
  };

  const active = min != null || max != null;
  const inputCls =
    "h-12 w-full min-w-0 rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 text-(--ink) tabular-nums focus:border-(--brand) focus:outline-none";

  return (
    <Section title="Ціна, ₴" badge={active ? 1 : 0}>
      {canSlide && (
        <div className="px-3 pb-2 pt-4">
          <Range
            step={1}
            min={lo}
            max={hi}
            values={vals}
            onChange={(v) => {
              setVals(v);
              setTxt([String(v[0]), String(v[1])]);
            }}
            onFinalChange={(v) => commit(v[0], v[1])}
            renderTrack={({ props, children }) => {
              const { key, ...rest } = props;
              const left = ((vals[0] - lo) / (hi - lo)) * 100;
              const right = ((vals[1] - lo) / (hi - lo)) * 100;
              return (
                <div
                  key={key}
                  {...rest}
                  className="flex h-6 w-full items-center"
                >
                  <div className="relative h-1.5 w-full rounded-full bg-(--line)">
                    <div
                      className="absolute h-full rounded-full bg-(--brand)"
                      style={{ left: `${left}%`, width: `${right - left}%` }}
                    />
                  </div>
                  {children}
                </div>
              );
            }}
            renderThumb={({ props, index }) => {
              const { key, ...rest } = props;
              return (
                <div
                  key={key}
                  {...rest}
                  aria-label={index === 0 ? "Мінімальна ціна" : "Максимальна ціна"}
                  className="h-6 w-6 rounded-full border-2 border-(--surface) bg-(--brand) shadow-(--shadow-2) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)"
                />
              );
            }}
          />
        </div>
      )}
      <form
        className="mt-2 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          commit(txt[0], txt[1]);
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-(--ink-2)">
          Від
          <input
            id={`${idp}-pmin`}
            type="number"
            inputMode="numeric"
            min={lo}
            max={hi}
            value={txt[0]}
            onChange={(e) => setTxt([e.target.value, txt[1]])}
            onBlur={() => commit(txt[0], txt[1])}
            className={inputCls}
          />
        </label>
        <span className="pb-3 text-(--ink-2)" aria-hidden="true">
          –
        </span>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-(--ink-2)">
          До
          <input
            id={`${idp}-pmax`}
            type="number"
            inputMode="numeric"
            min={lo}
            max={hi}
            value={txt[1]}
            onChange={(e) => setTxt([txt[0], e.target.value])}
            onBlur={() => commit(txt[0], txt[1])}
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-(--r-md) border border-(--line-strong) bg-(--surface) px-3 font-semibold text-(--ink) hover:bg-(--surface-2)"
        >
          OK
        </button>
      </form>
    </Section>
  );
};

/* ---------- Рейтинг ---------- */
const RatingFilter = ({ idp, rating, onChange }) => (
  <Section title="Рейтинг" badge={rating ? 1 : 0}>
    <div className="flex flex-col">
      <label className={optionRow}>
        <input
          type="radio"
          name={`${idp}-rating`}
          className={radioCls}
          checked={!rating}
          onChange={() => onChange("")}
        />
        Будь-який
      </label>
      {[5, 4, 3, 2, 1].map((r) => (
        <label key={r} className={optionRow}>
          <input
            type="radio"
            name={`${idp}-rating`}
            className={radioCls}
            checked={Number(rating) === r}
            onChange={() => onChange(r)}
          />
          <Stars value={r} />
          <span className="text-sm text-(--ink-2)">
            {r === 5 ? "5" : `${r}–${r},9`}
          </span>
          <span className="sr-only">
            {r === 5 ? "Рейтинг 5" : `Рейтинг від ${r} до ${r},9`}
          </span>
        </label>
      ))}
    </div>
  </Section>
);

/**
 * Набір фільтрів каталогу — однаковий у бічній колонці (lg+) і в bottom sheet (мобільні).
 * Усі зміни застосовуються одразу (стан — у URL), тож лічильник товарів завжди актуальний.
 */
const CatalogFilters = ({
  idPrefix = "f",
  categories = [],
  category,
  onCategory,
  priceRange,
  min,
  max,
  onPrice,
  rating,
  onRating,
}) => {
  const lo = Math.floor(Number(priceRange?.low) || 0);
  const hi = Math.ceil(Number(priceRange?.high) || 0);
  return (
    <div className="flex flex-col">
      {categories.length > 0 && (
        <CategoryFilter
          idp={idPrefix}
          categories={categories}
          category={category}
          onChange={onCategory}
        />
      )}
      <PriceFilter
        key={`${lo}-${hi}-${min ?? ""}-${max ?? ""}`}
        idp={idPrefix}
        lo={lo}
        hi={Math.max(hi, lo)}
        min={min}
        max={max}
        onApply={onPrice}
      />
      <RatingFilter idp={idPrefix} rating={rating} onChange={onRating} />
    </div>
  );
};

export default CatalogFilters;
