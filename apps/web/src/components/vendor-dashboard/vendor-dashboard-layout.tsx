import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AppShell,
  Group,
  Text,
  UnstyledButton,
  Stack,
  Burger,
  Avatar,
  Box,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Settings,
  Baby,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/use-language";
import type { Language } from "@/lib/i18n/translations";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface NavItem {
  icon: LucideIcon;
  label: Record<Language, string>;
  href: string;
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: { en: "Dashboard", bn: "ড্যাশবোর্ড" },
    href: "/vendor/dashboard",
  },
  {
    icon: Package,
    label: { en: "Products", bn: "পণ্য" },
    href: "/vendor/products",
  },
  {
    icon: ShoppingBag,
    label: { en: "Orders", bn: "অর্ডার" },
    href: "/vendor/orders",
  },
  {
    icon: Wallet,
    label: { en: "Earnings", bn: "আয়" },
    href: "/vendor/earnings",
  },
  {
    icon: Settings,
    label: { en: "Settings", bn: "সেটিংস" },
    href: "/vendor/settings",
  },
];

interface VendorDashboardLayoutProps {
  children: React.ReactNode;
  vendorName: string;
}

export function VendorDashboardLayout({
  children,
  vendorName,
}: VendorDashboardLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const { language } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isActive = (href: string) => {
    if (href === "/vendor/dashboard") {
      return location.pathname === "/vendor/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="xl"
      styles={{
        header: {
          background: isDark
            ? "linear-gradient(135deg, oklch(0.2 0.02 260) 0%, oklch(0.18 0.03 240) 100%)"
            : "linear-gradient(135deg, oklch(0.98 0.01 90) 0%, oklch(0.96 0.02 160) 100%)",
          borderBottom: isDark
            ? "1px solid oklch(0.3 0.02 260 / 0.3)"
            : "1px solid oklch(0.92 0.01 260 / 0.3)",
          backdropFilter: "blur(10px)",
        },
        navbar: {
          background: isDark
            ? "linear-gradient(180deg, oklch(0.22 0.02 260) 0%, oklch(0.19 0.02 250) 100%)"
            : "linear-gradient(180deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
          borderRight: isDark
            ? "1px solid oklch(0.3 0.02 260 / 0.3)"
            : "1px solid oklch(0.92 0.01 260 / 0.2)",
          boxShadow: isDark
            ? "2px 0 20px oklch(0 0 0 / 0.3)"
            : "2px 0 20px oklch(0.65 0.15 175 / 0.05)",
        },
        main: {
          background: isDark
            ? "linear-gradient(135deg, oklch(0.16 0.02 260) 0%, oklch(0.14 0.02 250) 100%)"
            : "linear-gradient(135deg, oklch(0.985 0.005 100) 0%, oklch(0.975 0.01 170) 100%)",
          minHeight: "100vh",
        },
      }}
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              style={{
                color: "oklch(0.65 0.15 175)",
              }}
            />
            <Link
              to="/vendor/dashboard"
              style={{ textDecoration: "none" }}
            >
              <Group gap="sm">
                <Baby
                  size={32}
                  style={{
                    color: "oklch(0.85 0.1 350)",
                    filter: "drop-shadow(0 2px 4px oklch(0.85 0.1 350 / 0.3))",
                  }}
                  strokeWidth={2}
                />
                <Box visibleFrom="xs">
                  <Text
                    fw={700}
                    size="xl"
                    style={{
                      color: isDark ? "oklch(0.82 0.12 335)" : "oklch(0.58 0.18 335)",
                      lineHeight: 1.2,
                      display: "block",
                      fontFamily:
                        "'Noto Sans Bengali', 'Hind Siliguri', Inter, sans-serif",
                    }}
                  >
                    কিনেদাও
                  </Text>
                  <Text
                    size="xs"
                    mt={-2}
                    style={{
                      color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)",
                    }}
                  >
                    {language === "bn" ? "বিক্রেতা ড্যাশবোর্ড" : "Vendor Portal"}
                  </Text>
                </Box>
              </Group>
            </Link>
          </Group>

          <Group gap="md">
            <NotificationBell />
            <Box visibleFrom="sm">
              <LanguageToggle />
            </Box>
            <Box visibleFrom="sm">
              <ActionIcon
                variant="subtle"
                size="lg"
                radius="md"
                onClick={toggleTheme}
                style={{
                  color: isDark ? "oklch(0.75 0.15 175)" : "oklch(0.65 0.15 175)",
                  backgroundColor: isDark ? "oklch(0.25 0.02 260)" : "transparent",
                }}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </ActionIcon>
            </Box>
            <Group gap="xs">
              <Avatar
                size={40}
                radius="xl"
                style={{
                  background: "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.75 0.12 160) 100%)",
                  border: isDark ? "2px solid oklch(0.3 0.02 260)" : "2px solid oklch(1 0 0)",
                  boxShadow: isDark
                    ? "0 2px 8px oklch(0 0 0 / 0.5)"
                    : "0 2px 8px oklch(0.65 0.15 175 / 0.2)",
                }}
              >
                <Text size="lg" fw={600} c="white">
                  {vendorName?.charAt(0)?.toUpperCase() || "V"}
                </Text>
              </Avatar>
              <Box visibleFrom="sm">
                <Text
                  size="sm"
                  fw={600}
                  style={{
                    color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
                  }}
                >
                  {vendorName}
                </Text>
                <Text
                  size="xs"
                  mt={-2}
                  style={{
                    color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)",
                  }}
                >
                  {language === "bn" ? "বিক্রেতা" : "Vendor"}
                </Text>
              </Box>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar Navigation */}
      <AppShell.Navbar p="lg">
        <AppShell.Section grow>
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            mb="md"
            px="xs"
            style={{
              letterSpacing: "0.5px",
              color: isDark ? "oklch(0.55 0.02 260)" : "oklch(0.5 0.02 260)",
            }}
          >
            {language === "bn" ? "প্রধান মেনু" : "Main Menu"}
          </Text>
          <Stack gap={6}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <UnstyledButton
                  key={item.href}
                  component={Link}
                  to={item.href}
                  onClick={close}
                  py={12}
                  px={16}
                  style={{
                    borderRadius: "12px",
                    background: active
                      ? "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)"
                      : "transparent",
                    color: active
                      ? "white"
                      : isDark
                        ? "oklch(0.75 0.02 260)"
                        : "oklch(0.4 0.02 260)",
                    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    border: active ? "none" : "1px solid transparent",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: active ? "0 4px 12px oklch(0.65 0.15 175 / 0.3)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = isDark
                        ? "oklch(0.25 0.02 260)"
                        : "oklch(0.96 0.01 175)";
                      e.currentTarget.style.borderColor = isDark
                        ? "oklch(0.65 0.15 175 / 0.25)"
                        : "oklch(0.65 0.15 175 / 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  <Group gap="md" wrap="nowrap">
                    <Box
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: active ? 0 : 0,
                      }}
                    >
                      <item.icon
                        size={20}
                        strokeWidth={active ? 2.5 : 2}
                        style={{
                          filter: active ? "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" : "none",
                        }}
                      />
                    </Box>
                    <Text size="sm" fw={active ? 600 : 500}>
                      {item.label[language]}
                    </Text>
                  </Group>
                  {active && (
                    <Box
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "white",
                        boxShadow: "0 0 8px white",
                      }}
                    />
                  )}
                </UnstyledButton>
              );
            })}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        <Box maw={1400} mx="auto">
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
