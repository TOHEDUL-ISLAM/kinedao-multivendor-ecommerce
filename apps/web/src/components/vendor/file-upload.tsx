import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  onClear,
  accept = "image/*",
  maxSizeMB = 5,
  label,
  description,
  error,
  disabled,
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setUploadError(t("vendor.form.upload.fileSize", { size: maxSizeMB }));
        return;
      }

      // Validate file type
      if (accept !== "*" && !file.type.match(accept.replace("*", ".*"))) {
        setUploadError(t("vendor.form.upload.invalidType"));
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const response = await api.upload.$post({
          form: { file },
        } as any);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        onChange(data.url);
      } catch {
        setUploadError(t("vendor.form.upload.failed"));
      } finally {
        setIsUploading(false);
      }
    },
    [accept, maxSizeMB, onChange, t]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClear = () => {
    onClear?.();
    setUploadError(null);
  };

  const displayError = error || uploadError;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {value ? (
        // Preview
        <div className="relative group rounded-xl overflow-hidden border-2 border-primary/30 bg-teal-50">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for mock URLs
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
              <FileImage className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        // Upload area
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
            dragActive ? "border-primary bg-teal-50 scale-[1.02]" : "border-border bg-cream-50 hover:border-primary/50 hover:bg-teal-50/50",
            isUploading && "opacity-50 pointer-events-none",
            disabled && "opacity-50 cursor-not-allowed",
            displayError && "border-destructive bg-destructive/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-4 px-6 text-center">
            <div className={cn("icon-container w-12 h-12 mb-3", dragActive ? "icon-teal" : "bg-muted")}>
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : dragActive ? (
                <FileImage className="w-6 h-6 text-primary" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="text-primary font-medium">{t("vendor.form.upload.clickToUpload")}</span>{" "}
              {t("vendor.form.upload.orDrag")}
            </p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              {t("vendor.form.upload.maxSize", { size: maxSizeMB })}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </label>
      )}

      {displayError && <p className="text-sm text-destructive">{displayError}</p>}
    </div>
  );
}
