import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import api from "../api/api";

const money = (p) => {
  const d = Number(p.discount) || 0;
  return d > 0 ? Math.round(p.price * (1 - d / 100) * 100) / 100 : p.price;
};

// Горизонтальна карусель «Рекомендовано для вас». Підбір робить сервер
// (часто купують разом + та сама категорія + популярність; лише товари в наявності).
const RecommendedCarousel = ({ productIds, onAdd }) => {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const ref = useRef(null);
  const key = [...productIds].sort().join(",");

  useEffect(() => {
    let alive = true;
    if (!key) {
      setItems([]);
      return;
    }
    api
      .get("/home/recommendations", { params: { ids: key } })
      .then(({ data }) => alive && setItems(data.products || []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [key]);

  if (!items.length) return null;

  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  const add = async (id) => {
    if (busy) return;
    setBusy(id);
    try {
      await onAdd(id);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="bg-[var(--bg-cardStock)] p-4 text-[var(--text-card-shopTitle)]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Рекомендовано для вас</h2>
        <div className="flex gap-2 max-sm:hidden">
          <button onClick={() => scroll(-1)} aria-label="Назад" className="p-2 border rounded-full">
            <IoIosArrowBack />
          </button>
          <button onClick={() => scroll(1)} aria-label="Далі" className="p-2 border rounded-full">
            <IoIosArrowForward />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto snap-x pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((p) => (
          <div
            key={p._id}
            className="snap-start shrink-0 w-[200px] border border-[var(--border-ship)] rounded-md p-3 flex flex-col gap-2"
          >
            <Link to={`/product/details/${p.slug}`}>
              <img src={p.image} alt="" className="w-full h-[120px] object-contain" />
            </Link>
            <span className="text-xs opacity-70">{p.reason}</span>
            <Link
              to={`/product/details/${p.slug}`}
              className="text-sm font-semibold leading-tight"
              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {p.name}
            </Link>
            <div className="mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[var(--text-card-price)]">₴{money(p)}</span>
                {p.discount > 0 && <span className="line-through text-sm opacity-60">₴{p.price}</span>}
              </div>
              {p.packLabel && <div className="text-xs opacity-70">{p.packLabel}</div>}
              <button
                onClick={() => add(p._id)}
                disabled={busy === p._id}
                className="mt-2 w-full px-3 py-[6px] rounded-sm bg-[var(--bg-card-processBtn)] text-[var(--text-card)] text-sm disabled:opacity-60"
              >
                {busy === p._id ? "Додаємо..." : "У кошик"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedCarousel;
