import { useState, useEffect } from "react";
import { Modal, Button, Text, Stack, Group, List } from "@mantine/core";
import { Bell, X } from "lucide-react";
import {
	subscribeToPush,
	isPushSupported,
	getNotificationPermission,
	isSubscribedToPush,
} from "@/lib/push-notifications";
import { toast } from "sonner";

interface PushNotificationPromptProps {
	context: "customer" | "vendor";
	language: "en" | "bn";
}

const labels = {
	en: {
		customer: {
			title: "Stay Updated on Your Orders",
			description:
				"Get instant notifications when your order status changes - from confirmation to delivery.",
			benefits: [
				"Know when your order is confirmed",
				"Track when it ships",
				"Get notified on delivery",
				"Never miss important updates",
			],
			enable: "Enable Notifications",
			notNow: "Not Now",
			success: "Notifications enabled! You'll receive order updates.",
			error: "Could not enable notifications. Please try again later.",
			denied:
				"Notifications are blocked. Please enable them in your browser settings.",
		},
		vendor: {
			title: "Never Miss a New Order",
			description:
				"Get instant alerts when customers place orders - even when you're away from your computer.",
			benefits: [
				"Instant new order alerts",
				"Sound notification for urgency",
				"Respond faster to customers",
				"Stay on top of your business",
			],
			enable: "Enable Notifications",
			notNow: "Not Now",
			success: "Notifications enabled! You'll receive instant order alerts.",
			error: "Could not enable notifications. Please try again later.",
			denied:
				"Notifications are blocked. Please enable them in your browser settings.",
		},
	},
	bn: {
		customer: {
			title: "আপনার অর্ডারের আপডেট পান",
			description:
				"আপনার অর্ডারের স্ট্যাটাস পরিবর্তিত হলে তাৎক্ষণিক নোটিফিকেশন পান - নিশ্চিতকরণ থেকে ডেলিভারি পর্যন্ত।",
			benefits: [
				"অর্ডার নিশ্চিত হলে জানুন",
				"শিপমেন্ট ট্র্যাক করুন",
				"ডেলিভারিতে নোটিফিকেশন পান",
				"গুরুত্বপূর্ণ আপডেট মিস করবেন না",
			],
			enable: "নোটিফিকেশন চালু করুন",
			notNow: "এখন নয়",
			success: "নোটিফিকেশন চালু হয়েছে! আপনি অর্ডার আপডেট পাবেন।",
			error: "নোটিফিকেশন চালু করা যায়নি। পরে আবার চেষ্টা করুন।",
			denied:
				"নোটিফিকেশন ব্লক করা আছে। অনুগ্রহ করে আপনার ব্রাউজার সেটিংসে এটি সক্ষম করুন।",
		},
		vendor: {
			title: "নতুন অর্ডার মিস করবেন না",
			description:
				"গ্রাহকরা অর্ডার দিলে তাৎক্ষণিক সতর্কতা পান - এমনকি আপনি কম্পিউটার থেকে দূরে থাকলেও।",
			benefits: [
				"তাৎক্ষণিক নতুন অর্ডার সতর্কতা",
				"জরুরি জন্য শব্দ নোটিফিকেশন",
				"গ্রাহকদের দ্রুত সাড়া দিন",
				"আপনার ব্যবসার উপর নজর রাখুন",
			],
			enable: "নোটিফিকেশন চালু করুন",
			notNow: "এখন নয়",
			success: "নোটিফিকেশন চালু হয়েছে! আপনি তাৎক্ষণিক অর্ডার সতর্কতা পাবেন।",
			error: "নোটিফিকেশন চালু করা যায়নি। পরে আবার চেষ্টা করুন।",
			denied:
				"নোটিফিকেশন ব্লক করা আছে। অনুগ্রহ করে আপনার ব্রাউজার সেটিংসে এটি সক্ষম করুন।",
		},
	},
} as const;

