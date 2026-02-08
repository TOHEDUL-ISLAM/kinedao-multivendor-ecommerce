import { Link } from "@tanstack/react-router";
import { Baby, Heart, Smile, Footprints, PersonStanding } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { FadeInView, HoverLift } from "@/components/ui/motion-wrappers";

interface AgeGroup {
  id: string;
  range: string;
  labelKey: string;
  icon: React.ElementType;
  bgColor: string;
  ageParam: string;
}

const ageGroups: AgeGroup[] = [
  {
    id: "0-3months",
    range: "0-3",
    labelKey: "home.ageGroup.0-3months",
    icon: Baby,
    bgColor: "bg-baby-pink",
    ageParam: "0-3months",
  },
  {
    id: "3-6months",
    range: "3-6",
    labelKey: "home.ageGroup.3-6months",
    icon: Heart,
    bgColor: "bg-baby-blue",
    ageParam: "3-6months",
  },
  {
    id: "6-12months",
    range: "6-12",
    labelKey: "home.ageGroup.6-12months",
    icon: Smile,
    bgColor: "bg-baby-mint",
    ageParam: "6-12months",
  },
  {
    id: "1-2years",
    range: "1-2",
    labelKey: "home.ageGroup.1-2years",
    icon: Footprints,
    bgColor: "bg-baby-lavender",
    ageParam: "1-2years",
  },
  {
    id: "2-3years",
    range: "2-3",
    labelKey: "home.ageGroup.2-3years",
    icon: PersonStanding,
    bgColor: "bg-baby-peach",
    ageParam: "2-3years",
  },
];

export const AgeGroupSection = () => {
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-4 py-8 sm:py-10">
      <FadeInView>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold mb-6 sm:mb-8">
          {t("home.shopByAge")}
        </h2>
      </FadeInView>

      {/* Mobile: Horizontal scroll, md+: 5-column grid */}
      <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-6 overflow-x-auto md:overflow-visible scrollbar-hide pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
        {ageGroups.map((group, index) => (
          <FadeInView key={group.id} delay={index * 0.05}>
            <AgeGroupCard group={group} />
          </FadeInView>
        ))}
      </div>
    </section>
  );
};

interface AgeGroupCardProps {
  group: AgeGroup;
}

const AgeGroupCard = ({ group }: AgeGroupCardProps) => {
  const { t } = useTranslation();
  const Icon = group.icon;

  return (
    <HoverLift y={-5}>
      <Link
        to="/catalog"
        search={{ q: group.ageParam }}
        className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px] sm:min-w-[110px] md:min-w-0"
      >
        {/* Circular icon container */}
        <div
          className={`
            relative flex items-center justify-center
            w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
            rounded-full ${group.bgColor}
            transition-all duration-300
            group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20
            ring-2 ring-white dark:ring-background
          `}
        >
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-foreground/70 group-hover:text-primary transition-colors" />
        </div>

        {/* Label */}
        <span className="text-xs sm:text-sm font-medium text-center text-foreground/70 group-hover:text-foreground transition-colors whitespace-nowrap">
          {t(group.labelKey as any)}
        </span>
      </Link>
    </HoverLift>
  );
};

// Skeleton for loading state
export const AgeGroupSectionSkeleton = () => {
  return (
    <section className="container mx-auto px-4 py-8 sm:py-10">
      <div className="h-8 w-40 bg-muted rounded animate-pulse mb-6 sm:mb-8" />
      <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-6 overflow-hidden pb-4 md:pb-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 min-w-[100px] sm:min-w-[110px] md:min-w-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
};
