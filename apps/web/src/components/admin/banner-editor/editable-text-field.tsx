import { useRef, useEffect } from "react";
import { useClickOutside } from "@mantine/hooks";
import { Pencil } from "lucide-react";
import { useTheme } from "next-themes";

interface EditableTextFieldProps {
	value: string;
	onChange: (value: string) => void;
	isEditing: boolean;
	onStartEdit: () => void;
	onFinishEdit: () => void;
	placeholder: string;
	className: string;
	inputClassName?: string;
	as?: "h2" | "p" | "span";
	maxLength?: number;
	multiline?: boolean;
}

export function EditableTextField({
	value,
	onChange,
	isEditing,
	onStartEdit,
	onFinishEdit,
	placeholder,
	className,
	inputClassName = "",
	as = "p",
	maxLength,
	multiline = false,
}: EditableTextFieldProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

	// Click outside to finish editing (exclude toolbar)
	const ref = useClickOutside<HTMLDivElement>(onFinishEdit);

	// Auto-focus input when entering edit mode
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			// Select all text for easy replacement
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onFinishEdit();
		}

		// For single-line inputs, Enter finishes editing
		if (e.key === "Enter" && !multiline) {
			e.preventDefault();
			onFinishEdit();
		}
	};

	if (isEditing) {
		const InputComponent = multiline ? "textarea" : "input";

		return (
			<div ref={ref} className="relative">
				<InputComponent
					ref={inputRef as any}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					maxLength={maxLength}
					placeholder={placeholder}
					className={`${className} ${inputClassName} border-2 border-teal-500 rounded-md px-3 py-1.5 outline-none transition-all bg-black/30 backdrop-blur-sm shadow-lg focus:shadow-teal-500/20`}
					style={{
						resize: multiline ? "none" : undefined,
						minHeight: multiline ? "60px" : undefined,
					}}
				/>
			</div>
		);
	}

	// Display mode
	const Component = as;
	const displayValue = value || placeholder;
	const isEmpty = !value;

	return (
		<div
			ref={ref}
			onClick={onStartEdit}
			className={`group relative cursor-pointer transition-all rounded-md ${
				isEmpty ? "opacity-60" : ""
			}`}
			style={{
				border: "2px dashed transparent",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = isDark
					? "oklch(0.65 0.15 175 / 0.5)"
					: "oklch(0.65 0.15 175 / 0.4)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = "transparent";
			}}
		>
			<Component className={`${className} pr-8`}>{displayValue}</Component>

			{/* Edit icon (visible on hover) */}
			<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-teal-500 rounded-full p-1 shadow-lg">
				<Pencil className="w-3 h-3 text-white" />
			</div>
		</div>
	);
}