const STORAGE_KEY_PREFIX = "push-prompt-dismissed";

export function PushNotificationPrompt({
	context,
	language,
}: PushNotificationPromptProps) {
	const [opened, setOpened] = useState(false);
	const [isEnabling, setIsEnabling] = useState(false);

	const t = labels[language][context];
	const storageKey = `${STORAGE_KEY_PREFIX}-${context}`;

	useEffect(() => {
		// Check if we should show the prompt
		const checkShouldShow = async () => {
			// Don't show if push is not supported
			if (!isPushSupported()) {
				return;
			}

			// Don't show if already subscribed
			const alreadySubscribed = await isSubscribedToPush();
			if (alreadySubscribed) {
				return;
			}

			// Don't show if user already dismissed
			const dismissed = localStorage.getItem(storageKey);
			if (dismissed === "true") {
				return;
			}

			// Don't show if permission is already denied
			const permission = getNotificationPermission();
			if (permission === "denied") {
				return;
			}

			// Show the prompt
			setOpened(true);
		};

		checkShouldShow();
	}, [storageKey]);

	const handleEnable = async () => {
		setIsEnabling(true);
		try {
			const subscription = await subscribeToPush();

			if (subscription) {
				toast.success(t.success, {
					icon: <Bell size={18} />,
				});
				setOpened(false);
			} else {
				// Check if it was denied
				const permission = getNotificationPermission();
				if (permission === "denied") {
					toast.error(t.denied, {
						icon: <X size={18} />,
					});
				} else {
					toast.error(t.error, {
						icon: <X size={18} />,
					});
				}
			}
		} catch (error) {
			console.error("Error enabling push notifications:", error);
			toast.error(t.error, {
				icon: <X size={18} />,
			});
		} finally {
			setIsEnabling(false);
		}
	};

	const handleDismiss = () => {
		// Store dismissal in localStorage
		localStorage.setItem(storageKey, "true");
		setOpened(false);
	};

	if (!opened) {
		return null;
	}

	return (
		<Modal
			opened={opened}
			onClose={handleDismiss}
			title={
				<Group gap="sm">
					<div
						style={{
							padding: "8px",
							borderRadius: "8px",
							background:
								"linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Bell size={20} color="white" />
					</div>
					<Text size="lg" fw={600}>
						{t.title}
					</Text>
				</Group>
			}
			size="md"
			centered
			styles={{
				title: {
					width: "100%",
				},
			}}
		>
			<Stack gap="lg">
				<Text size="sm" c="dimmed">
					{t.description}
				</Text>

				<List
					spacing="sm"
					size="sm"
					icon={
						<div
							style={{
								width: "6px",
								height: "6px",
								borderRadius: "50%",
								background: "oklch(0.65 0.15 175)",
								marginTop: "6px",
							}}
						/>
					}
				>
					{t.benefits.map((benefit, index) => (
						<List.Item key={index}>{benefit}</List.Item>
					))}
				</List>

				<Group justify="flex-end" mt="md">
					<Button variant="subtle" onClick={handleDismiss} disabled={isEnabling}>
						{t.notNow}
					</Button>
					<Button
						onClick={handleEnable}
						loading={isEnabling}
						style={{
							background:
								"linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
						}}
						leftSection={<Bell size={18} />}
					>
						{t.enable}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

/**
 * Hook to trigger the push notification prompt
 * Use this in your components to show the prompt at the right time
 */
export function usePushNotificationPrompt(
	context: "customer" | "vendor",
	language: "en" | "bn",
) {
	const [shouldShow, setShouldShow] = useState(false);

	const trigger = () => {
		setShouldShow(true);
	};

	const reset = () => {
		setShouldShow(false);
	};

	return {
		shouldShow,
		trigger,
		reset,
		PushPrompt: shouldShow ? (
			<PushNotificationPrompt context={context} language={language} />
		) : null,
	};
}
