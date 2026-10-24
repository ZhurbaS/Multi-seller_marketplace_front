import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset the window scroll position on navigation —
// if you scrolled down on one page (e.g. Home) and click a link to a new
// page (e.g. a product's Details page), the new page renders but the
// browser keeps the old scroll offset, so it opens "mid-page" instead of
// at the top. This resets scroll to the top on every route change.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
