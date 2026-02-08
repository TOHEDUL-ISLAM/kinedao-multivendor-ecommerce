import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "../hooks/use-translation";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

function Checkout() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t("cart.checkout")}</h1>
    </div>
  );
}
