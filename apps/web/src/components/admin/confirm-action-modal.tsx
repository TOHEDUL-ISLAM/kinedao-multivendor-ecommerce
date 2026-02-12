import { Modal, Button, Group, Textarea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/use-language";

interface ConfirmActionModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showNotesField?: boolean;
  notesLabel?: string;
  notesPlaceholder?: string;
  notesRequired?: boolean;
  loading?: boolean;
  danger?: boolean;
}

const labels = {
  en: {
    notes: "Notes",
    notesPlaceholder: "Add notes (optional)...",
    notesRequired: "Please provide a reason",
    confirm: "Confirm",
    cancel: "Cancel",
  },
  bn: {
    notes: "মন্তব্য",
    notesPlaceholder: "মন্তব্য যোগ করুন (ঐচ্ছিক)...",
    notesRequired: "দয়া করে একটি কারণ প্রদান করুন",
    confirm: "নিশ্চিত করুন",
    cancel: "বাতিল",
  },
};

export function ConfirmActionModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  showNotesField = false,
  notesLabel,
  notesPlaceholder,
  notesRequired = false,
  loading = false,
  danger = false,
}: ConfirmActionModalProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const { language } = useLanguage();
  const t = labels[language];

  const handleConfirm = () => {
    if (notesRequired && !notes.trim()) {
      setError(t.notesRequired);
      return;
    }
    onConfirm(notes);
  };

  const handleClose = () => {
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      centered
      size="md"
    >
      <Stack gap="lg">
        <Text size="sm">{message}</Text>

        {showNotesField && (
          <Textarea
            label={notesLabel || t.notes}
            placeholder={notesPlaceholder || t.notesPlaceholder}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setError("");
            }}
            error={error}
            minRows={3}
            required={notesRequired}
          />
        )}

        <Group justify="flex-end">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={loading}
          >
            {cancelLabel || t.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            color={danger ? "red" : undefined}
          >
            {confirmLabel || t.confirm}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
