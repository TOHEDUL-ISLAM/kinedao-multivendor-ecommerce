import { createFileRoute } from "@tanstack/react-router";
import { Stack, Tabs, Title } from "@mantine/core";
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
		<Stack gap="md">
			<Title order={2}>{labels.pageTitle}</Title>
			<Tabs value={search.tab} onChange={onTabChange}>
				<Tabs.List>
					<Tabs.Tab value="hero">{labels.heroTab}</Tabs.Tab>
					<Tabs.Tab value="side">{labels.sideTab}</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="hero" pt="md">
					<HeroBannerTab labels={labels} />
				</Tabs.Panel>

				<Tabs.Panel value="side" pt="md">
					<SideCardsTab labels={labels} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
