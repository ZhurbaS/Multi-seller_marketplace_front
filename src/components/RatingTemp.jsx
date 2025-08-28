import React from "react";
import { CiStar } from "react-icons/ci";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";

const RatingTemp = ({ rating }) => {
  if (rating === 5) {
    return (
      <>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
      </>
    );
  } else if (rating === 4) {
    return (
      <>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
      </>
    );
  } else if (rating === 3) {
    return (
      <>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
      </>
    );
  } else if (rating === 2) {
    return (
      <>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
      </>
    );
  } else if (rating === 1) {
    return (
      <>
        <span className="text-[var(--text-ratingTemp)]">
          <FaStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
      </>
    );
  } else {
    return (
      <>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
        <span className="text-[var(--text-ratingTemp)]">
          <CiStar />
        </span>
      </>
    );
  }
};

export default RatingTemp;
