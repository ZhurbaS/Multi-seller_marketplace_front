import React, { useEffect, useState } from "react";
import Rating from "./Rating";
import RatingTemp from "./RatingTemp";
import Pagination from "./Pagination";
import { Link } from "react-router-dom";
import RatingReact from "react-rating";
import { CiStar } from "react-icons/ci";
import { FaStar } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import {
  customer_review,
  get_reviews,
  messageClear,
  product_details,
} from "../store/reducers/homeSlice";
import toast from "react-hot-toast";

const Reviews = ({ product }) => {
  const dispatch = useDispatch();

  const [perPage, setPerPage] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);

  const { userInfo } = useSelector((state) => state.auth);
  const { successMessage, reviews, totalReview, rating_review } = useSelector(
    (state) => state.home
  );

  const [rat, setRat] = useState(""); // rating
  const [re, setRe] = useState(""); // review

  const review_submit = (e) => {
    e.preventDefault();
    const obj = {
      name: userInfo.name,
      review: re,
      rating: rat,
      productId: product._id,
    };

    dispatch(customer_review(obj));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(
        get_reviews({
          productId: product._id,
          pageNumber,
        })
      );
      dispatch(product_details(product.slug));
      setRat("");
      setRe("");
      dispatch(messageClear());
    }
  }, [successMessage]);

  useEffect(() => {
    if (product._id) {
      dispatch(
        get_reviews({
          productId: product._id,
          pageNumber,
        })
      );
    }
  }, [pageNumber, product]);

  return (
    <div className="mt-8">
      <div className="flex gap-10 max-mdlg:flex-col">
        <div className="flex flex-col gap-2 justify-start items-start py-4">
          <div className="">
            <span className="text-6xl font-semibold">{product.rating}</span>
            <span className="text-3xl font-semibold text-[var(--text-revisews)]">
              /5
            </span>
          </div>
          <div className="flex text-3xl">
            <Rating ratings={product.rating} />
          </div>
          <p className="text-sm text-[var(--text-reviews)] ">
            Відгуки ({totalReview})
          </p>
        </div>
        <div className="flex gap-2 flex-col py-4">
          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={5} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div
                style={{
                  width: `${Math.floor(
                    (100 * (rating_review[0]?.sum || 0)) / totalReview
                  )}%`,
                }}
                className="h-full bg-[var(--text-ratingTemp)] w-[60%]"
              ></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">
              {rating_review[0]?.sum}
            </p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={4} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div
                style={{
                  width: `${Math.floor(
                    (100 * (rating_review[1]?.sum || 0)) / totalReview
                  )}%`,
                }}
                className="h-full bg-[var(--text-ratingTemp)] w-[70%]"
              ></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">
              {rating_review[1]?.sum}
            </p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={3} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div
                style={{
                  width: `${Math.floor(
                    (100 * (rating_review[2]?.sum || 0)) / totalReview
                  )}%`,
                }}
                className="h-full bg-[var(--text-ratingTemp)] w-[40%]"
              ></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">
              {rating_review[2]?.sum}
            </p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={2} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div
                style={{
                  width: `${Math.floor(
                    (100 * (rating_review[3]?.sum || 0)) / totalReview
                  )}%`,
                }}
                className="h-full bg-[var(--text-ratingTemp)] w-[30%]"
              ></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">
              {rating_review[3]?.sum}
            </p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={1} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div
                style={{
                  width: `${Math.floor(
                    (100 * (rating_review[4]?.sum || 0)) / totalReview
                  )}%`,
                }}
                className="h-full bg-[var(--text-ratingTemp)] w-[10%]"
              ></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">
              {rating_review[4]?.sum}
            </p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={0} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className=" h-full bg-[var(--text-ratingTemp)] w-[0%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">0</p>
          </div>
        </div>
      </div>

      <h2 className="text-[var(--text-reviews)] text-xl font-bold py-5">
        Відгуки ({totalReview})
      </h2>
      <div className="flex flex-col gap-8 pb-10 pt-4">
        {reviews.map((r, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <div className="flex gap-1 text-xl">
                <RatingTemp rating={r.rating} />
              </div>
              <span className="text-[var(--text-reviews)]">{r.date}</span>
            </div>
            <span className="text-[var(--text-reviews)] text-md">{r.name}</span>
            <p className="text-[var(--text-reviews)] text-sm">{r.review}</p>
          </div>
        ))}
        <div className="flex justify-end">
          {totalReview > 5 && (
            <Pagination
              pageNumber={pageNumber}
              setPageNumber={setPageNumber}
              totalItem={totalReview}
              perPage={perPage}
              showItem={Math.floor(totalReview / 3)}
            />
          )}
        </div>
      </div>

      <div className="">
        {userInfo ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-1">
              <RatingReact
                onChange={(e) => setRat(e)}
                initialRating={rat}
                emptySymbol={
                  <span className="text-[var(--text-reviews)] text-4xl">
                    <CiStar />
                  </span>
                }
                fullSymbol={
                  <span className="text-[var(--text-ratingTemp)] text-4xl">
                    <FaStar />
                  </span>
                }
              />
            </div>

            <form onSubmit={review_submit}>
              <textarea
                value={re}
                onChange={(e) => setRe(e.target.value)}
                required
                className="border border-[var(--border-details-review)] outline-0 p-3 w-full"
                name=""
                id=""
                cols="30"
                rows="5"
              ></textarea>
              <div className="mt-2 max-mdlg:mb-8 max-md:mb-8 max-sm:mb-8">
                <button className="py-1 px-5 bg-[var(--bg-details-submitBtn)] text-[var(--text-details-submitBtn)] rounded-sm">
                  Надіслати
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <Link
              to="/login"
              className="py-1 px-5 bg-[var(--bg-details-login)] text-[var(--text-details-login)] rounded-sm"
            >
              Зареєструйтесь для написання відгуку
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
