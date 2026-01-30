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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-6 flex flex-col items-start text-left">
            <Link to="/" className="flex items-center gap-2 group">
              <Baby className="h-8 w-8 text-pink-500 transition-transform group-hover:scale-110" />
              <span className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-blue-600 dark:from-pink-400 dark:to-blue-400 bg-clip-text text-transparent pb-1">
                কিনেদাও
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>

            {/* Social Media */}
            <div className="flex items-center gap-4 justify-start w-full">
              <a
                href="https://facebook.com/kinedao"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 transition-all hover:scale-110 active:scale-95"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/kinedao"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-950/50 transition-all hover:scale-110 active:scale-95"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/@kinedao"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 transition-all hover:scale-110 active:scale-95"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Grid for Mobile (Quick Links + Customer Service) */}
          <div className="grid grid-cols-2 gap-8">
            {/* Quick Links */}
            <div className="text-left">
              <h3 className="font-semibold text-lg mb-4 text-foreground">{t("footer.quickLinks")}</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/catalog"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("nav.shop")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/catalog"
                    search={{ category: "new-arrivals" }}
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("nav.newArrivals")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/catalog"
                    search={{ category: "deals" }}
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("nav.deals")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.about")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.contact")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="text-left">
              <h3 className="font-semibold text-lg mb-4 text-foreground">{t("footer.customerService")}</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/help"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.helpCenter")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/track-order"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.trackOrder")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/returns"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.returns")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shipping"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.shipping")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors inline-block py-1"
                  >
                    {t("footer.faq")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col items-start text-left space-y-6">
            <h3 className="font-semibold text-lg mb-4 text-foreground">{t("footer.contactUs")}</h3>
            <ul className="space-y-4 w-full">
              <li className="flex flex-row items-start gap-3">
                <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-950/30 text-pink-500 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-bold">16234</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("footer.openHours")}</p>
                </div>
              </li>
              <li className="flex flex-row items-start gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <a
                  href="mailto:support@kinedao.com"
                  className="text-sm text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  support@kinedao.com
                </a>
              </li>
              <li className="flex flex-row items-start gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-950/30 text-green-500 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
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
        <div className="container mx-auto px-4 py-8 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground text-center md:text-left">
              <span className="font-medium">{t("footer.paymentMethods")}:</span>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider">
                  {t("footer.cod")}
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider">
                  bKash
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider">
                  Nagad
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 px-4 py-2 rounded-full">
              <span>🚚 {t("footer.delivery")}: 2-3 {t("footer.days")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-pink-100 dark:border-pink-900/20">
        <div className="container mx-auto px-4 py-8 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground text-center md:text-left">
            <p className="order-2 md:order-1">© {currentYear} কিনেদাও. {t("footer.rights")}</p>
            <div className="flex items-center gap-8 order-1 md:order-2">
              <Link
                to="/privacy"
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                to="/terms"
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium"
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
