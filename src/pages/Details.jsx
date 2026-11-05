import useEnsureUser from "../hooks/useEnsureUser";
import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate, useParams } from "react-router-dom";
import Rating from "../components/Rating";
import { reviewsWord } from "../utils/pluralize";
import { AiFillTikTok } from "react-icons/ai";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareInstagram, FaSquareTwitter, FaLinkedin } from "react-icons/fa6";
import {
  LuChevronRight,
  LuHeart,
  LuMessageCircle,
  LuMinus,
  LuPlus,
  LuShoppingCart,
  LuTruck,
  LuWallet,
  LuRotateCcw,
  LuBell,
  LuBellOff,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuShare2,
  LuStore,
} from "react-icons/lu";
import Reviews from "../components/Reviews";
import ProductGallery from "../components/ProductGallery";
import StickyBuyBar from "../components/StickyBuyBar";
import PlacementBanner from "../components/PlacementBanner";
import Accordion from "../components/Accordion";
import ProductTabs from "../components/ProductTabs";
import ExpandableText from "../components/ExpandableText";
import SpecsTable from "../components/SpecsTable";
import RelatedCarousel from "../components/RelatedCarousel";
import { jumpToSection } from "../components/sectionJump";
import { useDispatch, useSelector } from "react-redux";
import { product_details } from "../store/reducers/homeSlice";
import toast from "react-hot-toast";
import {
  add_to_card,
  add_to_wishlist,
  messageClear,
} from "../store/reducers/cardSlice";
import api from "../api/api";
import { baseUnitPrice, unitPrice, restockText } from "../utils/pricing";
import { trackProductView } from "../utils/track";

