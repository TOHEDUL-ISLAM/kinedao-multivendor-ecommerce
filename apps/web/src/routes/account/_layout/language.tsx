import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronLeft, Languages } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/use-language";
import type { Language } from "@/lib/i18n/translations";

export const Route = createFileRoute("/account/_layout/language")({
  component: AccountLanguagePage,
});

function AccountLanguagePage() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="rounded-2xl border-primary/15 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="inline-flex items-center gap-2 text-base sm:text-lg">
              <Languages className="h-5 w-5 text-primary" />
              Language Preference
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select your preferred language for the full website.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/account/settings">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <LanguageCard
              label="English"
              description="Default UI language"
              value="en"
              selected={language === "en"}
              onSelect={setLanguage}
            />
            <LanguageCard
              label="বাংলা"
              description="বাংলা ইন্টারফেস ভাষা"
              value="bn"
              selected={language === "bn"}
              onSelect={setLanguage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LanguageCard({
  label,
  description,
  value,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  value: Language;
  selected: boolean;
  onSelect: (language: Language) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border/70 bg-card/80 hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {selected ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </button>
  );
}
