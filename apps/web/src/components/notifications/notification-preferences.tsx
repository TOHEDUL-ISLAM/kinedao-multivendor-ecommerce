import { useState, useEffect } from "react";
import {
	Stack,
	Card,
	Text,
	Switch,
	Group,
	Button,
	Divider,
	Title,
} from "@mantine/core";
import { Bell, Mail, Volume2, CheckCircle, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { NotificationPreferencesDTO } from "@kineDao.com/api-types";

interface NotificationPreferencesProps {
	channel: "customer" | "vendor";
	language: "en" | "bn";
	isDark?: boolean;
}

const labels = {
	en: {
		title: "Notification Preferences",
		description: "Manage how you receive notifications",
		emailNotifications: "Email Notifications",
		emailEnabled: "Enable email notifications",
		pushNotifications: "Push Notifications",
		pushEnabled: "Enable browser push notifications",
		customerPreferences: "Order & Delivery Notifications",
		orderUpdates: "Order status updates",
		orderUpdatesDesc: "Get notified when your order status changes",
		deliveryAlerts: "Delivery alerts",
		deliveryAlertsDesc: "Notifications when your order is out for delivery",
		promotions: "Promotional emails",
		promotionsDesc: "Receive special offers and promotions",
		vendorPreferences: "Business Notifications",
		newOrders: "New order alerts",
		newOrdersDesc: "Get notified immediately when you receive a new order",
		lowStock: "Low stock warnings",
		lowStockDesc: "Alert when product inventory is running low",
		soundEnabled: "Sound alerts",
		soundEnabledDesc: "Play a sound when you receive a new order",
		saveChanges: "Save Changes",
		saving: "Saving...",
		saved: "Preferences saved successfully",
		error: "Failed to save preferences",
		loading: "Loading preferences...",
	},
	bn: {
		title: "নোটিফিকেশন পছন্দ",
		description: "আপনি কীভাবে নোটিফিকেশন পাবেন তা পরিচালনা করুন",
		emailNotifications: "ইমেইল নোটিফিকেশন",
		emailEnabled: "ইমেইল নোটিফিকেশন সক্ষম করুন",
		pushNotifications: "পুশ নোটিফিকেশন",
		pushEnabled: "ব্রাউজার পুশ নোটিফিকেশন সক্ষম করুন",
		customerPreferences: "অর্ডার ও ডেলিভারি নোটিফিকেশন",
		orderUpdates: "অর্ডার স্ট্যাটাস আপডেট",
		orderUpdatesDesc: "আপনার অর্ডার স্ট্যাটাস পরিবর্তিত হলে জানান পান",
		deliveryAlerts: "ডেলিভারি সতর্কতা",
		deliveryAlertsDesc: "আপনার অর্ডার ডেলিভারির জন্য প্রস্তুত হলে নোটিফিকেশন পান",
		promotions: "প্রচারমূলক ইমেইল",
		promotionsDesc: "বিশেষ অফার এবং প্রচার গ্রহণ করুন",
		vendorPreferences: "ব্যবসায়িক নোটিফিকেশন",
		newOrders: "নতুন অর্ডার সতর্কতা",
		newOrdersDesc: "নতুন অর্ডার পেলে অবিলম্বে জানান পান",
		lowStock: "কম স্টক সতর্কতা",
		lowStockDesc: "পণ্যের স্টক কম হয়ে গেলে সতর্কতা পান",
		soundEnabled: "শব্দ সতর্কতা",
		soundEnabledDesc: "নতুন অর্ডার পেলে একটি শব্দ বাজান",
		saveChanges: "পরিবর্তন সংরক্ষণ করুন",
		saving: "সংরক্ষণ করা হচ্ছে...",
		saved: "পছন্দ সফলভাবে সংরক্ষিত হয়েছে",
		error: "পছন্দ সংরক্ষণ করতে ব্যর্থ",
		loading: "পছন্দ লোড হচ্ছে...",
	},
} as const;

export function NotificationPreferences({
	channel,
	language,
	isDark = false,
}: NotificationPreferencesProps) {
	const t = labels[language];
	const queryClient = useQueryClient();

	// Fetch current preferences
	const { data: preferences, isLoading } = useQuery({
		queryKey: ["notification-preferences"],
		queryFn: async () => {
			const response = await api.notifications.preferences.$get();
			if (!response.ok) {
				throw new Error("Failed to fetch preferences");
			}
			return response.json() as Promise<NotificationPreferencesDTO>;
		},
	});

	// Local state for form
	const [formData, setFormData] = useState<NotificationPreferencesDTO | null>(
		null,
	);

	// Update local state when preferences are loaded
	useEffect(() => {
		if (preferences && !formData) {
			setFormData(preferences);
		}
	}, [preferences, formData]);

	// Update preferences mutation
	const updateMutation = useMutation({
		mutationFn: async (data: Partial<NotificationPreferencesDTO>) => {
			const response = await api.notifications.preferences.$put({
				json: data,
			});
			if (!response.ok) {
				throw new Error("Failed to update preferences");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
			toast.success(t.saved, {
				icon: <CheckCircle size={18} />,
			});
		},
		onError: () => {
			toast.error(t.error, {
				icon: <AlertTriangle size={18} />,
			});
		},
	});

	const handleToggle = (key: keyof NotificationPreferencesDTO) => {
		if (!formData) return;
		setFormData({
			...formData,
			[key]: !formData[key],
		});
	};

	const handleSave = () => {
		if (!formData) return;
		updateMutation.mutate(formData);
	};

	if (isLoading || !preferences || !formData) {
		return (
			<Card
				padding="xl"
				radius="lg"
				style={{
					background: isDark
						? "oklch(0.2 0.02 260)"
						: "oklch(0.99 0.005 260)",
				}}
			>
				<Text size="sm" c="dimmed">
					{t.loading}
				</Text>
			</Card>
		);
	}

	return (
		<Stack gap="lg">
			<div>
				<Title
					order={3}
					style={{
						color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
					}}
				>
					{t.title}
				</Title>
				<Text
					size="sm"
					c="dimmed"
					style={{
						color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)",
					}}
				>
					{t.description}
				</Text>
			</div>

			{/* Email Notifications */}
			<Card
				padding="lg"
				radius="lg"
				style={{
					background: isDark
						? "oklch(0.2 0.02 260)"
						: "oklch(0.99 0.005 260)",
					border: isDark
						? "1px solid oklch(0.3 0.02 260)"
						: "1px solid oklch(0.92 0.01 260)",
				}}
			>
				<Group justify="space-between" mb="md">
					<Group gap="sm">
						<Mail
							size={20}
							style={{ color: "oklch(0.65 0.15 175)" }}
						/>
						<Text
							fw={600}
							style={{
								color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
							}}
						>
							{t.emailNotifications}
						</Text>
					</Group>
					<Switch
						checked={formData.emailEnabled}
						onChange={() => handleToggle("emailEnabled")}
						color="teal"
					/>
				</Group>

				{formData.emailEnabled && (
					<>
						<Divider my="sm" />
						<Stack gap="md">
							{channel === "customer" ? (
								<>
									<Group justify="space-between">
										<div style={{ flex: 1 }}>
											<Text size="sm" fw={500}>
												{t.orderUpdates}
											</Text>
											<Text size="xs" c="dimmed">
												{t.orderUpdatesDesc}
											</Text>
										</div>
										<Switch
											checked={formData.orderUpdates}
											onChange={() => handleToggle("orderUpdates")}
											color="teal"
										/>
									</Group>

									<Group justify="space-between">
										<div style={{ flex: 1 }}>
											<Text size="sm" fw={500}>
												{t.deliveryAlerts}
											</Text>
											<Text size="xs" c="dimmed">
												{t.deliveryAlertsDesc}
											</Text>
										</div>
										<Switch
											checked={formData.deliveryAlerts}
											onChange={() => handleToggle("deliveryAlerts")}
											color="teal"
										/>
									</Group>

									<Group justify="space-between">
										<div style={{ flex: 1 }}>
											<Text size="sm" fw={500}>
												{t.promotions}
											</Text>
											<Text size="xs" c="dimmed">
												{t.promotionsDesc}
											</Text>
										</div>
										<Switch
											checked={formData.promotions}
											onChange={() => handleToggle("promotions")}
											color="teal"
										/>
									</Group>
								</>
							) : (
								<>
									<Group justify="space-between">
										<div style={{ flex: 1 }}>
											<Text size="sm" fw={500}>
												{t.newOrders}
											</Text>
											<Text size="xs" c="dimmed">
												{t.newOrdersDesc}
											</Text>
										</div>
										<Switch
											checked={formData.newOrders}
											onChange={() => handleToggle("newOrders")}
											color="teal"
										/>
									</Group>

									<Group justify="space-between">
										<div style={{ flex: 1 }}>
											<Text size="sm" fw={500}>
												{t.lowStock}
											</Text>
											<Text size="xs" c="dimmed">
												{t.lowStockDesc}
											</Text>
										</div>
										<Switch
											checked={formData.lowStock}
											onChange={() => handleToggle("lowStock")}
											color="teal"
										/>
									</Group>
								</>
							)}
						</Stack>
					</>
				)}
			</Card>

			{/* Push Notifications */}
			<Card
				padding="lg"
				radius="lg"
				style={{
					background: isDark
						? "oklch(0.2 0.02 260)"
						: "oklch(0.99 0.005 260)",
					border: isDark
						? "1px solid oklch(0.3 0.02 260)"
						: "1px solid oklch(0.92 0.01 260)",
				}}
			>
				<Group justify="space-between">
					<Group gap="sm">
						<Bell
							size={20}
							style={{ color: "oklch(0.65 0.15 175)" }}
						/>
						<Text
							fw={600}
							style={{
								color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
							}}
						>
							{t.pushNotifications}
						</Text>
					</Group>
					<Switch
						checked={formData.pushEnabled}
						onChange={() => handleToggle("pushEnabled")}
						color="teal"
					/>
				</Group>
				<Text
					size="xs"
					c="dimmed"
					mt="xs"
					style={{
						color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)",
					}}
				>
					{t.pushEnabled}
				</Text>
			</Card>

			{/* Sound Alerts (Vendor only) */}
			{channel === "vendor" && (
				<Card
					padding="lg"
					radius="lg"
					style={{
						background: isDark
							? "oklch(0.2 0.02 260)"
							: "oklch(0.99 0.005 260)",
						border: isDark
							? "1px solid oklch(0.3 0.02 260)"
							: "1px solid oklch(0.92 0.01 260)",
					}}
				>
					<Group justify="space-between">
						<Group gap="sm">
							<Volume2
								size={20}
								style={{ color: "oklch(0.65 0.15 175)" }}
							/>
							<div style={{ flex: 1 }}>
								<Text
									fw={600}
									style={{
										color: isDark
											? "oklch(0.9 0.02 260)"
											: "oklch(0.3 0.02 260)",
									}}
								>
									{t.soundEnabled}
								</Text>
								<Text
									size="xs"
									c="dimmed"
									style={{
										color: isDark
											? "oklch(0.65 0.02 260)"
											: "oklch(0.5 0.02 260)",
									}}
								>
									{t.soundEnabledDesc}
								</Text>
							</div>
						</Group>
						<Switch
							checked={formData.soundEnabled}
							onChange={() => handleToggle("soundEnabled")}
							color="teal"
						/>
					</Group>
				</Card>
			)}

			{/* Save Button */}
			<Button
				onClick={handleSave}
				loading={updateMutation.isPending}
				size="md"
				style={{
					background:
						"linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
				}}
			>
				{updateMutation.isPending ? t.saving : t.saveChanges}
			</Button>
		</Stack>
	);
}
