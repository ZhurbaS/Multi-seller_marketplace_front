import React, { useState } from "react";
import Rating from "./Rating";
import RatingTemp from "./RatingTemp";
import Pagination from "./Pagination";
import { Link } from "react-router-dom";
import RatingReact from "react-rating";
import { CiStar } from "react-icons/ci";
import { FaStar } from "react-icons/fa6";
import { useSelector } from "react-redux";

const Reviews = ({ product }) => {
  const [perPage, setPerPage] = useState(1);
  const [pageNumber, setPageNumber] = useState(10);
  const {userInfo} = useSelector{state => state.auth};
  const [rat, setRat] = useState(""); // rating
  const [re, setRe] = useState(""); // review

  const review_submit = (e)=>{
    e.preventDefault();
    const obj = {

    }
  }

  return (
    <div className="mt-8">
      <div className="flex gap-10 max-mdlg:flex-col">
        <div className="flex flex-col gap-2 justify-start items-start py-4">
          <div className="">
            <span className="textßxl font-semibold">4.5</span>
            <span className="textß3xl font-semibold text-[var(--text-revisews)]">
              /5
            </span>
          </div>
          <div className="flex text-3xl">
            <Rating ratings={4.5} />
          </div>
          <p className="text-sm text-[var(--text-reviews)] ">Відгуки (15)</p>
        </div>
        <div className="flex gap-2 flex-col py-4">
          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={5} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className="h-full bg-[var(--text-ratingTemp)] w-[60%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">10</p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={4} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className="h-full bg-[var(--text-ratingTemp)] w-[70%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">20</p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={3} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className="h-full bg-[var(--text-ratingTemp)] w-[40%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">8</p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={2} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className="h-full bg-[var(--text-ratingTemp)] w-[30%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">5</p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={1} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className="h-full bg-[var(--text-ratingTemp)] w-[10%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">3</p>
          </div>

          <div className="flex justify-start items-center gap-5">
            <div className="text-md flex gap-1 w-[93px]">
              <RatingTemp rating={0} />
            </div>
            <div className="w-[200px] h-[14px] bg-[var(--bg-details-rating)] relative">
              <div className="h-full bg-[var(--text-ratingTemp)] w-[0%]"></div>
            </div>
            <p className="text-sm text-[var(--text-reviews)] w-[0%]">0</p>
          </div>
        </div>
      </div>

      <h2 className="text-[var(--text-reviews)] text-xl font-bold py-5">
        Відгуки (10)
      </h2>
      <div className="flex flex-col gap-8 pb-10 pt-4">
        {[1, 2, 3, 4, 5].map((r, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <div className="flex gap-1 text-xl">
                <RatingTemp rating={4} />
              </div>
              <span className="text-[var(--text-reviews)]">8 Січ 2025</span>
            </div>
            <span className="text-[var(--text-reviews)] text-md">
              Віктор Яценко
            </span>
            <p className="text-[var(--text-reviews)] text-sm">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Corrupti
              beatae necessitatibus earum, reprehenderit aut, fugit eum, neque
              id eius harum illum doloribus veritatis cupiditate adipisci
              officiis perferendis culpa iure pariatur.
            </p>
          </div>
        ))}
        <div className="flex justify-end">
          {
            <Pagination
              pageNumber={pageNumber}
              setPageNumber={setPageNumber}
              totalItem={10}
              perPage={perPage}
              showItem={Math.floor(10 / 3)}
            />
          }
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
                onChange={(e)=>setRe(e.target.value)}
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
