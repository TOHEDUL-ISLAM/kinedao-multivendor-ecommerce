"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

// Spring config - playful & soft for baby brand
export const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const softSpring = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

export const bouncySpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};

// Fade in with slide up animation
interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.5, y = 20, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration, delay, ease: "easeOut" }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

// Viewport-triggered fade in
interface FadeInViewProps extends FadeInProps {
  once?: boolean;
  amount?: number | "some" | "all";
}

export const FadeInView = forwardRef<HTMLDivElement, FadeInViewProps>(
  ({ children, delay = 0, duration = 0.5, y = 30, once = true, amount = 0.3, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, amount }}
        transition={{ duration, delay, ease: "easeOut" }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeInView.displayName = "FadeInView";

// Stagger container for children animations
interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.1, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    const customVariants: Variants = {
      hidden: { opacity: 1 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        variants={customVariants}
        initial="hidden"
        animate="visible"
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

// Stagger item (use inside StaggerContainer)
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        variants={staggerItemVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// Scale on tap - tactile button feedback
interface ScaleOnTapProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export const ScaleOnTap = forwardRef<HTMLDivElement, ScaleOnTapProps>(
  ({ children, scale = 0.95, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        whileTap={{ scale }}
        transition={springConfig}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScaleOnTap.displayName = "ScaleOnTap";

// Hover lift effect for cards
interface HoverLiftProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  y?: number;
  className?: string;
}

export const HoverLift = forwardRef<HTMLDivElement, HoverLiftProps>(
  ({ children, y = -5, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        whileHover={{ y, transition: softSpring }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
HoverLift.displayName = "HoverLift";

// Slide up for modals/drawers
interface SlideUpProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export const SlideUp = forwardRef<HTMLDivElement, SlideUpProps>(
  ({ children, isOpen, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return isOpen ? (
        <div ref={ref} className={className}>
          {children}
        </div>
      ) : null;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: "100%" }}
        animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
        exit={{ opacity: 0, y: "100%" }}
        transition={softSpring}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SlideUp.displayName = "SlideUp";

// Pop animation for favorites heart, etc.
interface PopProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  isActive: boolean;
  className?: string;
}

export const Pop = forwardRef<HTMLDivElement, PopProps>(
  ({ children, isActive, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={bouncySpring}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Pop.displayName = "Pop";

// Overlay fade
interface OverlayProps extends Omit<HTMLMotionProps<"div">, "children" | "onClick"> {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
}

export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(
  ({ isOpen, onClick, className, ...props }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (!isOpen) return null;

    if (prefersReducedMotion) {
      return (
        <div
          ref={ref}
          onClick={onClick}
          className={className}
        />
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={className}
        {...props}
      />
    );
  }
);
Overlay.displayName = "Overlay";
