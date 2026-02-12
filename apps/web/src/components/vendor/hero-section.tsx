import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "@tanstack/react-router";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative gradient-hero overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 dark:bg-primary/10 animate-float" />
        <div
          className="absolute top-40 right-20 w-24 h-24 rounded-full bg-secondary/10 dark:bg-secondary/20 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 left-1/4 w-16 h-16 rounded-full bg-baby-pink/50 dark:bg-baby-pink/10 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-32 right-1/3 w-20 h-20 rounded-full bg-baby-mint/50 dark:bg-baby-mint/10 animate-float"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-soft mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("vendor.apply.hero.badge")}
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {t("vendor.apply.hero.titlePrefix")}{" "}
            <span className="text-primary">{t("vendor.apply.hero.titleBrand")}</span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            {t("vendor.apply.hero.subtitle")}
          </p>

          <div
            className="flex flex-col items-center justify-center gap-3 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <Button
              asChild
              size="lg"
              className="gradient-primary hover:opacity-90 shadow-soft text-base px-8 py-6 rounded-xl"
            >
              <Link to="/vendor/apply/form">
                {t("vendor.apply.hero.cta")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">{t("vendor.apply.hero.timeNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
