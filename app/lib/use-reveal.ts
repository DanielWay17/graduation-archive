import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Fades in elements marked `data-reveal` when they scroll into view.
 * Elements already on screen are left alone, so the first paint never flickers.
 */
export function useReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "shown";
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.dataset.reveal = "pending";
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, [pathname]);
}
