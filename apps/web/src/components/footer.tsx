import { Link } from "@tanstack/react-router";
import { Baby, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-pink-50 to-white dark:from-pink-950/20 dark:to-background border-t border-pink-100 dark:border-pink-900/20">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Baby className="h-8 w-8 text-pink-500" />
              <span className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-blue-600 dark:from-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                কিনেদাও
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.description")}
            </p>

            {/* Social Media */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com/kinedao"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/kinedao"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-950/50 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/@kinedao"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/catalog"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("nav.shop")}
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog"
                  search={{ category: "new-arrivals" }}
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("nav.newArrivals")}
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog"
                  search={{ category: "deals" }}
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("nav.deals")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t("footer.customerService")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/help"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.helpCenter")}
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.trackOrder")}
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.returns")}
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.shipping")}
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t("footer.contactUs")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">16234</p>
                  <p className="text-xs text-muted-foreground">{t("footer.openHours")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:support@kinedao.com"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  support@kinedao.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Dhaka, Bangladesh
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment & Delivery */}
      <div className="border-t border-pink-100 dark:border-pink-900/20 bg-white/50 dark:bg-background/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("footer.paymentMethods")}:</span>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                  {t("footer.cod")}
                </div>
                <div className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                  bKash
                </div>
                <div className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                  Nagad
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🚚 {t("footer.delivery")}: 2-3 {t("footer.days")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-pink-100 dark:border-pink-900/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} কিনেদাও. {t("footer.rights")}</p>
            <div className="flex items-center gap-6">
              <Link
                to="/privacy"
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                to="/terms"
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                {t("footer.terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
