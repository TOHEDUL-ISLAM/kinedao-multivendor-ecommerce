import { z } from "zod";

export const topBarAnnouncementSchema = z.object({
	textEn: z
		.string()
		.trim()
		.min(1, "English announcement is required")
		.max(180, "Maximum 180 characters"),
	textBn: z
		.string()
		.trim()
		.max(180, "Maximum 180 characters")
		.nullable(),
	isActive: z.boolean(),
});

export interface TopBarAnnouncementDTO {
	textEn: string;
	textBn: string | null;
	isActive: boolean;
}

export const adminTopBarAnnouncementUpdateSchema = z.object({
	textEn: z
		.string()
		.trim()
		.min(1, "English announcement is required")
		.max(180, "Maximum 180 characters"),
	textBn: z
		.string()
		.trim()
		.max(180, "Maximum 180 characters")
		.optional(),
	isActive: z.boolean().default(true),
});

export type AdminTopBarAnnouncementUpdateInput = z.infer<
	typeof adminTopBarAnnouncementUpdateSchema
>;
