import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";

type CategoryCarouselProps = {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onIndexChange?: (index: number) => void;
};

export function CategoryCarousel({ title, icon, items, onIndexChange }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const nextItem = () => {
    const newIndex = (currentIndex + 1) % items.length;
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const prevItem = () => {
    const newIndex = (currentIndex - 1 + items.length) % items.length;
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          <div
            className="relative w-full h-[200px] rounded-xl overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <img
              src={items[currentIndex]}
              alt={`${title} ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-smooth"
            />

            {items.length > 1 && (
              <>
                <button
                  onClick={prevItem}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 glass-effect p-2 rounded-full transition-opacity duration-200 ${
                    isHovering ? "opacity-100" : "opacity-0"
                  } hover:scale-110`}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  onClick={nextItem}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 glass-effect p-2 rounded-full transition-opacity duration-200 ${
                    isHovering ? "opacity-100" : "opacity-0"
                  } hover:scale-110`}
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {items.length}
          </p>
        </div>
      ) : (
        <div className="w-full h-[200px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mb-2" />
          <p className="text-sm">No items yet</p>
          <p className="text-xs mt-1">Upload photos above</p>
        </div>
      )}
    </div>
  );
}
