import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { LuRotateCcw, LuShieldCheck, LuTruck, LuUserCheck } from "react-icons/lu";
import Header from "../components/Header";
import Banner from "../components/Banner";
import Categories from "../components/Categories";
import FeatureProducts from "../components/products/FeatureProducts";
import Footer from "../components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { get_products } from "../store/reducers/homeSlice";
import useLegalStatus from "../hooks/useLegalStatus";
import useStorefront from "../hooks/useStorefront";
import AllNav from "../components/products/allNav";
import PlacementBanner from "../components/PlacementBanner";

// Переваги магазину — лише те, що реально є в проєкті (посилання як у футері)
const TrustRow = () => {
  const legal = useLegalStatus();
  const items = [
    {
      icon: <LuTruck aria-hidden="true" className="shrink-0 text-2xl text-(--brand-ink)" />,
      title: "Доставка Новою поштою",
      sub: "відділення, поштомат, кур'єр",
      to: legal.delivery?.published ? "/delivery" : null,
    },
    {
      icon: <LuRotateCcw aria-hidden="true" className="shrink-0 text-2xl text-(--brand-ink)" />,
      title: "Обмін та повернення",
      sub: "умови повернення",
      to: legal.returns?.published ? "/returns" : "/returns-policy",
    },
    legal.warranty?.published && {
      icon: <LuShieldCheck aria-hidden="true" className="shrink-0 text-2xl text-(--brand-ink)" />,
      title: "Гарантія",
      sub: "умови гарантії",
      to: "/warranty",
    },
    {
      icon: <LuUserCheck aria-hidden="true" className="shrink-0 text-2xl text-(--brand-ink)" />,
      title: "Без реєстрації",
      sub: "оформлення як гість",
      to: null,
    },
  ].filter(Boolean);

  return (
    <section aria-label="Переваги магазину" className="bg-(--surface) border-y border-(--line)">
      <ul className="container-x flex flex-wrap justify-center gap-x-2 gap-y-1 py-3 md:flex-nowrap md:gap-4">
        {items.map(({ icon, title, sub, to }) => {
          const body = (
            <>
              {icon}
              <span className="flex flex-col items-center min-w-0">
                <span className="text-sm/5 font-semibold text-(--ink)">{title}</span>
                <span className="text-xs/4 text-(--ink-2)">{sub}</span>
              </span>
            </>
          );
          const cls =
            "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 w-full min-h-11 py-1 px-2 rounded-(--r-sm) text-center";
          return (
            <li key={title} className="basis-[calc(50%-4px)] md:basis-0 md:flex-1 flex justify-center">
              {to ? (
                <Link to={to} className={`${cls} [@media(hover:hover)]:hover:underline`}>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// Швидкі категорії для компактної вітрини: ≤6 — великі плитки без каруселі
const QuickCategories = () => {
  const { categories = [] } = useSelector((state) => state.home);
  if (!categories.length) return null;
  if (categories.length > 6) return <Categories />;
  const cols =
    categories.length >= 6
      ? "lg:grid-cols-6"
      : categories.length === 5
        ? "lg:grid-cols-5"
        : categories.length === 4
          ? "lg:grid-cols-4"
          : "";
  return (
    <section aria-labelledby="home-quick-cats">
      <AllNav title="Категорії товарів" to="/shops" id="home-quick-cats" />
      <ul className={`grid grid-cols-2 sm:grid-cols-3 ${cols} gap-3 md:gap-4`}>
        {categories.map((c, i) => (
          <li key={c._id || i} className="flex">
            <Link
              to={`/products?category=${encodeURIComponent(c.name)}`}
              className="group flex flex-col w-full rounded-(--r-lg) bg-(--surface) border border-(--line) overflow-hidden motion-safe:transition-shadow [@media(hover:hover)]:hover:shadow-(--shadow-2)"
            >
              <span className="block aspect-[4/3] bg-(--surface-2)">
                {c.image && (
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width="320"
                    height="240"
                    className="w-full h-full object-contain p-3"
                  />
                )}
              </span>
              <span className="flex items-center justify-center min-h-12 px-3 py-2 text-[0.9375rem]/5 font-semibold text-(--ink) text-center [@media(hover:hover)]:group-hover:text-(--brand-ink)">
                <span className="line-clamp-2 break-words">{c.name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

// Унікальні товари (за _id) з кількох списків, порядок — за першою появою
const uniqueById = (...lists) => {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const p of list || []) {
      const id = p?._id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(p);
    }
  }
  return out;
};

const Home = () => {
  const dispatch = useDispatch();
  const { products, latest_product, topRated_product, discount_product } =
    useSelector((state) => state.home);
  useEffect(() => {
    dispatch(get_products());
  }, [dispatch]);

  // Сервер віддає ці списки «сторінками» по 3 товари — для рядів потрібен плаский масив
  const latest = useMemo(() => (latest_product || []).flat(), [latest_product]);
  const top = useMemo(() => (topRated_product || []).flat(), [topRated_product]);
  const sale = useMemo(
    () => (discount_product || []).flat().filter((p) => Number(p.discount) > 0),
    [discount_product]
  );
  const { compact } = useStorefront();
  const all = useMemo(
    () => uniqueById((products || []).flat(), latest, top, sale),
    [products, latest, top, sale]
  );

  if (compact) {
    return (
      <div className="w-full">
        <Header />
        <main>
          <h1 className="sr-only">TechScout — інтернет-магазин електроніки</h1>
          <Banner />

          <div className="container-x py-5 md:py-8">
            <QuickCategories />
          </div>

          <div className="container-x pb-6 md:pb-10">
            <FeatureProducts title="Усі товари" products={all} to="/shops" layout="large" />
          </div>

          <PlacementBanner placement="home_mid" className="container-x pb-6 md:pb-10" />

          <TrustRow />

          {sale.length >= 4 && (
            <div className="container-x py-6 md:py-10">
              <FeatureProducts title="Акційні товари" products={sale} to="/shops" layout="rail" />
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Header />
      <main>
        <h1 className="sr-only">TechScout — інтернет-магазин електроніки</h1>
        <Banner />

        <div className="container-x py-5 md:py-8">
          <Categories />
        </div>

        <TrustRow />

        <div className="container-x py-6 md:py-10 flex flex-col gap-8 md:gap-12">
          <FeatureProducts title="Популярні товари" products={products} to="/shops" />
        </div>

        <PlacementBanner placement="home_mid" className="container-x pb-6 md:pb-10" />

        {/* Секції з фоном на всю ширину, контент — у контейнері */}
        <div className="container-x py-6 md:py-10 flex flex-col gap-8 md:gap-12">
          {sale.length > 0 && (
            <FeatureProducts title="Акційні товари" products={sale} to="/shops" layout="rail" />
          )}
          <FeatureProducts title="Новинки" products={latest} to="/shops" layout="rail" />
          <FeatureProducts title="Топ за рейтингом" products={top} to="/shops" layout="rail" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
