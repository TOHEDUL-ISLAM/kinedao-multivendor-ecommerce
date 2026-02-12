import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
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
  maxSizeMB = 10,
  label,
  description,
  error,
  disabled,
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      // Handle both "image/*" and "image/*,.pdf" patterns
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const isValidType = acceptedTypes.some((acceptedType) => {
        if (acceptedType.includes("*")) {
          // Handle wildcard patterns like "image/*"
          const pattern = acceptedType.replace("*", ".*");
          return new RegExp(`^${pattern}$`).test(file.type);
        }
        // Handle specific extensions like ".pdf"
        if (acceptedType.startsWith(".")) {
          const ext = acceptedType.toLowerCase();
          return file.name.toLowerCase().endsWith(ext);
        }
        return file.type === acceptedType;
      });

      if (!isValidType) {
        setUploadError(t("vendor.form.upload.invalidType"));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        // Simulate progress for better UX (since we can't track real progress easily)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) return prev; // Stop at 90% until upload completes
            return prev + 10;
          });
        }, 200);

        // Create FormData and upload
        const formData = new FormData();
        formData.append("file", file);

        // Use fetch directly for file uploads with explicit category.
        const serverUrl = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
        const uploadUrl = `${serverUrl}/api/upload?category=vendor-documents`;
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const raw = await response.text();
        let payload: { url?: string; error?: string } | null = null;

        try {
          payload = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : null;
        } catch {
          if (!response.ok) {
            throw new Error(
              `Upload failed (${response.status}). Please check server connection and try again.`
            );
          }
          throw new Error("Upload failed due to an invalid server response.");
        }

        if (!response.ok) {
          throw new Error(payload?.error || "Upload failed");
        }

        if (!payload?.url) {
          throw new Error("Upload failed: server response missing file URL.");
        }

        onChange(payload.url);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : t("vendor.form.upload.failed")
        );
      } finally {
        setIsUploading(false);
        // Reset progress after a short delay
        setTimeout(() => setUploadProgress(0), 500);
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
        <div className="space-y-2">
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

          {/* Upload Progress Bar */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {displayError && <p className="text-sm text-destructive">{displayError}</p>}
    </div>
  );
}
