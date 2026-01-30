import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { FadeInView } from "@/components/ui/motion-wrappers";
import { cn } from "@/lib/utils";

export interface TestimonialDTO {
  id: string;
  quote: string;
  quoteBn: string | null;
  customerName: string;
  location: string | null;
  locationBn: string | null;
  avatarUrl: string | null;
  rating: number | null;
}

interface TestimonialsSectionProps {
  testimonials?: TestimonialDTO[];
}

export const TestimonialsSection = ({ testimonials = [] }: TestimonialsSectionProps) => {
  const { language, t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    if (testimonials.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length, isPaused]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsPaused(true);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsPaused(false), 10000);
  }, [testimonials.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, [testimonials.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section
      className="container mx-auto px-4 py-10 sm:py-12 lg:py-16"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <FadeInView>
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold mb-2">
            {t("home.testimonials")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("home.testimonials.subtitle")}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows - Hidden on mobile */}
          {testimonials.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full hidden sm:flex"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full hidden sm:flex"
                onClick={goToNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Testimonial Cards */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  language={language}
                />
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </FadeInView>
    </section>
  );
};

interface TestimonialCardProps {
  testimonial: TestimonialDTO;
  language: string;
}

const TestimonialCard = ({ testimonial, language }: TestimonialCardProps) => {
  const displayQuote =
    language === "bn" && testimonial.quoteBn ? testimonial.quoteBn : testimonial.quote;
  const displayLocation =
    language === "bn" && testimonial.locationBn
      ? testimonial.locationBn
      : testimonial.location;

  return (
    <div className="w-full flex-shrink-0 px-4">
      <div className="bg-secondary/30 dark:bg-secondary/20 rounded-2xl p-6 sm:p-8 lg:p-10">
        {/* Quote Icon */}
        <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-primary/30 mb-4" />

        {/* Quote Text */}
        <blockquote className="text-base sm:text-lg md:text-xl text-foreground/90 mb-6 leading-relaxed">
          "{displayQuote}"
        </blockquote>

        {/* Customer Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {testimonial.avatarUrl ? (
              <img
                src={testimonial.avatarUrl}
                alt={testimonial.customerName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-lg font-semibold">
                {testimonial.customerName.charAt(0)}
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className="flex-1">
            <p className="font-semibold text-foreground">{testimonial.customerName}</p>
            {displayLocation && (
              <p className="text-sm text-muted-foreground">{displayLocation}</p>
            )}
          </div>

          {/* Rating */}
          {testimonial.rating && (
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < testimonial.rating!
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton for loading state
export const TestimonialsSectionSkeleton = () => {
  return (
    <section className="container mx-auto px-4 py-10 sm:py-12 lg:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto mb-2" />
        <div className="h-5 w-64 bg-muted rounded animate-pulse mx-auto" />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-secondary/30 rounded-2xl p-6 sm:p-8 lg:p-10">
          <div className="w-10 h-10 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-2 mb-6">
            <div className="h-5 w-full bg-muted rounded animate-pulse" />
            <div className="h-5 w-full bg-muted rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse mb-1" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
};
