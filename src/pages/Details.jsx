import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import "react-multi-carousel/lib/styles.css";
import Carousel from "react-multi-carousel";
import Rating from "../components/Rating";
import { reviewsWord } from "../utils/pluralize";
import { FaHeart } from "react-icons/fa6";
import { AiFillTikTok } from "react-icons/ai";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareInstagram } from "react-icons/fa6";

import { FaSquareTwitter } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa6";
import Reviews from "../components/Reviews";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useDispatch, useSelector } from "react-redux";
import { product_details } from "../store/reducers/homeSlice";
import toast from "react-hot-toast";
import {
  add_to_card,
  add_to_wishlist,
  messageClear,
} from "../store/reducers/cardSlice";
import useCarouselResizeKey from "../hooks/useCarouselResizeKey";
import api from "../api/api";
import { baseUnitPrice, unitPrice, restockText } from "../utils/pricing";

const Details = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { product, relatedProducts, moreProducts, category, totalReview } =
    useSelector((state) => state.home);
  const { userInfo } = useSelector((state) => state.auth);
  const { errorMessage, successMessage } = useSelector((state) => state.card);
  const resizeKey = useCarouselResizeKey();

  useEffect(() => {
    setImage("");
    dispatch(product_details(slug));
  }, [slug]);

  const [image, setImage] = useState("");
  const [state, setState] = useState("description");

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 5,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 4,
    },
    mdtablet: {
      breakpoint: { max: 991, min: 464 },
      items: 4,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 2,
    },
    smmobile: {
      breakpoint: { max: 640, min: 0 },
      items: 3,
    },
    xsmobile: {
      breakpoint: { max: 440, min: 0 },
      items: 1,
    },
  };

  // Умови продажу: мінімальне замовлення і крок (комплекти/упаковки)
  const minQty = product.minOrderQty || 1;
  const step = product.orderStep || 1;
  const noStock = !(product.stock > 0);
  const isPreorder = noStock && !!product.allowPreorder;
  // Купити можна, якщо на складі не менше мінімального замовлення, або це передзамовлення
  const canBuy = isPreorder || (product.stock > 0 && product.stock >= minQty);
  const hasTiers = (product.priceTiers || []).length > 0;

  const [quantity, setQuantity] = useState(1);
  const [subscribed, setSubscribed] = useState(false);
  const currentUnit = product._id ? unitPrice(product, quantity) : 0;

  // Коли товар завантажився — ставимо мінімальну кількість
  useEffect(() => {
    if (product._id) setQuantity(product.minOrderQty || 1);
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
    if (!userInfo) return navigate("/login");
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

  const add_card = () => {
    if (userInfo) {
      dispatch(
        add_to_card({
          userId: userInfo.id,
          quantity: quantity,
          productId: product._id,
        })
      );
    } else {
      navigate("/login");
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
  }, [successMessage, errorMessage]);

  const add_wishlist = () => {
    if (userInfo) {
      dispatch(
        add_to_wishlist({
          userId: userInfo.id,
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
    } else {
      navigate("/login");
    }
  };

  // «Купити зараз» — той самий шлях, що й кошик, але для одного товару.
  // Доставка в ціну не входить (оплачується перевізнику при отриманні),
  // остаточні суми і знижки рахує сервер.
  const buynow = () => {
    if (!userInfo) return navigate("/login");
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

  return (
    <div>
      <Header />
      <section
        style={{
          backgroundImage: `url(/images/banner/shop.png)`,
        }}
        className="h-[220px] mt-6 bg-cover bg-no-repeat relative bg-left"
      >
        <div className="absolute left-0 top-0 w-full h-full bg-[var(--bg-section)]">
          <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto ">
            <div className="flex flex-col justify-center gap-1 items-center h-full w-full text-[var(--text-section)]">
              <h2 className="text-3xl font-bold">Опис товару</h2>
              <div className="flex justify-center items-center gap-2 text-2xl w-full">
                <Link to="/">Головна</Link>
                <span className="pt-1">
                  <IoIosArrowForward />
                </span>
                <span>Опис товару</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="bg-[var(--bg-deatails-road)] py-5 mb-5">
          <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto">
            <div className="flex justify-start items-center text-md text-[var(--text-deatails)] w-full">
              <Link to="/">Головна</Link>
              <span className="pt-1 ">
                <IoIosArrowForward />
              </span>
              <Link to="/">{category.name}</Link>
              <span className="pt-1 ">
                <IoIosArrowForward />
              </span>
              <span>{product.name}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto pb-16">
          <div className="grid grid-cols-2 max-mdlg:grid-cols-1 gap-8">
            <div className="">
              <div className="p-5 border border-[var(--border-deatails)] aspect-square">
                <img
                  className="w-full h-full object-contain"
                  src={image ? image : product.images?.[0]}
                  alt=""
                />
              </div>
              <div className="py-3">
                {product.images && (
                  <Carousel
                    key={resizeKey}
                    autoPlay={true}
                    infinite={true}
                    arrows={true}
                    responsive={responsive}
                    transitionDuration={500}
                  >
                    {product.images.map((img, i) => {
                      return (
                        <div
                          onClick={() => setImage(img)}
                          className="px-1"
                          key={i}
                        >
                          <img
                            className="aspect-square w-full object-cover cursor-pointer rounded-sm"
                            src={img}
                            alt=""
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="text-3xl text-[var(--text-deatails)] font-bold">
                <h3>{product.name}</h3>
              </div>
              <div className="flex justify-start items-center gap-4">
                <div className="flex text-xl">
                  <Rating ratings={product.rating} />
                </div>
                <span className="text-[var(--text-deatailsRaiting)]">
                  ({totalReview} {reviewsWord(totalReview)})
                </span>
              </div>
              <div className="text-2xl text-[var(--text-deatailsPrice)] font-bold flex gap-3">
                {product.discount !== 0 ? (
                  <>
                    Ціна: <h2 className="line-through">₴{product.price}</h2>
                    <h2 className="text-[var(--text-ordDet-paid)]">
                      ₴
                      {product.price -
                        Math.floor(
                          (product.price * product.discount) / 100
                        )}{" "}
                      (-{product.discount}%)
                    </h2>
                  </>
                ) : (
                  <h2 className="text-[var(--text-ordDet-paid)]">
                    Ціна: ₴{product.price}
                  </h2>
                )}
              </div>

              {/* Умови продажу: упаковка/мінімум, ціна при вибраній кількості, знижки за кількість */}
              {(minQty > 1 || step > 1 || product.packLabel) && (
                <div className="text-[var(--text-deatails)] text-sm bg-[var(--bg-detailsDescr)] px-3 py-2 rounded-sm">
                  {product.packLabel && (
                    <p className="font-semibold">{product.packLabel}</p>
                  )}
                  <p>
                    Мінімальне замовлення: {minQty} шт
                    {step > 1 ? `, кратно ${step}` : ""}
                  </p>
                </div>
              )}
              {hasTiers && (
                <div className="text-[var(--text-deatails)]">
                  <p className="font-semibold mb-1">Знижки за кількість</p>
                  <table className="text-sm border border-[var(--border-deatails)]">
                    <tbody>
                      <tr>
                        <td className="px-3 py-1 border-b border-[var(--border-deatails)]">
                          від {minQty} шт
                        </td>
                        <td className="px-3 py-1 border-b border-[var(--border-deatails)]">
                          ₴{baseUnitPrice(product)} / шт
                        </td>
                      </tr>
                      {product.priceTiers.map((t) => (
                        <tr key={t.minQty}>
                          <td className="px-3 py-1 border-b border-[var(--border-deatails)]">
                            від {t.minQty} шт
                          </td>
                          <td className="px-3 py-1 border-b border-[var(--border-deatails)]">
                            ₴{unitPrice(product, t.minQty)} / шт (−{t.percent}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {canBuy && (hasTiers || quantity > 1) && (
                <p className="text-[var(--text-deatails)]">
                  Ваше замовлення: {quantity} шт × ₴{currentUnit} ={" "}
                  <b>₴{currentUnit * quantity}</b>
                </p>
              )}

              <div className="text-[var(--text-deatails)] ">
                <p>
                  {product.description
                    ? product.description.substring(0, 230) + "..."
                    : ""}
                </p>
                <p className="text-[var(--text-deatails)] py-1 font-bold">
                  Продавець: {product.shopName}
                </p>
              </div>
              <div className="flex gap-3 pb-10 border-b border-[var(--border-deatails)]">
                {canBuy ? (
                  <>
                    <div className="flex bg-[var(--bg-detailsDescr)] h-[50px] justify-center items-center text-xl">
                      <div onClick={dec} className="px-6 cursor-pointer">
                        -
                      </div>
                      <div className="px-6">{quantity}</div>
                      <div onClick={inc} className="px-6 cursor-pointer">
                        +
                      </div>
                    </div>
                    <div className="">
                      <button
                        onClick={add_card}
                        className="px-8 py-3 h-[50px] cursor-pointer hover:shadow-lg hover:shadow-green-500/40 bg-[var(--bg-detailsAddBtn)] text-[var(--text-detailsAddBtn)]"
                      >
                        {isPreorder ? "Передзамовити" : "Додати до кошика"}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={toggleSubscribe}
                    disabled={!noStock}
                    className="px-8 py-3 h-[50px] cursor-pointer hover:shadow-lg hover:shadow-green-500/40 bg-[var(--bg-detailsAddBtn)] text-[var(--text-detailsAddBtn)] disabled:opacity-60"
                  >
                    {!noStock
                      ? `Доступно лише ${product.stock} шт (мін. ${minQty})`
                      : subscribed
                      ? "Скасувати сповіщення"
                      : "Повідомити про наявність"}
                  </button>
                )}
                <div className="">
                  <div
                    onClick={add_wishlist}
                    className="h-[50px] w-[50px] flex justify-center items-center cursor-pointer hover:shadow-lg hover:shadow-cyan-500/40 bg-[var(--bg-detailsHeart)] text-[var(--text-detailsAddBtn)]"
                  >
                    <FaHeart />
                  </div>
                </div>
              </div>

              <div className="flex py-5 gap-5">
                <div className="w-[150px] text-[var(--text-detailsAvail)] font-bold text-xl flex flex-col gap-5">
                  <span>Наявність</span>
                  <span>Поділитися</span>
                </div>
                <div className="flex flex-col gap-5">
                  <span
                    className={`${
                      product.stock
                        ? "text-[var(--text-detailsOnStock)]"
                        : "text-[var(--text-detailsOutOfStock)]"
                    }`}
                  >
                    {product.stock > 0
                      ? `Є в наявності ${product.stock} шт`
                      : isPreorder
                      ? "Передзамовлення"
                      : "Немає в наявності"}
                  </span>
                  {noStock && restockText(product) && (
                    <span className="text-[var(--text-deatails)] text-sm">
                      Очікується через {restockText(product)}
                    </span>
                  )}

                  <ul className="flex justify-start items-center gap-3">
                    <li>
                      <a
                        className="w-[38px] h-[38px] hover:bg-[var(--bg-detailsAddBtn)] hover:text-[var(--text-detailsAddBtn)] flex justify-center items-center bg-[var(--bg-fb)] rounded-full text-[var(--text-detailsAddBtn)]"
                        href="#"
                      >
                        <IoLogoFacebook />
                      </a>
                    </li>
                    <li>
                      <a
                        className="w-[38px] h-[38px] hover:bg-[var(--bg-detailsAddBtn)] hover:text-[var(--text-detailsAddBtn)] flex justify-center items-center bg-[var(--bg-tw)] rounded-full text-[var(--text-detailsAddBtn)]"
                        href="#"
                      >
                        <FaSquareTwitter />
                      </a>
                    </li>
                    <li>
                      <a
                        className="w-[38px] h-[38px] hover:bg-[var(--bg-detailsAddBtn)] hover:text-[var(--text-detailsAddBtn)] flex justify-center items-center bg-[var(--bg-li)] rounded-full text-[var(--text-detailsAddBtn)]"
                        href="#"
                      >
                        <FaLinkedin />
                      </a>
                    </li>
                    <li>
                      <a
                        className="w-[38px] h-[38px] hover:bg-[var(--bg-detailsAddBtn)] hover:text-[var(--text-detailsAddBtn)] flex justify-center items-center bg-[var(--bg-tt)] rounded-full text-[var(--text-detailsAddBtn)]"
                        href="#"
                      >
                        <AiFillTikTok />
                      </a>
                    </li>
                    <li>
                      <a
                        className="w-[38px] h-[38px] hover:bg-[var(--bg-detailsAddBtn)] hover:text-[var(--text-detailsAddBtn)] flex justify-center items-center bg-[var(--bg-in)] rounded-full text-[var(--text-detailsAddBtn)]"
                        href="#"
                      >
                        <FaSquareInstagram />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                {canBuy ? (
                  <button
                    onClick={buynow}
                    className="px-8 py-3 h-[50px] cursor-pointer hover:shadow-lg hover:shadow-green-500/40 bg-[var(--bg-detailsBuyBtn)] text-[var(--text-detailsAddBtn)]"
                  >
                    {isPreorder ? "Передзамовити зараз" : "Купити зараз"}
                  </button>
                ) : (
                  ""
                )}
                <Link
                  to={`/dashboard/chat/${product.sellerId}`}
                  className="px-8 py-3 h-[50px] cursor-pointer hover:shadow-lg hover:shadow-red-500/40 bg-[var(--bg-detailsChatBtn)] text-[var(--text-detailsAddBtn)]"
                >
                  Запитати
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto pb-16">
          <div className="flex flex-wrap">
            <div className="w-[72%] max-mdlg:w-full">
              <div className="pr-4 max-mdlg:pr-0">
                <div className="grid grid-cols-3">
                  <button
                    onClick={() => setState("description")}
                    className={` py-1 hover:text-[var(--text-detailsAddBtn)] px-5 hover:bg-[var(--bg-detailsAddBtn)] ${
                      state === "description"
                        ? "bg-[var(--bg-detailsAddBtn)] text-[var(--text-detailsAddBtn)]"
                        : "bg-[var(--bg-detailsDescr)] text-[var(--bg-detailsNonActBtn)]"
                    } rounded-sm`}
                  >
                    Опис
                  </button>
                  <button
                    onClick={() => setState("specifications")}
                    className={` py-1 hover:text-[var(--text-detailsAddBtn)] px-5 hover:bg-[var(--bg-detailsAddBtn)] ${
                      state === "specifications"
                        ? "bg-[var(--bg-detailsAddBtn)] text-[var(--text-detailsAddBtn)]"
                        : "bg-[var(--bg-detailsDescr)] text-[var(--bg-detailsNonActBtn)]"
                    } rounded-sm`}
                  >
                    Характеристики
                  </button>
                  <button
                    onClick={() => setState("reviews")}
                    className={` py-1 hover:text-[var(--text-detailsAddBtn)] px-5 hover:bg-[var(--bg-detailsAddBtn)] ${
                      state === "reviews"
                        ? "bg-[var(--bg-detailsAddBtn)] text-[var(--text-detailsAddBtn)]"
                        : "bg-[var(--bg-detailsDescr)] text-[var(--bg-detailsNonActBtn)]"
                    } rounded-sm`}
                  >
                    Відгуки ({totalReview})
                  </button>
                </div>

                <div className="">
                  {state === "reviews" ? (
                    <Reviews product={product} />
                  ) : state === "specifications" ? (
                    Array.isArray(product.specifications) &&
                    product.specifications.length > 0 ? (
                      <table className="w-full py-5 text-[var(--text-deatails)]">
                        <tbody>
                          {product.specifications.map((spec, i) => (
                            <tr
                              key={i}
                              className={
                                i % 2 === 1
                                  ? "bg-[var(--bg-detailsDescr)]"
                                  : ""
                              }
                            >
                              <td className="py-2 px-4 font-medium w-[45%] align-top break-words">
                                {spec.key}
                              </td>
                              <td className="py-2 px-4 align-top break-words">
                                {spec.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="py-5 text-[var(--text-deatails)]">
                        Для цього товару ще не додано характеристик.
                      </p>
                    )
                  ) : (
                    <p className="py-5 text-[var(--text-deatails)]">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="w-[28%] max-mdlg:w-full">
              <div className="pl-4 max-mdlg:pl-0">
                <div className="px-3 py-2 text-[var(--text-deatails)] bg-[var(--bg-detailsDescr)]">
                  <h2 className="font-bold">Від {product.shopName}</h2>
                </div>
                <div className="flex flex-col gap-5 mt-3 border border-[var(--border-deatails)] p-3">
                  {moreProducts.map((p, i) => {
                    return (
                      <Link
                        key={i}
                        to={`/product/details/${p.slug}`}
                        className="block"
                      >
                        <div className="relative aspect-square">
                          <img
                            className="w-full h-full object-cover"
                            src={p.images[0]}
                            alt=""
                          />
                          {p.discount !== 0 && (
                            <div className="flex justify-center items-center absolute text-[var(--text-featured-disc)] w-[38px] h-[38px] rounded-full bg-[var(--bg-featured-disc)] font-semibold text-xs left-2 top-2">
                              {p.discount}%
                            </div>
                          )}
                        </div>

                        <h2 className="text-[var(--text-deatails)] py-1 font-bold">
                          {p.name}
                        </h2>
                        <div className="flex gap-2">
                          <h2 className="text-lg font-bold text-[var(--text-deatails)]">
                            ₴{p.price}
                          </h2>
                          <div className="flex items-center gap-2">
                            <Rating ratings={p.rating} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="w-[85%] max-md:w-[80%] max-sm:w-[90%] max-lg:w-[90%] h-full mx-auto">
          <h2 className="text-2xl py-8 text-[var(--text-deatails)]">
            Вам також може сподобатись
          </h2>
          <div className="relative">
            <Swiper
              slidesPerView="auto"
              spaceBetween={25}
              loop={true}
              pagination={{
                clickable: true,
                el: ".custom_bullet",
              }}
              navigation={{
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }}
              breakpoints={{
                1280: {
                  slidesPerView: 3,
                },
                565: {
                  slidesPerView: 2,
                },
              }}
              modules={[Pagination, Navigation]}
              className="mySwiper"
            >
              {relatedProducts.map((p, i) => {
                return (
                  <SwiperSlide key={i}>
                    <Link
                      key={i}
                      to={`/product/details/${p.slug}`}
                      className="block"
                    >
                      <div className="relative aspect-square">
                        <div className="w-full h-full">
                          <img
                            className="w-full h-full object-cover"
                            src={p.images[0]}
                            alt=""
                          />
                          <div className="absolute h-full w-full top-0 left-0 bg-[var(--bg-swipper)] opacity-25 hover:opacity-50 transition-all duration-500"></div>
                        </div>

                        {p.discount !== 0 && (
                          <div className="flex justify-center items-center absolute text-[var(--text-featured-disc)] w-[38px] h-[38px] rounded-full bg-[var(--bg-featured-disc)] font-semibold text-xs left-2 top-2">
                            {p.discount}%
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex flex-col gap-1">
                        <h2 className="text-[var(--text-deatails)] text-lg font-bold">
                          {p.name}
                        </h2>
                        <div className="flex justify-start items-center gap-3">
                          <h2 className="text-lg font-bold text-[var(--text-deatails)]">
                            ₴{p.price}
                          </h2>
                          <div className="flex">
                            <Rating ratings={p.rating} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            {/* Стрілки для Swiper */}
            <div className="swiper-button-prev absolute top-1/2 left-0 z-10 text-white flex items-center justify-center cursor-pointer -translate-y-1/2 rounded-full"></div>
            <div className="swiper-button-next absolute top-1/2 right-0 z-10 text-white flex items-center justify-center cursor-pointer -translate-y-1/2 rounded-full"></div>
          </div>

          {/* Пагінація */}
          <div className="w-full flex justify-center items-center py-8">
            <div className="custom_bullet justify-center gap-3 !w-auto"></div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Details;
