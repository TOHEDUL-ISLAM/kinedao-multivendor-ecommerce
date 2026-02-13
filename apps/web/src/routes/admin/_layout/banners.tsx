import { createFileRoute } from "@tanstack/react-router";
import { Group, Paper, Stack, Tabs, Text, ThemeIcon, Title } from "@mantine/core";
import { LayoutTemplate, PanelsTopLeft } from "lucide-react";
import { z } from "zod";
import { HeroBannerTab } from "@/components/admin/banners/hero-banner-tab";
import { SideCardsTab } from "@/components/admin/banners/side-cards-tab";
import { bannerLabels } from "@/components/admin/banners/banner-labels";
import { useLanguage } from "@/lib/i18n/use-language";

const bannerSearchSchema = z.object({
	tab: z.enum(["hero", "side"]).catch("hero"),
});

export const Route = createFileRoute("/admin/_layout/banners")({
	validateSearch: bannerSearchSchema,
	component: AdminBannersPage,
});

function AdminBannersPage() {
	const { language } = useLanguage();
	const labels = bannerLabels[language];
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const onTabChange = (value: string | null) => {
		if (value !== "hero" && value !== "side") return;
		navigate({ search: { ...search, tab: value } });
	};

	return (
		<Stack gap="lg">
			<Paper
				withBorder
				radius="lg"
				p="lg"
				className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-baby-mint/20 to-baby-blue/20 dark:border-primary/30 dark:from-primary/15 dark:via-zinc-900 dark:to-zinc-800"
			>
				<div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/20 blur-2xl dark:bg-primary/30" />
				<Group justify="space-between" align="center">
					<Stack gap={2}>
						<Text size="xs" fw={700} c="dimmed" tt="uppercase">
							Admin CMS
						</Text>
						<Title order={2}>{labels.pageTitle}</Title>
						<Text size="sm" c="dimmed">
							Manage hero carousel banners and promotional side-card slots.
						</Text>
					</Stack>
					<ThemeIcon
						size={44}
						radius="xl"
						variant="light"
						color="teal"
						className="shadow-sm"
					>
						<LayoutTemplate size={22} />
					</ThemeIcon>
				</Group>
			</Paper>

			<Tabs
				value={search.tab}
				onChange={onTabChange}
				classNames={{
					list: "grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-white/70 p-1 shadow-sm dark:bg-zinc-900/40",
					tab: "h-12 rounded-xl border border-transparent px-4 font-semibold text-foreground/80 transition-all hover:bg-primary/5 hover:text-foreground data-[active]:border-primary/20 data-[active]:bg-primary/12 data-[active]:text-foreground data-[active]:shadow-sm dark:hover:bg-primary/10 dark:data-[active]:border-primary/30 dark:data-[active]:bg-primary/20",
					panel: "pt-5",
				}}
			>
				<Tabs.List>
					<Tabs.Tab value="hero">
						<span className="mx-auto inline-flex items-center gap-2">
							<PanelsTopLeft size={16} />
							<span>{labels.heroTab}</span>
						</span>
					</Tabs.Tab>
					<Tabs.Tab value="side">
						<span className="mx-auto inline-flex items-center gap-2">
							<LayoutTemplate size={16} />
							<span>{labels.sideTab}</span>
						</span>
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="hero">
					<HeroBannerTab labels={labels} />
				</Tabs.Panel>

				<Tabs.Panel value="side">
					<SideCardsTab labels={labels} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
