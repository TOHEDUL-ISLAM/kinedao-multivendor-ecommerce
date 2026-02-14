import {
	topBarAnnouncementSchema,
	type TopBarAnnouncementDTO,
} from "@kineDao.com/api-types/site-settings";

export const TOP_BAR_ANNOUNCEMENT_SETTING_KEY = "top_bar_announcement";

export const DEFAULT_TOP_BAR_ANNOUNCEMENT: TopBarAnnouncementDTO = {
	textEn: "Free shipping on orders over ৳1,000",
	textBn: "৳১,০০০+ অর্ডারে ফ্রি শিপিং",
	isActive: true,
};

export function parseTopBarAnnouncement(
	value: unknown,
): TopBarAnnouncementDTO {
	const parsed = topBarAnnouncementSchema.safeParse(value);
	if (!parsed.success) {
		return DEFAULT_TOP_BAR_ANNOUNCEMENT;
	}

	return {
		textEn: parsed.data.textEn,
		textBn: parsed.data.textBn ? parsed.data.textBn : null,
		isActive: parsed.data.isActive,
	};
}
