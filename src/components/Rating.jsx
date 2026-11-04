import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

// Рейтинг 0–5 зірками (--star). Колір/зірки — не єдиний носій інформації:
// завжди є текст для скрінрідерів, а `showValue` додає видиме число поруч.
// `count` — кількість відгуків (необов'язково).
const Rating = ({ ratings = 0, showValue = false, count }) => {
  const r = Math.min(Math.max(Number(ratings) || 0, 0), 5);
  const value = r.toFixed(1).replace(".", ",");

  return (
    <span className="inline-flex items-center gap-1 leading-none">
      <span aria-hidden="true" className="inline-flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((i) =>
          r >= i ? (
            <FaStar key={i} className="text-(--star)" />
          ) : r >= i - 0.5 ? (
            <FaStarHalfAlt key={i} className="text-(--star)" />
          ) : (
            <FaRegStar key={i} className="text-(--line-strong)" />
          )
        )}
      </span>
      <span className="sr-only">
        {r > 0 ? `Рейтинг ${value} з 5` : "Ще немає оцінок"}
        {count != null ? `, відгуків: ${count}` : ""}
      </span>
      {showValue && (
        <span aria-hidden="true" className="text-[0.8125rem] text-(--ink-2) tabular-nums">
          {r > 0 ? value : "—"}
          {count != null ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
};

export default Rating;
