import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronRight, LuStore } from "react-icons/lu";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StoreCard from "../components/StoreCard";
import api from "../api/api";
import { pluralizeUk } from "../utils/pluralize";

const storesWord = (n) => pluralizeUk(n, "магазин", "магазини", "магазинів");

// Сторінка «Магазини»: фізичні точки продажу/самовивозу (GET /home/stores).
// Помилка мережі → порожній стан (без технічних повідомлень для покупця).
const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get("/home/stores")
      .then(({ data }) => {
        if (alive) setStores(Array.isArray(data?.stores) ? data.stores : []);
      })
      .catch(() => alive && setStores([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Магазини — TechScout";
    return () => {
      document.title = prev;
    };
  }, []);

  const n = stores.length;
  const pickupCount = stores.filter((s) => s.pickup).length;

  return (
    <div className="w-full">
      <Header />
      <main id="main" className="container-x pt-3 pb-10 lg:pt-5 lg:pb-14">
        <nav aria-label="Хлібні крихти" className="mb-3 lg:mb-5">
          <ol className="flex items-center gap-1 text-sm text-(--ink-2) min-w-0">
            <li className="shrink-0">
              <Link to="/" className="inline-flex min-h-8 items-center hover:text-(--brand-ink) hover:underline">
                Головна
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              <LuChevronRight className="size-4" />
            </li>
            <li className="min-w-0 truncate" aria-current="page">
              Магазини
            </li>
          </ol>
        </nav>

        <header className="mb-5 md:mb-8">
          <h1 className="text-[1.375rem]/7 md:text-[1.75rem]/9 font-bold text-(--ink)">Магазини</h1>
          <p className="mt-1 text-[0.9375rem]/6 text-(--ink-2)" aria-live="polite">
            {loading
              ? "Завантаження…"
              : n > 0
                ? `${n} ${storesWord(n)}${pickupCount ? ` · самовивіз у ${pickupCount}` : ""}`
                : "Поки що немає відкритих магазинів"}
          </p>
        </header>

        {loading ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="rounded-(--r-lg) border border-(--line) bg-(--surface) overflow-hidden motion-safe:animate-pulse"
              >
                <div className="aspect-[16/9] bg-(--surface-2)" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-5 w-2/3 rounded-(--r-sm) bg-(--surface-2)" />
                  <div className="h-4 w-full rounded-(--r-sm) bg-(--surface-2)" />
                  <div className="h-4 w-1/2 rounded-(--r-sm) bg-(--surface-2)" />
                  <div className="h-11 w-full rounded-(--r-md) bg-(--surface-2)" />
                </div>
              </li>
            ))}
          </ul>
        ) : n === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 py-12 md:py-16 px-4 rounded-(--r-lg) border border-dashed border-(--line-strong) bg-(--surface)">
            <span className="grid place-items-center w-16 h-16 rounded-full bg-(--brand-soft) text-(--brand-ink)" aria-hidden="true">
              <LuStore size={30} />
            </span>
            <p className="text-lg/6 font-semibold text-(--ink)">Магазини з'являться найближчим часом</p>
            <p className="text-[0.9375rem]/6 text-(--ink-2) max-w-[50ch]">
              А поки що замовляйте онлайн з доставкою Новою поштою.
            </p>
            <Link
              to="/shops"
              className="mt-2 min-h-11 inline-flex items-center justify-center px-5 rounded-(--r-md) bg-(--brand) text-(--on-brand) font-semibold [@media(hover:hover)]:hover:bg-(--brand-hover)"
            >
              Перейти до каталогу
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
            {stores.map((s, i) => (
              <li key={s._id || s.id || i} className="flex">
                <div className="w-full">
                  <StoreCard store={s} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Stores;
