import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

type ZoomControlsProps = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

export function ZoomControls({ zoom, onZoomChange }: ZoomControlsProps) {
  const zoomIn = () => {
    if (zoom < 200) {
      onZoomChange(Math.min(zoom + 10, 200));
    }
  };

  const zoomOut = () => {
    if (zoom > 50) {
      onZoomChange(Math.max(zoom - 10, 50));
    }
  };

  const resetZoom = () => {
    onZoomChange(100);
  };

  return (
    <div className="glass-effect fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full">
      <button
        onClick={zoomOut}
        disabled={zoom <= 50}
        className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-smooth hover-scale"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      <button
        onClick={resetZoom}
        className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-full transition-smooth hover-scale"
      >
        {zoom}%
      </button>

      <button
        onClick={zoomIn}
        disabled={zoom >= 200}
        className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-smooth hover-scale"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>
  );
}
