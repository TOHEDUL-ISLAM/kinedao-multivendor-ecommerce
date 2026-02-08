"use client";

import { useEffect, useState } from "react";
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
  exceedMessage?: string;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
  className,
  exceedMessage,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(String(quantity));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(quantity));
    }
  }, [quantity, isEditing]);

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
    if (e.target instanceof HTMLInputElement) return;
    if (disabled) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      handleIncrease();
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      handleDecrease();
    }
  };

  const commitValue = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      setInputValue(String(quantity));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    if (clamped !== quantity) {
      onQuantityChange(clamped);
    }
    setInputValue(String(clamped));
  };

  const sizeStyles = {
    sm: {
      button: "inline-flex items-center justify-center p-1.5",
      icon: "h-3 w-3",
      input: "w-9 h-7 text-xs",
    },
    md: {
      button: "inline-flex items-center justify-center p-2",
      icon: "h-4 w-4",
      input: "w-12 h-8 text-sm",
    },
    lg: {
      button: "inline-flex items-center justify-center h-11 w-11",
      icon: "h-5 w-5",
      input: "w-14 h-10 text-base",
    },
  };

  const styles = sizeStyles[size];
  const numericInput = Number.parseInt(inputValue, 10);
  const exceedsMax = !Number.isNaN(numericInput) && numericInput > max;

  return (
    <div className={cn("inline-flex flex-col items-start", className)}>
      <div
        className={cn(
          "inline-flex items-center border border-border rounded-lg",
          disabled && "opacity-50 cursor-not-allowed"
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
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onFocus={() => setIsEditing(true)}
          onBlur={() => {
            setIsEditing(false);
            commitValue(inputValue);
          }}
          onChange={(e) => {
            if (disabled) return;
            const next = e.target.value;
            if (next === "" || /^\d+$/.test(next)) {
              setInputValue(next);
            }
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter") {
              e.preventDefault();
              commitValue(inputValue);
              (e.currentTarget as HTMLInputElement).blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setInputValue(String(quantity));
              (e.currentTarget as HTMLInputElement).blur();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              handleIncrease();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              handleDecrease();
            }
          }}
          disabled={disabled}
          className={cn(
            styles.input,
            "text-center font-semibold bg-transparent outline-none border-x border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          aria-label="Quantity"
        />
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
      {exceedMessage && exceedsMax && (
        <span className="mt-1 text-[11px] text-destructive leading-tight">
          {exceedMessage}
        </span>
      )}
    </div>
  );
}
