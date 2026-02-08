"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface StickyFilterContainerProps {
  children: React.ReactNode;
  className?: string;
  /** CSS top offset for sticky positioning (clears header). Default: 5rem (80px) */
  topOffset?: string;
  /** Bottom padding to maintain from viewport bottom. Default: 16px */
  bottomPadding?: number;
}

/**
 * A world-class sticky container for filter sidebars that:
 * 1. Sticks to the top when scrolling (clearing the header)
 * 2. Has internal scrolling if content exceeds available viewport height
 * 3. Stops gracefully before hitting the footer
 * 4. Prevents Lenis smooth scroll from hijacking scroll events
 * 
 * Similar to Amazon and Nike product filter behavior.
 */
export function StickyFilterContainer({
  children,
  className,
  topOffset = "5rem",
  bottomPadding = 16,
}: StickyFilterContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>("calc(100vh - 5rem - 16px)");
  const [isNearFooter, setIsNearFooter] = useState(false);
  const footerObserverRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  // Calculate available height based on viewport and footer position
  const calculateMaxHeight = useCallback(() => {
    if (!containerRef.current) return;

    const footer = document.querySelector("footer");
    const viewportHeight = window.innerHeight;
    
    if (footer && isNearFooter) {
      const footerRect = footer.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // If footer is visible, calculate remaining space
      if (footerRect.top < viewportHeight) {
        const availableHeight = footerRect.top - containerRect.top - bottomPadding;
        setMaxHeight(`${Math.max(200, availableHeight)}px`);
        return;
      }
    }
    
    // Default: full viewport height minus top offset and small bottom padding
    // Since we're sticky at top: 5rem, available height is 100vh - 5rem - bottom padding
    setMaxHeight(`calc(100vh - ${topOffset} - ${bottomPadding}px)`);
  }, [isNearFooter, bottomPadding, topOffset]);

  // Set up IntersectionObserver to detect when footer approaches
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    footerObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsNearFooter(entry.isIntersecting);
        });
      },
      {
        // Start observing when footer is within 200px of viewport bottom
        rootMargin: "200px 0px 0px 0px",
        threshold: 0,
      }
    );

    footerObserverRef.current.observe(footer);

    return () => {
      footerObserverRef.current?.disconnect();
    };
  }, []);

  // Recalculate on scroll when near footer for smooth transition
  useEffect(() => {
    if (!isNearFooter) {
      // Reset to default when not near footer
      setMaxHeight(`calc(100vh - ${topOffset} - ${bottomPadding}px)`);
      return;
    }

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(calculateMaxHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    calculateMaxHeight(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isNearFooter, calculateMaxHeight, topOffset, bottomPadding]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      calculateMaxHeight();
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateMaxHeight]);

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className={cn(
        "sticky overflow-y-auto overscroll-contain scrollbar-hide",
        "transition-[max-height] duration-150 ease-out",
        className
      )}
      style={{
        top: topOffset,
        maxHeight,
      }}
    >
      {children}
    </div>
  );
}
