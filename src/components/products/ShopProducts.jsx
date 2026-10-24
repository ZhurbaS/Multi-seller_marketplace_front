import React, { useEffect } from "react";
import { FaEye, FaRegHeart } from "react-icons/fa";
import { RiShoppingCartLine } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  add_to_card,
  add_to_wishlist,
  messageClear,
} from "../../store/reducers/cardSlice";
import toast from "react-hot-toast";
import Rating from "../Rating";

const ShopProducts = ({ styles, products }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { errorMessage, successMessage } = useSelector((state) => state.card);

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

  const add_card = (id) => {
    if (userInfo) {
      dispatch(
        add_to_card({
          userId: userInfo.id,
          quantity: 1,
          productId: id,
        })
      );
    } else {
      navigate("/login");
    }
  };

  const add_wishlist = (product) => {
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

  return (
    <div
      className={`w-full grid ${
        styles === "grid"
          ? "grid-cols-3 max-mdlg:grid-cols-2 max-md:grid-cols-2"
          : "grid-cols-1 max-mdlg:grid-cols-2 max-md:grid-cols-2"
      } gap-3`}
    >
      {products.map((p, i) => (
        <div
          key={i}
          className={`flex transition-all duration-1000 hover:shadow-md hover:-translate-y-3 ${
            styles === "grid"
              ? "flex flex-col justify-start items-start"
              : "justify-start items-center max-mdlg:flex-col max-mdlg:justify-start max-mdlg:items-start"
          } w-full gap-4 bg-[var(--bg-products)] p-1 rounded-md`}
        >
          <div
            className={
              styles === "grid"
                ? "w-full relative group aspect-square overflow-hidden"
                : "w-2/5 max-mdlg:w-full relative group aspect-square overflow-hidden"
            }
          >
            <Link to={`/product/details/${p.slug}`} className="block h-full">
              <img
                className="w-full h-full rounded-md object-cover"
                src={p.images[0]}
                alt=""
              />
            </Link>
            <ul className="flex transition-all duration-700 -bottom-10 justify-center items-center gap-2 absolute w-full group-hover:bottom-3">
              <li
                onClick={() => add_wishlist(p)}
                className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all"
              >
                <FaRegHeart />
              </li>
              <Link
                to={`/product/details/${p.slug}`}
                className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all"
              >
                <FaEye />
              </Link>
              <li
                onClick={() => add_card(p._id)}
                className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all"
              >
                <RiShoppingCartLine />
              </li>
            </ul>
          </div>
          <Link
            to={`/product/details/${p.slug}`}
            className="flex justify-start items-start flex-col gap-1"
          >
            <h2 className="font-bold">{p.name}</h2>
            <div className="flex justify-start items-center gap-3">
              <span className="text-md font-semibold">₴{p.price}</span>
              <div className="flex">
                <Rating ratings={p.rating} />
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default ShopProducts;
