"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      handleIncrease();
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      handleDecrease();
    }
  };

  const sizeStyles = {
    sm: {
      button: "inline-flex items-center justify-center p-1.5",
      icon: "h-3 w-3",
      value: "w-8 text-sm",
    },
    md: {
      button: "inline-flex items-center justify-center p-2",
      icon: "h-4 w-4",
      value: "w-10 text-sm",
    },
    lg: {
      button: "inline-flex items-center justify-center h-11 w-11",
      icon: "h-5 w-5",
      value: "w-12 text-base",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "inline-flex items-center border border-border rounded-lg",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="spinbutton"
      aria-valuenow={quantity}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        className={cn(
          styles.button,
          "hover:bg-muted transition-colors rounded-l-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={styles.icon} />
      </button>
      <span
        className={cn(
          styles.value,
          "text-center font-medium select-none"
        )}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        className={cn(
          styles.button,
          "hover:bg-muted transition-colors rounded-r-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={styles.icon} />
      </button>
    </div>
  );
}
