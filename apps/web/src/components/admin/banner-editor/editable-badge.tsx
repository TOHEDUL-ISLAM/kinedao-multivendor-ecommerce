import { useState } from "react";
import { Popover, TextInput, ColorSwatch, Group, Stack, Button } from "@mantine/core";
import { Pencil } from "lucide-react";
import { useTheme } from "next-themes";

const BADGE_COLORS: Record<string, string> = {
	red: "#ef4444",
	teal: "#14b8a6",
	purple: "#a855f7",
	orange: "#f97316",
	green: "#22c55e",
};

const BADGE_CLASSES: Record<string, string> = {
	red: "bg-red-500",
	teal: "bg-teal-500",
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	green: "bg-green-500",
};

interface EditableBadgeProps {
	text: string;
	color: string;
	onTextChange: (text: string) => void;
	onColorChange: (color: string) => void;
	isEditing: boolean;
	onStartEdit: () => void;
	onFinishEdit: () => void;
	placeholder?: string;
	className?: string;
}

export function EditableBadge({
	text,
	color,
	onTextChange,
	onColorChange,
	isEditing,
	onStartEdit,
	onFinishEdit,
	placeholder = "Add Badge",
	className = "",
}: EditableBadgeProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const [hovered, setHovered] = useState(false);

	const displayText = text || placeholder;
	const isEmpty = !text;
	const badgeColorClass = color
		? BADGE_CLASSES[color] || "bg-teal-500"
		: "bg-teal-500";

	return (
		<Popover
			opened={isEditing}
			onClose={onFinishEdit}
			position="bottom-start"
			withArrow
			shadow="xl"
			offset={8}
		>
			<Popover.Target>
				<span
					onClick={onStartEdit}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
					className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs sm:text-sm font-bold cursor-pointer transition-all ${badgeColorClass} ${className} ${
						isEmpty ? "opacity-60" : ""
					}`}
					style={{
						border: hovered
							? `2px dashed ${isDark ? "oklch(0.65 0.15 175 / 0.5)" : "oklch(0.65 0.15 175 / 0.4)"}`
							: "2px dashed transparent",
						position: "relative",
					}}
				>
					{displayText}
					{hovered && (
						<Pencil
							className="w-3 h-3 ml-1"
							style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))" }}
						/>
					)}
				</span>
			</Popover.Target>

			<Popover.Dropdown
				style={{
					background: isDark
						? "oklch(0.2 0.015 260)"
						: "oklch(0.99 0.005 90)",
					border: isDark
						? "1px solid oklch(0.3 0.02 260)"
						: "1px solid oklch(0.92 0.01 260)",
				}}
			>
				<Stack gap="sm">
					<TextInput
						label="Badge Text"
						value={text}
						onChange={(e) => onTextChange(e.target.value)}
						placeholder={placeholder}
						maxLength={50}
						size="sm"
						autoFocus
					/>

					<div>
						<div className="text-sm font-medium mb-2">Badge Color</div>
						<Group gap="xs">
							{Object.entries(BADGE_COLORS).map(([colorName, colorHex]) => (
								<ColorSwatch
									key={colorName}
									color={colorHex}
									onClick={() => onColorChange(colorName)}
									size={32}
									style={{
										cursor: "pointer",
										border:
											color === colorName
												? "3px solid oklch(0.65 0.15 175)"
												: "2px solid transparent",
										boxShadow:
											color === colorName
												? "0 0 0 2px white, 0 0 8px rgba(20, 184, 166, 0.4)"
												: "none",
									}}
								/>
							))}
						</Group>
					</div>

					<Button
						size="sm"
						onClick={onFinishEdit}
						style={{ background: "oklch(0.65 0.15 175)", color: "white" }}
					>
						Done
					</Button>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}
