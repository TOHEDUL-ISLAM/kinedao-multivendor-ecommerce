import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function StepsAccordion() {
  const { t } = useTranslation();

  const steps = [
    {
      title: t("vendor.apply.steps.step1.title"),
      description: t("vendor.apply.steps.step1.description"),
      time: t("vendor.apply.steps.step1.time"),
    },
    {
      title: t("vendor.apply.steps.step2.title"),
      description: t("vendor.apply.steps.step2.description"),
      time: t("vendor.apply.steps.step2.time"),
    },
    {
      title: t("vendor.apply.steps.step3.title"),
      description: t("vendor.apply.steps.step3.description"),
      time: t("vendor.apply.steps.step3.time"),
    },
    {
      title: t("vendor.apply.steps.step4.title"),
      description: t("vendor.apply.steps.step4.description"),
      time: t("vendor.apply.steps.step4.time"),
    },
    {
      title: t("vendor.apply.steps.step5.title"),
      description: t("vendor.apply.steps.step5.description"),
      time: t("vendor.apply.steps.step5.time"),
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("vendor.apply.steps.title")}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {t("vendor.apply.steps.subtitle")}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Clock className="w-4 h-4" />
              <span>{t("vendor.apply.steps.totalTime")}</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
              {steps.map((step, index) => (
                <AccordionItem
                  key={step.title}
                  value={`item-${index}`}
                  className="border-b border-border last:border-b-0"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline transition-colors">
                    <div className="flex items-center gap-4 text-left">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{step.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="pl-12">
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{step.time}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
