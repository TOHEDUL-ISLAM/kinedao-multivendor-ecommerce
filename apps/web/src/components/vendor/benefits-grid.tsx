import { Users, Package, BadgeDollarSign, HeadphonesIcon, Truck, PieChart } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function BenefitsGrid() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Users,
      title: t("vendor.apply.benefits.items.1.title"),
      description: t("vendor.apply.benefits.items.1.description"),
      colorClass: "icon-teal",
    },
    {
      icon: Package,
      title: t("vendor.apply.benefits.items.2.title"),
      description: t("vendor.apply.benefits.items.2.description"),
      colorClass: "icon-coral",
    },
    {
      icon: BadgeDollarSign,
      title: t("vendor.apply.benefits.items.3.title"),
      description: t("vendor.apply.benefits.items.3.description"),
      colorClass: "icon-pink",
    },
    {
      icon: HeadphonesIcon,
      title: t("vendor.apply.benefits.items.4.title"),
      description: t("vendor.apply.benefits.items.4.description"),
      colorClass: "icon-purple",
    },
    {
      icon: Truck,
      title: t("vendor.apply.benefits.items.5.title"),
      description: t("vendor.apply.benefits.items.5.description"),
      colorClass: "icon-teal",
    },
    {
      icon: PieChart,
      title: t("vendor.apply.benefits.items.6.title"),
      description: t("vendor.apply.benefits.items.6.description"),
      colorClass: "icon-coral",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-cream-50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("vendor.apply.benefits.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("vendor.apply.benefits.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`icon-container w-14 h-14 mb-4 ${benefit.colorClass}`}>
                <benefit.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
