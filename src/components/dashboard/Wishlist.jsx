import React, { useEffect } from "react";
import { FaEye, FaRegHeart } from "react-icons/fa";
import { RiShoppingCartLine } from "react-icons/ri";
import Rating from "../Rating";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  get_wishlist_products,
  messageClear,
  remove_wishlist,
} from "../../store/reducers/cardSlice";
import toast from "react-hot-toast";

const Wishlist = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { errorMessage, successMessage, wishlist } = useSelector(
    (state) => state.card
  );

  useEffect(() => {
    dispatch(get_wishlist_products(userInfo.id));
  }, []);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
  }, [successMessage]);

  return (
    <div className="w-full grid grid-cols-4 max-mdlg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-6">
      {wishlist.map((p, i) => (
        <div
          key={i}
          className="border border-[var(--border-category)] group transition-all duration-500 hover:shadow-md hover:-mt-3 bg-[var(--bg-wish)]"
        >
          <div className="relative overflow-hidden">
            {p.discount !== 0 && (
              <div className="flex justify-center items-center absolute text-[var(--text-featured-disc)] w-[38px] h-[38px] rounded-full bg-[var(--bg-featured-disc)] font-semibold text-xs left-2 top-2">
                {p.discount}%
              </div>
            )}

            <img
              className="max-sm:w-full w-full h-[240px]"
              src={p.image}
              alt=""
            />
            <ul className="flex transition-all duration-700 -bottom-10 justify-center items-center gap-2 absolute w-full group-hover:bottom-3">
              <li
                onClick={() => dispatch(remove_wishlist(p._id))}
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
              <li className="w-[38px] h-[38px] cursor-pointer bg-[var(--bg-featured-heart)] flex justify-center items-center rounded-full hover:bg-[var(--bg-featured-heart-hov)] hover:text-[var(--text-featured-heart-hov)] hover:rotate-[720deg] transition-all">
                <RiShoppingCartLine />
              </li>
            </ul>
          </div>

          <div className="py-3 text-[var(--text-featured-pr_name)] px-2">
            <h2 className="font-bold">{p.name}</h2>
            <div className="flex justify-start items-center gap-3">
              <span className="text-md font-semibold">₴{p.price}</span>
              <div className="flex">
                <Rating ratings={p.rating} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Wishlist;
