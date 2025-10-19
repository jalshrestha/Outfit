import { Download } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

type DownloadButtonProps = {
  canvasRef: React.RefObject<HTMLDivElement>;
  disabled: boolean;
};

export function DownloadButton({ canvasRef, disabled }: DownloadButtonProps) {
  const handleDownload = async () => {
    if (!canvasRef.current || disabled) return;

    try {
      toast.info("Generating image...");

      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `virtual-fitting-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className="glass-effect fixed bottom-6 right-6 px-6 h-12 rounded-full hover-scale flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground border-none shadow-lg"
    >
      <Download className="h-5 w-5" />
      Download Result
    </button>
  );
}
