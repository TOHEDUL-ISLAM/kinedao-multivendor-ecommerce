import { useState } from "react";
import { Modal, Button, Text, Group, Stack, Alert } from "@mantine/core";
import { Banknote, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface CODVerificationModalProps {
	opened: boolean;
	onClose: () => void;
	onExitTransitionEnd?: () => void;
	orderIds: string[];
	totalAmount: number;
	language: "en" | "bn";
}

export function CODVerificationModal({
	opened,
	onClose,
	onExitTransitionEnd,
	orderIds,
	totalAmount,
	language,
}: CODVerificationModalProps) {
	const [isVerifying, setIsVerifying] = useState(false);

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	};

	const handleVerify = async () => {
		setIsVerifying(true);
		try {
			// Verify COD for all orders in the group
			const results = await Promise.all(
				orderIds.map((orderId) =>
					api.orders[":orderId"]["verify-cod"].$patch({
						param: { orderId },
					}),
				),
			);

			// Check if all succeeded
			const allSucceeded = results.every((r) => r.ok);

			if (allSucceeded) {
				toast.success(
					language === "bn"
						? "ক্যাশ অন ডেলিভারি যাচাই সম্পন্ন হয়েছে"
						: "Cash on delivery verified",
				);
				onClose();
			} else {
				toast.error(
					language === "bn"
						? "যাচাইকরণ ব্যর্থ হয়েছে"
						: "Verification failed",
				);
			}
		} catch (error) {
			console.error("COD verification error:", error);
			toast.error(
				language === "bn" ? "যাচাইকরণ ব্যর্থ হয়েছে" : "Verification failed",
			);
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			onExitTransitionEnd={onExitTransitionEnd}
			title={
				<Group gap="sm">
					<Banknote size={24} style={{ color: "var(--mantine-color-blue-6)" }} />
					<Text size="lg" fw={600}>
						{language === "bn"
							? "ক্যাশ অন ডেলিভারি নিশ্চিত করুন"
							: "Confirm Cash on Delivery"}
					</Text>
				</Group>
			}
			size="md"
			centered
			closeOnClickOutside={false}
			closeOnEscape={false}
		>
			<Stack gap="md">
				<Alert
					icon={<AlertTriangle size={18} />}
					color="yellow"
					title={
						language === "bn" ? "গুরুত্বপূর্ণ অনুস্মারক" : "Important Reminder"
					}
				>
					<Text size="sm">
						{language === "bn"
							? "অনুগ্রহ করে নিশ্চিত করুন যে আপনার কাছে ডেলিভারি পার্সনকে দেওয়ার জন্য প্রয়োজনীয় নগদ টাকা আছে।"
							: "Please confirm that you have the exact cash amount ready for the delivery person."}
					</Text>
				</Alert>

				<div
					style={{
						background: "var(--mantine-color-blue-0)",
						padding: "1rem",
						borderRadius: "8px",
						textAlign: "center",
					}}
				>
					<Text size="sm" c="dimmed" mb={4}>
						{language === "bn" ? "মোট পরিশোধযোগ্য" : "Total Amount to Pay"}
					</Text>
					<Text size="xl" fw={700} c="blue">
						{formatPrice(totalAmount)}
					</Text>
				</div>

				<Text size="sm" c="dimmed">
					{language === "bn"
						? "আপনার অর্ডার নিশ্চিত করতে অনুগ্রহ করে নিচের বাটনে ক্লিক করুন। এটি বিক্রেতাকে জানাবে যে আপনার কাছে নগদ টাকা প্রস্তুত আছে।"
						: "Click the button below to confirm your order. This will notify the vendor that you have the cash ready for delivery."}
				</Text>

				<Group justify="flex-end" mt="md">
					<Button variant="subtle" onClick={onClose} disabled={isVerifying}>
						{language === "bn" ? "পরে করবো" : "I'll Do Later"}
					</Button>
					<Button onClick={handleVerify} loading={isVerifying}>
						{language === "bn"
							? "হ্যাঁ, আমার কাছে নগদ আছে"
							: "Yes, I Have Cash Ready"}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
