import { Upload, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

type ClothingUploadProps = {
  onUpload: (files: File[]) => void;
  uploadedCount: number;
  thumbnails: string[];
  onRemove: (index: number) => void;
};

export function ClothingUpload({ onUpload, uploadedCount, thumbnails, onRemove }: ClothingUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith("image/");
      const isUnder10MB = file.size <= 10 * 1024 * 1024;
      if (!isValid) toast.error(`${file.name} is not an image`);
      if (!isUnder10MB) toast.error(`${file.name} exceeds 10MB`);
      return isValid && isUnder10MB;
    });

    if (validFiles.length > 0) {
      onUpload(validFiles);
      toast.success(`${validFiles.length} image${validFiles.length > 1 ? "s" : ""} uploaded`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-12 bg-primary text-primary-foreground rounded-lg hover-scale flex items-center justify-center gap-2 font-medium"
      >
        <Upload className="h-5 w-5" />
        Upload Clothing Photos
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedCount > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {uploadedCount} item{uploadedCount > 1 ? "s" : ""} uploaded
          </p>
          <div className="flex flex-wrap gap-2">
            {thumbnails.slice(0, 8).map((thumb, index) => (
              <div key={index} className="relative group">
                <img
                  src={thumb}
                  alt={`Uploaded item ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => onRemove(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {uploadedCount > 8 && (
              <div className="h-16 w-16 rounded-lg border border-border flex items-center justify-center bg-muted text-xs text-muted-foreground">
                +{uploadedCount - 8}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