// Кнопки «поділитись»: фірмові кольори — як є (fb — токен, інші — літерали-аліаси)
const SHARE = [
  { id: "fb", label: "Facebook", Icon: IoLogoFacebook, bg: "bg-(--social-facebook)", fg: "text-(--on-brand)", url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { id: "tw", label: "X (Twitter)", Icon: FaSquareTwitter, bg: "bg-(--bg-tw)", fg: "text-(--on-brand)", url: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
  { id: "li", label: "LinkedIn", Icon: FaLinkedin, bg: "bg-(--bg-li)", fg: "text-(--on-brand)", url: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  { id: "tt", label: "TikTok", Icon: AiFillTikTok, bg: "bg-(--bg-tt)", fg: "text-(--ink)" },
  { id: "in", label: "Instagram", Icon: FaSquareInstagram, bg: "bg-(--bg-in)", fg: "text-(--on-brand)" },
];

const secondaryBtn =
  "min-h-12 px-4 inline-flex items-center justify-center gap-2 rounded-(--r-md) border border-(--line-strong) bg-(--surface) text-(--ink) text-base font-semibold hover:bg-(--surface-2)";

const Details = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { product, relatedProducts, moreProducts, category, totalReview } =
    useSelector((state) => state.home);
  const { userInfo } = useSelector((state) => state.auth);
  const ensureUser = useEnsureUser();
  const { errorMessage, successMessage, wishlist } = useSelector(
    (state) => state.card
  );

  useEffect(() => {
    dispatch(product_details(slug));
  }, [slug, dispatch]);

  // Умови продажу: мінімальне замовлення і крок (комплекти/упаковки)
  const minQty = product.minOrderQty || 1;
  const step = product.orderStep || 1;
  const noStock = !(product.stock > 0);
  const isPreorder = noStock && !!product.allowPreorder;
  // Купити можна, якщо на складі не менше мінімального замовлення, або це передзамовлення
  const canBuy = isPreorder || (product.stock > 0 && product.stock >= minQty);
  const hasTiers = (product.priceTiers || []).length > 0;
  const hasDiscount = !!product.discount && product.discount !== 0;
  const finalPrice = product._id ? baseUnitPrice(product) : 0;

  const [quantity, setQuantity] = useState(1);
  const [subscribed, setSubscribed] = useState(false);
  const [wished, setWished] = useState(false);
  const currentUnit = product._id ? unitPrice(product, quantity) : 0;

  const inWishlist =
    wished ||
    (Array.isArray(wishlist) &&
      wishlist.some((w) => w.productId === product._id || w.slug === product.slug));

  // Коли товар завантажився — ставимо мінімальну кількість
  useEffect(() => {
    if (product._id) setQuantity(product.minOrderQty || 1);
    setWished(false);
  }, [product._id, product.minOrderQty]);

  // Трекінг перегляду товару (один раз на відкриття, privacy-first)
  useEffect(() => {
    if (product._id) trackProductView(product._id);
  }, [product._id]);

  // Чи підписаний покупець на повідомлення про наявність
  useEffect(() => {
    if (userInfo && product._id && noStock) {
      api
        .get(`/home/product/notify-me/${product._id}`)
        .then(({ data }) => setSubscribed(!!data.subscribed))
        .catch(() => {});
    } else {
      setSubscribed(false);
    }
  }, [product._id, noStock, userInfo]);

  const toggleSubscribe = async () => {
    if (!userInfo?.email) return navigate("/login"); // повідомлення надсилаємо на e-mail
    try {
      if (subscribed) {
        await api.delete(`/home/product/notify-me/${product._id}`);
        setSubscribed(false);
        toast.success("Підписку скасовано");
      } else {
        const { data } = await api.post("/home/product/notify-me", {
          productId: product._id,
        });
        setSubscribed(true);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Не вдалося виконати дію");
    }
  };

  const inc = () => {
    const next = quantity + step;
    if (!isPreorder && next > product.stock) {
      toast.error(`Доступно лише ${product.stock} шт на складі`);
    } else {
      setQuantity(next);
    }
  };

  const dec = () => {
    if (quantity - step >= minQty) {
      setQuantity(quantity - step);
    } else {
      toast.error(`Мінімальне замовлення — ${minQty} шт`);
    }
  };

  const add_card = async () => {
    const uid = await ensureUser();
    if (uid) {
      dispatch(
        add_to_card({
          userId: uid,
          quantity: quantity,
          productId: product._id,
        })
      );
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  const add_wishlist = async () => {
    const uid = await ensureUser();
    if (uid) {
      const res = await dispatch(
        add_to_wishlist({
          userId: uid,
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          discount: product.discount,
          rating: product.rating,
          slug: product.slug,
          slugBase: product.slugBase,
        })
      );
      if (add_to_wishlist.fulfilled.match(res)) setWished(true);
    }
  };

  // «Купити зараз» — той самий шлях, що й кошик, але для одного товару.
  // Доставка в ціну не входить (оплачується перевізнику при отриманні),
  // остаточні суми і знижки рахує сервер.
  const buynow = async () => {
    if (!(await ensureUser())) return;
    const unit = unitPrice(product, quantity);
    const total = unit * quantity;

    const obj = [
      {
        sellerId: product.sellerId,
        shopName: product.shopName,
        price: total,
        products: [
          {
            quantity,
            unitPrice: unit,
            lineTotal: total,
            preorder: isPreorder,
            productInfo: product,
          },
        ],
      },
    ];

    navigate("/shipping", {
      state: {
        products: obj,
        price: total,
        items: quantity,
      },
    });
  };

  // Поділитися: системне меню (якщо є) або копіювання посилання
  const shareNative = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Посилання скопійовано");
      }
    } catch {
      /* користувач скасував */
    }
  };

  // Липка панель: з'являється, коли основна кнопка пішла за верхній край екрана
  const ctaRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product._id]);

  const stickyVariant = canBuy ? "cart" : noStock ? "notify" : null;

  const specs = Array.isArray(product.specifications)
    ? product.specifications.filter((s) => s && (s.key || s.value))
    : [];
  const keySpecs = specs.slice(0, 5);

  const hasRating = Number(product.rating) > 0;
  const ratingText = Number(product.rating || 0).toFixed(1).replace(".", ",");
  // Підсумок відгуків у заголовку секції (видно й у згорнутому акордеоні)
  const reviewsBadge = (
    <span className="inline-flex items-center gap-1 tabular-nums">
      {hasRating && (
        <>
          <span aria-hidden="true" className="text-(--star)">★</span>
          <span aria-hidden="true">{ratingText} ·</span>
        </>
      )}
      <span aria-hidden="true">{totalReview}</span>
      <span className="sr-only">
        {hasRating ? `: рейтинг ${ratingText} з 5, ` : ": "}
        {totalReview} {reviewsWord(totalReview)}
      </span>
    </span>
  );
  const tabs = [
    { id: "description", label: "Опис" },
    { id: "specs", label: "Характеристики", meta: specs.length ? `(${specs.length})` : null },
    { id: "reviews", label: "Відгуки", meta: `(${totalReview})` },
  ];

  const shareUrl =
    typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const shareText = encodeURIComponent(product.name || "");

  return (
    <div>
      <Header />

      <main
        id="main"
        className="container-x pt-3 pb-[calc(80px+var(--sab))] lg:pt-5 lg:pb-12 [--secnav-h:60px]"
      >
        {/* Хлібні крихти */}
        <nav aria-label="Хлібні крихти" className="mb-3 lg:mb-5">
          <ol className="flex items-center gap-1 text-sm text-(--ink-2) min-w-0">
            <li className="shrink-0">
              <Link to="/" className="inline-flex min-h-8 items-center hover:text-(--brand-ink) hover:underline">
                Головна
              </Link>
            </li>
            {category?.name && (
              <>
                <li aria-hidden="true" className="shrink-0">
                  <LuChevronRight className="size-4" />
                </li>
                <li className="min-w-0 shrink truncate">
                  <Link
                    to={`/products?category=${encodeURIComponent(category.name)}`}
                    className="inline-flex min-h-8 items-center hover:text-(--brand-ink) hover:underline"
                  >
                    {category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true" className="shrink-0 hidden sm:block">
              <LuChevronRight className="size-4" />
            </li>
            <li className="min-w-0 flex-1 truncate hidden sm:block" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Основний блок: галерея + купівля */}
        <div className="grid gap-5 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] xl:gap-12">
          <div className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
            <div className="mx-auto w-full max-w-[640px]">
              <ProductGallery
                images={product.images || []}
                name={product.name}
                discount={product.discount}
              />
            </div>
          </div>

          <div className="min-w-0 flex flex-col gap-5">
            {/* Назва + рейтинг */}
            <div className="flex flex-col gap-2">
              <h1 className="text-[1.375rem] leading-7 md:text-[1.75rem] md:leading-9 font-bold text-(--ink) break-words">
                {product.name}
              </h1>
              {/* Якір до відгуків: плавна прокрутка + розкриття секції на мобільних */}
              <a
                href="#reviews"
                onClick={(e) => {
                  e.preventDefault();
                  jumpToSection("reviews");
                }}
                className="inline-flex items-center gap-2 self-start min-h-11 text-[0.9375rem] text-(--ink-2) hover:text-(--brand-ink)"
              >
                <span className="flex text-base" aria-hidden="true">
                  <Rating ratings={product.rating} />
                </span>
                <span className="tabular-nums">
                  {hasRating && (
                    <b className="font-semibold text-(--ink)">
                      <span className="sr-only">Рейтинг </span>
                      {ratingText}
                      <span className="sr-only"> з 5</span>
                    </b>
                  )}
                  {hasRating ? " · " : ""}
                  <span className="underline underline-offset-2">
                    {totalReview > 0
                      ? `${totalReview} ${reviewsWord(totalReview)}`
                      : "Ще немає відгуків"}
                  </span>
                </span>
              </a>
            </div>

            {/* Ціна + наявність */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="price text-[1.625rem] leading-8 md:text-[2rem] md:leading-10 font-bold text-(--price)">
                  ₴{finalPrice}
                </span>
                {hasDiscount && (
                  <>
                    <s className="price text-lg text-(--ink-2)">
                      <span className="sr-only">Стара ціна: </span>₴{product.price}
                    </s>
                    <span className="rounded-full bg-(--sale) text-(--on-sale) px-2.5 py-0.5 text-sm font-bold tabular-nums">
                      −{product.discount}%
                    </span>
                  </>
                )}
              </div>

              <p
                className={`flex items-center gap-1.5 font-semibold ${
                  product.stock > 0
                    ? "text-(--success)"
                    : isPreorder
                    ? "text-(--warning)"
                    : "text-(--danger)"
                }`}
              >
                {product.stock > 0 ? (
                  <LuCircleCheck className="size-5" aria-hidden="true" />
                ) : isPreorder ? (
                  <LuClock className="size-5" aria-hidden="true" />
                ) : (
                  <LuCircleX className="size-5" aria-hidden="true" />
                )}
                {product.stock > 0
                  ? `Є в наявності ${product.stock} шт`
                  : isPreorder
                  ? "Передзамовлення"
                  : "Немає в наявності"}
              </p>
              {noStock && restockText(product) && (
                <p className="text-sm text-(--ink-2)">
                  Очікується через {restockText(product)}
                </p>
              )}
            </div>

            {/* Умови продажу: упаковка/мінімум, знижки за кількість */}
            {(minQty > 1 || step > 1 || product.packLabel) && (
              <div className="text-sm text-(--ink-2) bg-(--surface-2) px-3 py-2 rounded-(--r-md)">
                {product.packLabel && (
                  <p className="font-semibold text-(--ink)">{product.packLabel}</p>
                )}
                <p>
                  Мінімальне замовлення: {minQty} шт
                  {step > 1 ? `, кратно ${step}` : ""}
                </p>
              </div>
            )}
            {hasTiers && (
              <div className="text-(--ink)">
                <p className="font-semibold mb-1">Знижки за кількість</p>
                <table className="w-full sm:w-auto text-sm border border-(--line) rounded-(--r-md)">
                  <tbody>
                    <tr className="border-b border-(--line)">
                      <td className="px-3 py-2">від {minQty} шт</td>
                      <td className="px-3 py-2 price">
                        ₴{baseUnitPrice(product)} / шт
                      </td>
                    </tr>
                    {product.priceTiers.map((t) => (
                      <tr key={t.minQty} className="border-b border-(--line) last:border-b-0">
                        <td className="px-3 py-2">від {t.minQty} шт</td>
                        <td className="px-3 py-2 price">
                          ₴{unitPrice(product, t.minQty)} / шт (−{t.percent}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {canBuy && (hasTiers || quantity > 1) && (
              <p className="text-(--ink)" aria-live="polite">
                Ваше замовлення: {quantity} шт × ₴{currentUnit} ={" "}
                <b className="price">₴{currentUnit * quantity}</b>
              </p>
            )}

            {/* Дії */}
            <div ref={ctaRef} className="flex flex-col gap-3">
              {canBuy ? (
                <div className="flex gap-3">
                  <div
                    className="flex items-center shrink-0 rounded-(--r-md) border border-(--line-strong) bg-(--surface)"
                    role="group"
                    aria-label="Кількість"
                  >
                    <button
                      type="button"
                      onClick={dec}
                      aria-label="Зменшити кількість"
                      className="size-12 inline-flex items-center justify-center text-(--ink) hover:bg-(--surface-2) rounded-l-(--r-md)"
                    >
                      <LuMinus className="size-5" aria-hidden="true" />
                    </button>
                    <output
                      aria-live="polite"
                      className="min-w-10 text-center text-lg font-semibold tabular-nums text-(--ink)"
                    >
                      {quantity}
                    </output>
                    <button
                      type="button"
                      onClick={inc}
                      aria-label="Збільшити кількість"
                      className="size-12 inline-flex items-center justify-center text-(--ink) hover:bg-(--surface-2) rounded-r-(--r-md)"
                    >
                      <LuPlus className="size-5" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={add_card}
                    className="flex-1 min-h-12 px-5 inline-flex items-center justify-center gap-2 rounded-(--r-md) bg-(--cta) hover:bg-(--cta-hover) text-(--on-cta) text-base font-semibold shadow-(--shadow-1)"
                  >
                    <LuShoppingCart className="size-5" aria-hidden="true" />
                    {isPreorder ? "Передзамовити" : "У кошик"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={toggleSubscribe}
                  disabled={!noStock}
                  className="min-h-12 px-5 inline-flex items-center justify-center gap-2 rounded-(--r-md) bg-(--brand) hover:bg-(--brand-hover) text-(--on-brand) text-base font-semibold disabled:bg-(--surface-2) disabled:text-(--ink-2) disabled:cursor-not-allowed"
                >
                  {noStock &&
                    (subscribed ? (
                      <LuBellOff className="size-5" aria-hidden="true" />
                    ) : (
                      <LuBell className="size-5" aria-hidden="true" />
                    ))}
                  {!noStock
                    ? `Доступно лише ${product.stock} шт (мін. ${minQty})`
                    : subscribed
                    ? "Скасувати сповіщення"
                    : "Повідомити про наявність"}
                </button>
              )}

              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:gap-3">
                {canBuy ? (
                  <button type="button" onClick={buynow} className={secondaryBtn}>
                    {isPreorder ? "Передзамовити зараз" : "Купити зараз"}
                  </button>
                ) : null}
                <Link
                  to={`/dashboard/chat/${product.sellerId}`}
                  className={`${secondaryBtn} ${canBuy ? "" : "col-span-2"}`}
                >
                  <LuMessageCircle className="size-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Запитати</span>
                </Link>
                <button
                  type="button"
                  onClick={add_wishlist}
                  aria-pressed={inWishlist}
                  aria-label={inWishlist ? "У списку бажань" : "Додати до списку бажань"}
                  title={inWishlist ? "У списку бажань" : "Додати до списку бажань"}
                  className={`size-12 inline-flex items-center justify-center rounded-(--r-md) border ${
                    inWishlist
                      ? "border-(--sale) bg-(--danger-soft) text-(--sale)"
                      : "border-(--line-strong) bg-(--surface) text-(--ink-2) hover:text-(--brand-ink) hover:border-(--brand)"
                  }`}
                >
                  <LuHeart
                    className={`size-6 ${inWishlist ? "fill-current" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {/* Промо-банер — під блоком купівлі (поза ctaRef, щоб не впливати на липку панель) */}
            <PlacementBanner placement="product_promo" />

            {/* Доставка й оплата — стисло */}
            <ul className="flex flex-col divide-y divide-(--line) rounded-(--r-lg) border border-(--line) bg-(--surface) text-sm">
              <li className="flex gap-3 p-3">
                <LuTruck className="size-5 shrink-0 text-(--brand-ink) mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-(--ink)">Доставка Новою поштою</p>
                  <p className="text-(--ink-2)">
                    У відділення, поштомат або кур’єром. Вартість — за тарифами
                    перевізника, оплачується при отриманні.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 p-3">
                <LuWallet className="size-5 shrink-0 text-(--brand-ink) mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-(--ink)">Оплата</p>
                  <p className="text-(--ink-2)">
                    Спосіб оплати оберете під час оформлення.{" "}
                    <Link to="/delivery" className="text-(--brand-ink) underline underline-offset-2">
                      Доставка й оплата
                    </Link>
                  </p>
                </div>
              </li>
              <li className="flex gap-3 p-3">
                <LuRotateCcw className="size-5 shrink-0 text-(--brand-ink) mt-0.5" aria-hidden="true" />
                <p className="text-(--ink-2)">
                  <Link to="/returns" className="text-(--brand-ink) underline underline-offset-2">
                    Повернення
                  </Link>{" "}
                  ·{" "}
                  <Link to="/warranty" className="text-(--brand-ink) underline underline-offset-2">
                    Гарантія
                  </Link>
                </p>
              </li>
              {product.shopName && (
                <li className="flex gap-3 p-3">
                  <LuStore className="size-5 shrink-0 text-(--brand-ink) mt-0.5" aria-hidden="true" />
                  <p className="text-(--ink-2)">
                    Продавець: <b className="text-(--ink)">{product.shopName}</b>
                  </p>
                </li>
              )}
            </ul>

            {/* Ключові характеристики */}
            {keySpecs.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-(--ink) mb-2">
                  Ключові характеристики
                </h2>
                <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 text-sm">
                  {keySpecs.map((s, i) => (
                    <React.Fragment key={i}>
                      <dt className="text-(--ink-2) break-words">{s.key}</dt>
                      <dd className="text-(--ink) break-words">{s.value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
                {specs.length > keySpecs.length && (
                  <a
                    href="#specs"
                    onClick={(e) => {
                      e.preventDefault();
                      jumpToSection("specs", { expand: true });
                    }}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-(--brand-ink) hover:underline"
                  >
                    Усі характеристики ({specs.length})
                  </a>
                )}
              </div>
            )}

            {/* Короткий опис — лише на широких екранах, повний — нижче */}
            {product.description && (
              <p className="hidden lg:block text-(--ink-2) max-w-[70ch]">
                {product.description.length > 230
                  ? product.description.substring(0, 230) + "…"
                  : product.description}{" "}
                <a
                  href="#description"
                  onClick={(e) => {
                    e.preventDefault();
                    jumpToSection("description");
                  }}
                  className="text-(--brand-ink) font-semibold hover:underline"
                >
                  Детальніше
                </a>
              </p>
            )}

            {/* Поділитися */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-(--ink) mr-1">Поділитися:</span>
              <ul className="flex flex-wrap items-center gap-2">
                {SHARE.map((sh) => {
                  const { id, label, bg, fg, url } = sh;
                  return (
                  <li key={id}>
                    {url ? (
                      <a
                        href={url(shareUrl, shareText)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Поділитися в ${label}`}
                        className={`tap rounded-full text-xl ${bg} ${fg} hover:opacity-90`}
                      >
                        <sh.Icon aria-hidden="true" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={shareNative}
                        aria-label={`Поділитися в ${label}`}
                        className={`tap rounded-full text-xl ${bg} ${fg} hover:opacity-90`}
                      >
                        <sh.Icon aria-hidden="true" />
                      </button>
                    )}
                  </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    onClick={shareNative}
                    aria-label="Поділитися посиланням"
                    className="tap rounded-full border border-(--line-strong) bg-(--surface) text-(--ink) hover:bg-(--surface-2)"
                  >
                    <LuShare2 className="size-5" aria-hidden="true" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Опис / характеристики / відгуки + «Від продавця».
            Липка навігація по розділах (scroll-spy) + скорочені довгі блоки,
            щоб відгуки були в 1–2 екранах від початку опису. */}
        <div className="mt-8 lg:mt-12">
          <ProductTabs sections={tabs} />
        <div className="mt-4 lg:mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
          <div className="min-w-0 flex flex-col border-t border-(--line) md:gap-10 md:rounded-(--r-lg) md:bg-(--surface) md:border md:p-6 lg:p-8">
            <Accordion id="description" title="Опис" defaultOpen>
              {product.description ? (
                <ExpandableText key={product._id} lines={9} className="text-(--ink) max-w-[70ch]">
                  <p className="whitespace-pre-line break-words">{product.description}</p>
                </ExpandableText>
              ) : (
                <p className="text-(--ink-2)">Опис товару ще не додано.</p>
              )}
            </Accordion>

            <Accordion id="specs" title="Характеристики" badge={specs.length ? `(${specs.length})` : null}>
              {specs.length > 0 ? (
                <SpecsTable key={product._id} specs={specs} limit={8} />
              ) : (
                <p className="text-(--ink-2)">
                  Для цього товару ще не додано характеристик.
                </p>
              )}
            </Accordion>

            <Accordion id="reviews" title="Відгуки" badge={reviewsBadge} defaultOpen>
              <Reviews product={product} />
            </Accordion>
          </div>

          {moreProducts?.length > 0 && (
            <aside aria-labelledby="more-from-shop" className="min-w-0">
              <h2 id="more-from-shop" className="text-lg md:text-[1.375rem] font-bold text-(--ink) mb-3">
                Від {product.shopName}
              </h2>
              <ul className="snap-row no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-1 lg:gap-3 lg:overflow-visible">
                {moreProducts.map((p, i) => (
                  <li key={i} className="w-40 sm:w-48 lg:w-auto">
                    <Link
                      to={`/product/details/${p.slug}`}
                      className="flex flex-col lg:flex-row gap-2 lg:gap-3 h-full rounded-(--r-lg) border border-(--line) bg-(--surface) p-2 lg:p-3 hover:shadow-(--shadow-2)"
                    >
                      <div className="relative aspect-square lg:w-20 lg:shrink-0 rounded-(--r-md) bg-(--surface-2) overflow-hidden">
                        <img
                          className="w-full h-full object-contain"
                          src={p.images?.[0]}
                          alt={p.name}
                          width={160}
                          height={160}
                          loading="lazy"
                        />
                        {p.discount !== 0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-(--sale) text-(--on-sale) px-1.5 py-0.5 text-xs font-bold">
                            −{p.discount}%
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col gap-1">
                        <h3 className="text-sm leading-5 font-medium text-(--ink) line-clamp-2">
                          {p.name}
                        </h3>
                        <span className="flex text-xs" aria-hidden="true">
                          <Rating ratings={p.rating} />
                        </span>
                        <span className="price font-bold text-(--price)">₴{p.price}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
        </div>

        {/* Рекомендації */}
        {relatedProducts?.length > 0 && <RelatedCarousel products={relatedProducts} />}
      </main>

      {stickyVariant && product._id && (
        <StickyBuyBar
          visible={showSticky}
          name={product.name}
          price={canBuy ? currentUnit : finalPrice}
          oldPrice={hasDiscount ? product.price : null}
          variant={stickyVariant}
          label={
            stickyVariant === "cart"
              ? isPreorder
                ? "Передзамовити"
                : "У кошик"
              : subscribed
              ? "Скасувати"
              : "Повідомити"
          }
          onAction={stickyVariant === "cart" ? add_card : toggleSubscribe}
        />
      )}

      <Footer />
    </div>
  );
};

export default Details;
