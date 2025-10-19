import { User, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type ModelCanvasProps = {
  modelImage: string | null;
  onModelUpload: (file: File) => void;
  upperWear: string | null;
  lowerWear: string | null;
  shoes: string | null;
  zoom: number;
};

export function ModelCanvas({ modelImage, onModelUpload, upperWear, lowerWear, shoes, zoom }: ModelCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    onModelUpload(file);
    toast.success("Model photo uploaded");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onModelUpload(file);
      toast.success("Model photo uploaded");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-center mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-primary-foreground px-6 h-12 rounded-lg hover-scale flex items-center gap-2 font-medium"
        >
          <Upload className="h-5 w-5" />
          Upload Model Photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div
        className={`flex-1 relative flex items-center justify-center rounded-xl overflow-hidden ${
          isDragging ? "bg-primary/10 border-2 border-primary border-dashed" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {modelImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div
              className="relative transition-transform duration-300"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {/* Base model image */}
              <img
                src={modelImage}
                alt="Model"
                className="max-h-[70vh] w-auto object-contain"
              />

              {/* Clothing overlays */}
              {shoes && (
                <img
                  src={shoes}
                  alt="Shoes overlay"
                  className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity duration-200 pointer-events-none"
                />
              )}
              {lowerWear && (
                <img
                  src={lowerWear}
                  alt="Lower wear overlay"
                  className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity duration-200 pointer-events-none"
                />
              )}
              {upperWear && (
                <img
                  src={upperWear}
                  alt="Upper wear overlay"
                  className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity duration-200 pointer-events-none"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <User className="h-24 w-24 mb-4" />
            <p className="text-lg font-medium">No model photo uploaded</p>
            <p className="text-sm mt-2">Upload a photo to start creating your outfit</p>
          </div>
        )}
      </div>
    </div>
  );
}
