import { useEffect, useRef, useState } from "react";

/**
 * react-multi-carousel measures its container width on mount/resize, but
 * during a continuous window resize (e.g. dragging the browser narrower)
 * it can end up applying a stale (slightly too small) slide width. That
 * leaves a thin sliver of the next slide visible on the right edge until
 * the user interacts with the carousel (next/prev), which forces a fresh
 * measurement.
 *
 * This hook returns a value that changes shortly after the window stops
 * resizing. Passing it as the `key` prop on <Carousel> forces React to
 * fully unmount/remount the carousel, so it re-measures its container from
 * scratch at the settled size instead of relying on the stale value.
 */
const useCarouselResizeKey = (delay = 200) => {
  const [resizeKey, setResizeKey] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setResizeKey((prev) => prev + 1);
      }, delay);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutRef.current);
    };
  }, [delay]);

  return resizeKey;
};

export default useCarouselResizeKey;