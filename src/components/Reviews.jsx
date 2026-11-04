import React, { useEffect, useId, useRef, useState } from "react";
import Rating from "./Rating";
import RatingTemp from "./RatingTemp";
import { Link } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { LuCircleAlert } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux";
import {
  can_review,
  customer_review,
  get_reviews,
  messageClear,
  product_details,
} from "../store/reducers/homeSlice";
import toast from "react-hot-toast";
import { reviewsWord } from "../utils/pluralize";

const STAR_LABELS = ["Погано", "Так собі", "Нормально", "Добре", "Відмінно"];

// Вибір оцінки: radiogroup, кожна зірка — зона 44×44
const StarPicker = ({ value, onChange, invalid, describedBy, labelId }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || Number(value) || 0;

  const onKeyDown = (e) => {
    const v = Number(value) || 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, v + 1));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, v - 1));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(0)}
      className="flex items-center gap-0"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const checked = Number(value) === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${n} з 5 — ${STAR_LABELS[n - 1]}`}
            tabIndex={checked || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="tap rounded-(--r-sm) text-[1.75rem] text-(--star)"
          >
            {n <= shown ? (
              <FaStar aria-hidden="true" />
            ) : (
              <FaRegStar aria-hidden="true" className="text-(--line-strong)" />
            )}
          </button>
        );
      })}
      <span className="ml-2 text-sm text-(--ink-2) min-w-[6rem]" aria-hidden="true">
        {shown ? STAR_LABELS[shown - 1] : ""}
      </span>
    </div>
  );
};

const FieldError = ({ id, children }) =>
  children ? (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-(--danger)">
      <LuCircleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  ) : null;

const Reviews = ({ product }) => {
  const dispatch = useDispatch();
  const uid = useId();

  const { userInfo } = useSelector((state) => state.auth);
  const {
    successMessage,
    errorMessage,
    reviews,
    totalReview,
    rating_review,
    canReview,
    existingReview,
  } = useSelector((state) => state.home);

  const [rat, setRat] = useState(""); // rating
  const [re, setRe] = useState(""); // review
  const [errors, setErrors] = useState({});

  // Список із «Показати ще»: накопичуємо сторінки локально
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedPage = useRef(1);

  const review_submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!rat) next.rating = "Оберіть оцінку від 1 до 5 зірок";
    if (!re.trim()) next.review = "Напишіть кілька слів про товар";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(next.rating ? `${uid}-stars` : `${uid}-text`)?.focus?.();
      return;
    }
    const obj = {
      review: re,
      rating: rat,
      productId: product._id,
    };

    dispatch(customer_review(obj));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(product_details(product.slug));
      dispatch(can_review(product._id));
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch, product._id, product.slug]);

  // Новий товар (або оновлення після відгуку) — з першої сторінки
  useEffect(() => {
    if (product._id) {
      loadedPage.current = 1;
      setPage(1);
      dispatch(get_reviews({ productId: product._id, pageNumber: 1 }));
    }
  }, [product, dispatch]);

  useEffect(() => {
    setLoadingMore(false);
    setItems((prev) => {
      if (loadedPage.current === 1) return reviews || [];
      const known = new Set(prev.map((r) => r._id));
      return [...prev, ...(reviews || []).filter((r) => !known.has(r._id))];
    });
  }, [reviews]);

  const showMore = () => {
    const next = page + 1;
    loadedPage.current = next;
    setPage(next);
    setLoadingMore(true);
    dispatch(get_reviews({ productId: product._id, pageNumber: next }));
  };

  useEffect(() => {
    if (userInfo && product._id) {
      dispatch(can_review(product._id));
    }
  }, [userInfo, product._id, dispatch]);

  // Prefill the form with the customer's existing (pending/approved) review
  // so resubmitting reads as "edit my review", not "write a new one".
  useEffect(() => {
    if (existingReview) {
      setRat(existingReview.rating);
      setRe(existingReview.review);
    }
  }, [existingReview]);

  const hasMore = items.length < totalReview;
  const formBoxId = `${uid}-form`;

  // «Написати відгук» з підсумку: до форми (або до підказки про вхід)
  const goToForm = () => {
    const box = document.getElementById(formBoxId);
    if (!box) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    const target = box.querySelector('[role="radio"][tabindex="0"], a, textarea') || box;
    if (target === box && !box.hasAttribute("tabindex")) box.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  const ratingText = Number(product.rating || 0)
    .toFixed(1)
    .replace(".", ",");

  return (
    <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-10 xl:items-start">
      {/* Підсумок і розподіл оцінок (від xl — липка колонка зліва) */}
      <div className="flex flex-col sm:flex-row xl:flex-col gap-6 sm:gap-10 xl:gap-5 xl:sticky xl:top-[calc(var(--header-h)+var(--secnav-h,56px)+16px)] xl:rounded-(--r-lg) xl:border xl:border-(--line) xl:p-5">
        <div className="flex flex-col gap-1">
          <p className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-(--ink) tabular-nums">
              {product.rating ? ratingText : "—"}
            </span>
            <span className="text-2xl font-semibold text-(--ink-2)">/5</span>
          </p>
          <div className="flex text-2xl" aria-hidden="true">
            <Rating ratings={product.rating} />
          </div>
          <p className="text-sm text-(--ink-2)">
            {totalReview} {reviewsWord(totalReview)}
          </p>
        </div>

        <ul className="flex flex-col gap-2 flex-1 max-w-md xl:max-w-none" aria-label="Розподіл оцінок">
          {[5, 4, 3, 2, 1].map((stars, i) => {
            const sum = rating_review[i]?.sum || 0;
            const pct = totalReview > 0 ? Math.floor((100 * sum) / totalReview) : 0;
            return (
              <li key={stars} className="flex items-center gap-3 text-sm">
                <span className="flex text-sm shrink-0" aria-hidden="true">
                  <RatingTemp rating={stars} label={false} />
                </span>
                <span className="sr-only">{stars} зірок:</span>
                <span className="h-2.5 flex-1 rounded-full bg-(--surface-2) overflow-hidden" aria-hidden="true">
                  <span className="block h-full rounded-full bg-(--star)" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 text-right text-(--ink-2) tabular-nums">{sum}</span>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={goToForm}
          className="hidden xl:inline-flex min-h-12 px-5 items-center justify-center rounded-(--r-md) border border-(--brand) bg-(--surface) text-(--brand-ink) font-semibold hover:bg-(--brand-soft)"
        >
          {existingReview ? "Мій відгук" : "Написати відгук"}
        </button>
      </div>

      <div className="min-w-0 flex flex-col gap-8">
      {/* Список відгуків */}
      <div>
        <h3 className="text-lg font-bold text-(--ink) mb-4">
          Відгуки покупців ({totalReview})
        </h3>
        {items.length === 0 ? (
          <p className="text-(--ink-2)">Ще немає відгуків. Будьте першим!</p>
        ) : (
          <ul className="flex flex-col divide-y divide-(--line)">
            {items.map((r, i) => (
              <li key={r._id || i} className="py-4 first:pt-0 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="size-9 shrink-0 rounded-full bg-(--brand-soft) text-(--brand-ink) font-semibold inline-flex items-center justify-center"
                    >
                      {(r.name || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold text-(--ink) truncate">{r.name}</span>
                  </div>
                  <time
                    className="text-sm text-(--ink-2)"
                    dateTime={r.createdAt || undefined}
                  >
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : r.date}
                  </time>
                </div>
                <span className="flex text-base">
                  <RatingTemp rating={r.rating} />
                </span>
                <p className="text-(--ink) max-w-[70ch] whitespace-pre-line break-words">
                  {r.review}
                </p>
                {Array.isArray(r.images) && r.images.length > 0 && (
                  <ul className="grid grid-cols-4 xs:grid-cols-5 sm:flex sm:flex-wrap gap-2">
                    {r.images.map((src, k) => (
                      <li key={k}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-square sm:size-20 rounded-(--r-md) overflow-hidden border border-(--line) bg-(--surface-2)"
                        >
                          <img
                            src={src}
                            alt={`Фото до відгуку ${k + 1}`}
                            loading="lazy"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={showMore}
            disabled={loadingMore}
            className="mt-4 w-full sm:w-auto min-h-12 px-6 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) font-semibold hover:bg-(--surface-2) disabled:opacity-60"
          >
            {loadingMore
              ? "Завантаження…"
              : `Показати ще (${totalReview - items.length})`}
          </button>
        )}
      </div>

      {/* Форма відгуку */}
      <div id={formBoxId} className="max-w-[70ch] scroll-mt-[calc(var(--header-h)+var(--secnav-h,56px)+16px)] outline-none">
        {!userInfo ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-(--r-lg) bg-(--surface-2) p-4">
            <p className="text-(--ink-2) flex-1">
              Щоб написати відгук, увійдіть або зареєструйтесь.
            </p>
            <Link
              to="/login"
              className="min-h-12 px-5 inline-flex items-center justify-center rounded-(--r-md) bg-(--brand) hover:bg-(--brand-hover) text-(--on-brand) font-semibold"
            >
              Зареєструйтесь для написання відгуку
            </Link>
          </div>
        ) : !canReview ? (
          <p className="text-sm text-(--ink-2) rounded-(--r-lg) bg-(--surface-2) p-4">
            Залишити відгук можна лише після того, як замовлення з цим
            товаром буде доставлено.
          </p>
        ) : (
          <form onSubmit={review_submit} noValidate className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-(--ink)">
              {existingReview ? "Ваш відгук" : "Написати відгук"}
            </h3>
            {existingReview && existingReview.status === "pending" && (
              <p className="text-sm text-(--ink-2) rounded-(--r-md) bg-(--surface-2) p-3">
                Ваш відгук очікує на перевірку модератором. Можете
                відредагувати текст нижче — він знову піде на перевірку.
              </p>
            )}
            {existingReview && existingReview.status === "rejected" && (
              <p className="text-sm text-(--danger) rounded-(--r-md) bg-(--danger-soft) p-3">
                Ваш попередній відгук відхилено модератором. Можете
                відредагувати й надіслати ще раз.
              </p>
            )}

            <div>
              <p id={`${uid}-stars-label`} className="mb-1 text-sm font-medium text-(--ink)">
                Оцінка
              </p>
              <div id={`${uid}-stars`} tabIndex={-1} className="outline-none">
                <StarPicker
                  value={rat}
                  onChange={(v) => {
                    setRat(v);
                    if (errors.rating) setErrors((s) => ({ ...s, rating: "" }));
                  }}
                  invalid={!!errors.rating}
                  describedBy={errors.rating ? `${uid}-stars-err` : undefined}
                  labelId={`${uid}-stars-label`}
                />
              </div>
              <FieldError id={`${uid}-stars-err`}>{errors.rating}</FieldError>
            </div>

            <div>
              <label htmlFor={`${uid}-text`} className="mb-1 block text-sm font-medium text-(--ink)">
                Ваш відгук
              </label>
              <textarea
                id={`${uid}-text`}
                name="review"
                value={re}
                onChange={(e) => {
                  setRe(e.target.value);
                  if (errors.review) setErrors((s) => ({ ...s, review: "" }));
                }}
                required
                aria-invalid={!!errors.review || undefined}
                aria-describedby={errors.review ? `${uid}-text-err` : undefined}
                rows={5}
                placeholder="Що сподобалось, а що ні? Як товар показав себе у використанні?"
                className={`block w-full min-h-32 rounded-(--r-md) border bg-(--surface) p-3 text-base text-(--ink) outline-none focus:border-(--brand) ${
                  errors.review ? "border-(--danger)" : "border-(--line-strong)"
                }`}
              ></textarea>
              <FieldError id={`${uid}-text-err`}>{errors.review}</FieldError>
            </div>

            <div>
              <button
                type="submit"
                className="w-full sm:w-auto min-h-12 px-6 rounded-(--r-md) bg-(--brand) hover:bg-(--brand-hover) text-(--on-brand) font-semibold"
              >
                {existingReview ? "Оновити відгук" : "Надіслати"}
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  );
};

export default Reviews;
