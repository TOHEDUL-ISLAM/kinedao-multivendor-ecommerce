import { useState, type FormEvent } from "react";
import { Mail, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { FadeInView } from "@/components/ui/motion-wrappers";
import { api } from "@/lib/api-client";

type SubscriptionStatus = "idle" | "loading" | "success" | "error";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NewsletterSection = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email.trim() || !emailRegex.test(email)) {
      toast.error(t("home.newsletter.invalidEmail"));
      return;
    }

    setStatus("loading");

    try {
      const response = await api.newsletter.subscribe.$post({
        json: { email: email.trim() },
      });

      if (!response.ok) {
        if (response.status === 409) {
          toast.info(t("home.newsletter.alreadySubscribed"));
          setStatus("idle");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).error || "Subscription failed");
      }

      setStatus("success");
      toast.success(t("home.newsletter.success"));
      setEmail("");

      // Reset status after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setStatus("error");
      toast.error(t("home.newsletter.error"));
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-baby-lavender via-baby-pink/50 to-baby-blue dark:from-baby-lavender/20 dark:via-baby-pink/10 dark:to-baby-blue/20" />

      <FadeInView>
        <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-6">
              <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3">
              {t("home.newsletter.title")}
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
              {t("home.newsletter.subtitle")}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("home.newsletter.placeholder")}
                  disabled={status === "loading" || status === "success"}
                  className="h-12 px-4 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="h-12 px-6 sm:px-8 min-w-[140px]"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("home.newsletter.subscribing")}
                  </>
                ) : status === "success" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("home.newsletter.success").split("!")[0]}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t("home.newsletter.subscribe")}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </FadeInView>
    </section>
  );
};

// Skeleton for loading state (if needed)
export const NewsletterSectionSkeleton = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-baby-lavender via-baby-pink/50 to-baby-blue dark:from-baby-lavender/20 dark:via-baby-pink/10 dark:to-baby-blue/20" />
      <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted animate-pulse mx-auto mb-6" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse mx-auto mb-3" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};
