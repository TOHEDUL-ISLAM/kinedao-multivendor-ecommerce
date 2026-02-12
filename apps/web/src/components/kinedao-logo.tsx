"use client";

import { Baby } from "lucide-react";
import { cn } from "@/lib/utils";

interface KineDaoLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function KineDaoLogo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: KineDaoLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Baby className={cn("h-8 w-8 text-pink-500", iconClassName)} />
      {showText ? (
        <span
          className={cn(
            "font-bold text-2xl bg-gradient-to-r from-pink-600 to-blue-600 dark:from-pink-400 dark:to-blue-400 bg-clip-text text-transparent pb-1",
            textClassName,
          )}
        >
          কিনেদাও
        </span>
      ) : null}
    </span>
  );
}
