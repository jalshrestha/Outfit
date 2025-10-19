import { useState, useRef } from "react";
import { Shirt, ListChecks, FootprintsIcon, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClothingUpload } from "@/components/ClothingUpload";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { ModelCanvas } from "@/components/ModelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { DownloadButton } from "@/components/DownloadButton";
import { toast } from "sonner";

type ClothingItem = {
  url: string;
  category: "upper" | "lower" | "shoes";
};

const Index = () => {
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const [currentUpperIndex, setCurrentUpperIndex] = useState(0);
  const [currentLowerIndex, setCurrentLowerIndex] = useState(0);
  const [currentShoesIndex, setCurrentShoesIndex] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);

  const upperItems = allItems.filter((item) => item.category === "upper");
  const lowerItems = allItems.filter((item) => item.category === "lower");
  const shoesItems = allItems.filter((item) => item.category === "shoes");

  const handleClothingUpload = async (files: File[]) => {
    const newItems: ClothingItem[] = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      // Simple category assignment based on filename or could add a dialog
      const category = assignCategory(file.name);
      newItems.push({ url, category });
    }

    setAllItems((prev) => [...prev, ...newItems]);
  };

  const assignCategory = (filename: string): "upper" | "lower" | "shoes" => {
    const lower = filename.toLowerCase();
    if (lower.includes("shirt") || lower.includes("jacket") || lower.includes("hoodie")) {
      return "upper";
    } else if (lower.includes("pant") || lower.includes("jean") || lower.includes("short")) {
      return "lower";
    } else if (lower.includes("shoe") || lower.includes("boot") || lower.includes("sneaker")) {
      return "shoes";
    }
    // Default: distribute evenly
    const counts = {
      upper: upperItems.length,
      lower: lowerItems.length,
      shoes: shoesItems.length,
    };
    const min = Math.min(counts.upper, counts.lower, counts.shoes);
    if (counts.upper === min) return "upper";
    if (counts.lower === min) return "lower";
    return "shoes";
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...allItems];
    URL.revokeObjectURL(newItems[index].url);
    newItems.splice(index, 0);
    setAllItems(newItems);
  };

  const handleModelUpload = (file: File) => {
    if (modelImage) {
      URL.revokeObjectURL(modelImage);
    }
    const url = URL.createObjectURL(file);
    setModelImage(url);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all photos?")) {
      allItems.forEach((item) => URL.revokeObjectURL(item.url));
      setAllItems([]);
      if (modelImage) {
        URL.revokeObjectURL(modelImage);
        setModelImage(null);
      }
      toast.success("All photos cleared");
    }
  };

  const currentUpper = upperItems[currentUpperIndex]?.url || null;
  const currentLower = lowerItems[currentLowerIndex]?.url || null;
  const currentShoes = shoesItems[currentShoesIndex]?.url || null;

  return (
    <div className="h-screen flex w-full overflow-hidden">
      <ThemeToggle />

      {/* Left Panel - Clothing Management */}
      <div className="w-[60%] border-r border-border p-6 overflow-y-auto flex flex-col">
        <div className="flex-shrink-0 space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Virtual Fitting Room</h1>
            <p className="text-sm text-muted-foreground">Upload clothes and visualize your outfit</p>
          </div>

          <ClothingUpload
            onUpload={handleClothingUpload}
            uploadedCount={allItems.length}
            thumbnails={allItems.map((item) => item.url)}
            onRemove={handleRemoveItem}
          />
        </div>

        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto py-4">
          <CategoryCarousel
            title="Upper Wear"
            icon={<Shirt className="h-5 w-5" />}
            items={upperItems.map((item) => item.url)}
            onIndexChange={setCurrentUpperIndex}
          />

          <CategoryCarousel
            title="Lower Wear"
            icon={<ListChecks className="h-5 w-5" />}
            items={lowerItems.map((item) => item.url)}
            onIndexChange={setCurrentLowerIndex}
          />

          <CategoryCarousel
            title="Shoes"
            icon={<FootprintsIcon className="h-5 w-5" />}
            items={shoesItems.map((item) => item.url)}
            onIndexChange={setCurrentShoesIndex}
          />
        </div>

        {allItems.length > 0 && (
          <div className="flex-shrink-0 pt-4">
            <button
              onClick={handleClearAll}
              className="w-full h-10 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-smooth flex items-center justify-center gap-2 font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Photos
            </button>
          </div>
        )}
      </div>

      {/* Right Panel - Model Visualization */}
      <div className="w-[40%] p-6 relative overflow-hidden">
        <div ref={canvasRef} className="h-full">
          <ModelCanvas
            modelImage={modelImage}
            onModelUpload={handleModelUpload}
            upperWear={currentUpper}
            lowerWear={currentLower}
            shoes={currentShoes}
            zoom={zoom}
          />
        </div>

        {modelImage && <ZoomControls zoom={zoom} onZoomChange={setZoom} />}

        <DownloadButton canvasRef={canvasRef} disabled={!modelImage} />
      </div>
    </div>
  );
};

export default Index;
