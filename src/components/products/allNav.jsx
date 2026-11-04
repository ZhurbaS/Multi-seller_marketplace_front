import React from "react";
import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";

// Заголовок секції головної сторінки + посилання «Усі →» (тап-зона ≥44px).
const AllNav = ({ title, to, id, linkLabel = "Усі" }) => (
  <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
    <h2 id={id} className="text-lg/6 md:text-[1.375rem]/[1.875rem] font-bold text-(--ink) flex items-center gap-3">
      <span aria-hidden="true" className="w-1 h-6 rounded-full bg-(--brand)" />
      {title}
    </h2>
    {to && (
      <Link
        to={to}
        className="shrink-0 inline-flex items-center gap-1 min-h-11 px-2 -mr-2 rounded-(--r-sm) text-[0.9375rem] font-semibold text-(--brand-ink) [@media(hover:hover)]:hover:underline"
        aria-label={`${linkLabel}: ${title}`}
      >
        {linkLabel}
        <LuArrowRight aria-hidden="true" className="text-lg" />
      </Link>
    )}
  </div>
);

export default AllNav;
