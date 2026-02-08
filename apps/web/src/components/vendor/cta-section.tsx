import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "@tanstack/react-router";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="gradient-hero rounded-2xl md:rounded-3xl p-8 md:p-12 shadow-card">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {t("vendor.apply.cta.title")}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t("vendor.apply.cta.subtitle")}
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="gradient-primary hover:opacity-90 shadow-soft font-semibold px-8 py-6 rounded-xl shrink-0"
            >
              <Link to="/vendor/apply/form">
                {t("vendor.apply.cta.button")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
