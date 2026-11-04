import React from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

// Статичні зірки для цілої оцінки 0–5 (відгуки, розподіл оцінок).
// Колір — токен --star; порожні — контур тим самим кольором (не лише колір несе інформацію:
// поруч завжди є число / підпис для зчитувачів екрана).
const RatingTemp = ({ rating = 0, label = true }) => {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span
      className="inline-flex items-center gap-0.5 text-(--star)"
      role={label ? "img" : undefined}
      aria-label={label ? `Оцінка ${value} з 5` : undefined}
      aria-hidden={label ? undefined : "true"}
    >
      {[1, 2, 3, 4, 5].map((n) =>
        n <= value ? (
          <FaStar key={n} aria-hidden="true" />
        ) : (
          <FaRegStar key={n} aria-hidden="true" />
        )
      )}
    </span>
  );
};

export default RatingTemp;
