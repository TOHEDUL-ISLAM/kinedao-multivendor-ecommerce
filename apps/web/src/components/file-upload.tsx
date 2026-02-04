import { useState, useRef } from "react";
import { Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface FileUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  label,
  value,
  onChange,
  accept = "image/*",
  disabled = false,
  className,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      // Using the RPC client for upload
      const res = await api.upload.$post({
        form: {
          file: file,
        },
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      
      {value ? (
        <div className="relative border rounded-md p-4 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline truncate max-w-[200px]"
            >
              View Uploaded File
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-muted/50",
            disabled && "opacity-60 cursor-not-allowed hover:bg-transparent",
            isUploading && "pointer-events-none opacity-80"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Max 5MB ({accept === "image/*" ? "Images only" : "PDF or Images"})
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>
      )}
    </div>
  );
}
