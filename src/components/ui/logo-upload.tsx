"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api";
import { toastManager } from "@/components/ui/toast";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoChange?: (logoUrl: string | null) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUpload({ currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setError(null);

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError("File size must be less than 2MB");
        resolve(false);
        return;
      }

      // Check file type
      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("File must be PNG, JPEG, or WebP");
        resolve(false);
        return;
      }

      // Check aspect ratio
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width !== img.height) {
          setError("Image should be square (1:1 aspect ratio) for best results");
          // Still allow upload, just warn
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        setError("Failed to read image");
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateFile(file);
    if (!isValid) {
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await userApi.uploadLogo(file);
      setLogoUrl(result.logo_url);
      onLogoChange?.(result.logo_url);
      toastManager.add({ type: "success", title: "Logo uploaded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload logo";
      setError(message);
      toastManager.add({ type: "error", title: message });
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await userApi.deleteLogo();
      setLogoUrl(null);
      onLogoChange?.(null);
      toastManager.add({ type: "success", title: "Logo removed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove logo";
      setError(message);
      toastManager.add({ type: "error", title: message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Logo preview */}
        <div className="relative size-16 rounded-lg border border-border bg-muted/50 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="size-full object-contain"
            />
          ) : (
            <Upload className="size-6 text-muted-foreground" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  {logoUrl ? "Change Logo" : "Upload Logo"}
                </>
              )}
            </Button>

            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Hint text */}
      <p className="text-sm text-muted-foreground">
        For best results, use a square image (1:1 aspect ratio). Maximum size: 2MB.
      </p>
    </div>
  );
}
