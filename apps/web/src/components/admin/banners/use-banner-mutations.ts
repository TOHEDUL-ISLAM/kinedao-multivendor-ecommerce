import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	AdminHeroBannerFormInput,
	AdminSideCardFormInput,
} from "@kineDao.com/api-types/admin";
import { api } from "@/lib/api-client";
import { getApiOrigin } from "@/lib/api-origin";

interface UploadBannerImageResponse {
	url: string;
	s3Key: string;
}

interface ReorderPayload {
	banners: Array<{
		id: string;
		sortOrder: number;
	}>;
}

function isUploadBannerImageResponse(
	value: unknown,
): value is UploadBannerImageResponse {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as { url?: unknown; s3Key?: unknown };
	return typeof candidate.url === "string" && typeof candidate.s3Key === "string";
}

async function parseErrorMessage(
	response: Response,
	fallback: string,
): Promise<string> {
	try {
		const payload: unknown = await response.json();
		if (!payload || typeof payload !== "object") {
			return fallback;
		}

		const candidate = payload as { error?: unknown; message?: unknown };
		if (typeof candidate.error === "string" && candidate.error.trim()) {
			return candidate.error;
		}
		if (typeof candidate.message === "string" && candidate.message.trim()) {
			return candidate.message;
		}
	} catch {
		// Keep fallback when response body is unavailable.
	}

	return fallback;
}

async function invalidateBannerQueries(queryClient: ReturnType<typeof useQueryClient>) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
		queryClient.invalidateQueries({ queryKey: ["banners"] }),
	]);
}

export function useUploadBannerImage() {
	return useMutation<UploadBannerImageResponse, Error, File>({
		mutationFn: async (file) => {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(
				`${getApiOrigin()}/api/upload?category=banners`,
				{
					method: "POST",
					body: formData,
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(
					await parseErrorMessage(response, "Failed to upload banner image"),
				);
			}

			const payload: unknown = await response.json();
			if (!isUploadBannerImageResponse(payload)) {
				throw new Error("Invalid upload response");
			}

			return payload;
		},
	});
}

export function useCreateHeroBanner() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: AdminHeroBannerFormInput) => {
			const response = await api.admin.banners.hero.$post({ json: input });
			if (!response.ok) {
				throw new Error(
					await parseErrorMessage(response, "Failed to create hero banner"),
				);
			}
		},
		onSuccess: async () => {
			await invalidateBannerQueries(queryClient);
		},
	});
}

export function useUpdateHeroBanner() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: {
			bannerId: string;
			input: AdminHeroBannerFormInput;
		}) => {
			const response = await api.admin.banners.hero[":bannerId"].$put({
				param: { bannerId: params.bannerId },
				json: params.input,
			});
			if (!response.ok) {
				throw new Error(
					await parseErrorMessage(response, "Failed to update hero banner"),
				);
			}
		},
		onSuccess: async () => {
			await invalidateBannerQueries(queryClient);
		},
	});
}

export function useDeleteBanner() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bannerId: string) => {
			const response = await api.admin.banners[":bannerId"].$delete({
				param: { bannerId },
			});
			if (!response.ok) {
				throw new Error(await parseErrorMessage(response, "Failed to delete banner"));
			}
		},
		onSuccess: async () => {
			await invalidateBannerQueries(queryClient);
		},
	});
}

export function useReorderBanners() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: ReorderPayload) => {
			const response = await api.admin.banners.reorder.$patch({ json: input });
			if (!response.ok) {
				throw new Error(await parseErrorMessage(response, "Failed to reorder banners"));
			}
		},
		onSuccess: async () => {
			await invalidateBannerQueries(queryClient);
		},
	});
}

export function useCreateSideCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: AdminSideCardFormInput) => {
			const response = await api.admin.banners["side-cards"].$post({ json: input });
			if (!response.ok) {
				throw new Error(
					await parseErrorMessage(response, "Failed to create side card"),
				);
			}
		},
		onSuccess: async () => {
			await invalidateBannerQueries(queryClient);
		},
	});
}

export function useUpdateSideCard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: {
			bannerId: string;
			input: AdminSideCardFormInput;
		}) => {
			const response = await api.admin.banners["side-cards"][":bannerId"].$put({
				param: { bannerId: params.bannerId },
				json: params.input,
			});
			if (!response.ok) {
				throw new Error(
					await parseErrorMessage(response, "Failed to update side card"),
				);
			}
		},
		onSuccess: async () => {
			await invalidateBannerQueries(queryClient);
		},
	});
}
