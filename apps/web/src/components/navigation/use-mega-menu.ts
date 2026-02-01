import { useState, useRef, useCallback } from "react";

interface UseMegaMenuOptions {
  showDelay?: number;
  hideDelay?: number;
}

export function useMegaMenu(options: UseMegaMenuOptions = {}) {
  const { showDelay = 150, hideDelay = 300 } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
      categoryTimeoutRef.current = null;
    }
  }, []);

  const handleTriggerEnter = useCallback(() => {
    clearTimeouts();
    menuTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, showDelay);
  }, [showDelay, clearTimeouts]);

  const handleTriggerLeave = useCallback(() => {
    clearTimeouts();
    menuTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, hideDelay);
  }, [hideDelay, clearTimeouts]);

  const handleMenuEnter = useCallback(() => {
    clearTimeouts();
    setIsOpen(true);
  }, [clearTimeouts]);

  const handleMenuLeave = useCallback(() => {
    clearTimeouts();
    menuTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, hideDelay);
  }, [hideDelay, clearTimeouts]);

  const handleCategoryHover = useCallback(
    (categoryId: string) => {
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
      categoryTimeoutRef.current = setTimeout(() => {
        setActiveCategory(categoryId);
      }, showDelay);
    },
    [showDelay]
  );

  const handleCategoryLeave = useCallback(() => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
      categoryTimeoutRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearTimeouts();
    setIsOpen(false);
    setActiveCategory(null);
  }, [clearTimeouts]);

  return {
    isOpen,
    activeCategory,
    handleTriggerEnter,
    handleTriggerLeave,
    handleMenuEnter,
    handleMenuLeave,
    handleCategoryHover,
    handleCategoryLeave,
    closeMenu,
  };
}
