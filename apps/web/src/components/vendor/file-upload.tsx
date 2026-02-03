import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/use-language";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

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
  const { language } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setUploadError(
          language === "en"
            ? `File size must be less than ${maxSizeMB}MB`
            : `ফাইলের আকার ${maxSizeMB}MB এর কম হতে হবে`
        );
        return;
      }

      // Validate file type
      if (accept !== "*" && !file.type.match(accept.replace("*", ".*"))) {
        setUploadError(language === "en" ? "Invalid file type" : "অবৈধ ফাইল টাইপ");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.upload.$post({
          form: { file },
        } as any);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        onChange(data.url);
      } catch {
        setUploadError(language === "en" ? "Upload failed. Please try again." : "আপলোড ব্যর্থ। আবার চেষ্টা করুন।");
      } finally {
        setIsUploading(false);
      }
    },
    [accept, maxSizeMB, language, onChange]
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
      {label && <p className="text-sm font-medium">{label}</p>}

      {value ? (
        // Preview
        <div className="relative group">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
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
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
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
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isUploading && "opacity-50 pointer-events-none",
            disabled && "opacity-50 cursor-not-allowed",
            displayError && "border-red-500"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground mb-2" />
            )}

            <p className="text-sm font-medium">
              {isUploading
                ? language === "en"
                  ? "Uploading..."
                  : "আপলোড হচ্ছে..."
                : language === "en"
                  ? "Drop file here or click to upload"
                  : "ফাইল এখানে ড্রপ করুন বা ক্লিক করুন"}
            </p>

            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}

            <p className="text-xs text-muted-foreground mt-2">
              {language === "en" ? `Max ${maxSizeMB}MB` : `সর্বোচ্চ ${maxSizeMB}MB`}
            </p>
          </div>
        </div>
      )}

      {displayError && <p className="text-sm text-red-500">{displayError}</p>}
    </div>
  );
}
