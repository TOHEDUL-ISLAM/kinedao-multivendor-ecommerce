import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function FAQSection() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("vendor.apply.faq.items.1.question"),
      answer: t("vendor.apply.faq.items.1.answer"),
    },
    {
      question: t("vendor.apply.faq.items.2.question"),
      answer: t("vendor.apply.faq.items.2.answer"),
    },
    {
      question: t("vendor.apply.faq.items.3.question"),
      answer: t("vendor.apply.faq.items.3.answer"),
    },
    {
      question: t("vendor.apply.faq.items.4.question"),
      answer: t("vendor.apply.faq.items.4.answer"),
    },
    {
      question: t("vendor.apply.faq.items.5.question"),
      answer: t("vendor.apply.faq.items.5.answer"),
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-cream-50">
      <div className="container max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">
          {t("vendor.apply.faq.title")}
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${index}`}
              className="bg-card rounded-xl border-none shadow-soft overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-5 hover:bg-muted/50 hover:no-underline transition-colors text-left">
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5">
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8">
          <Button variant="default" className="gradient-primary hover:opacity-90 rounded-xl px-5">
            <HelpCircle className="w-4 h-4 mr-2" />
            {t("vendor.apply.faq.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
