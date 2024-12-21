"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { SelectedLogo } from "@/types";
import { Trash2, Save, Palette, Image } from "lucide-react";

interface LogoPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logo: Partial<SelectedLogo>;
  onSave?: (logo: Partial<SelectedLogo>) => void;
}

interface ColorSwatch {
  color: string;
  count: number;
}

const PRESET_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Scarlet Red", hex: "#C10230" },
  { name: "Burgundy", hex: "#783040" },
  { name: "Crimson", hex: "#862733" },
  { name: "Orange", hex: "#FC4C01" },
  { name: "Nike Orange", hex: "#EA3301" },
  { name: "Texas Orange", hex: "#CB6114" },
  { name: "Yellow", hex: "#FBE120" },
  { name: "Athletic Gold", hex: "#FFB81D" },
  { name: "Vegas Khaki Gold", hex: "#CEB889" },
  { name: "Forest Green", hex: "#124734" },
  { name: "True Lime Green", hex: "#96D701" },
  { name: "Kelly Green", hex: "#027B34" },
  { name: "Carolina Blue", hex: "#79A3DC" },
  { name: "Hopkins Blue", hex: "#4190DE" },
  { name: "Light Royal Blue", hex: "#0057B7" },
  { name: "Cobalt Blue", hex: "#022168" },
  { name: "Royal Blue", hex: "#013595" },
  { name: "Navy Blue", hex: "#13294C" },
  { name: "Purple", hex: "#582C84" },
  { name: "Black", hex: "#222223" },
  { name: "Metallic Silver", hex: "#898D8E" },
  { name: "Metallic Vegas Gold", hex: "#85724D" },
  { name: "Grey", hex: "#9EA2A3" },
  { name: "Dark Grey", hex: "#323F49" },
  { name: "Pewter", hex: "#6E6258" },
  { name: "Cream", hex: "#D6D2C2" },
  { name: "Brown", hex: "#4F3529" },
  { name: "Light Pink", hex: "#F47EB6" },
  { name: "Pink", hex: "#F04E99" },
  { name: "Teal", hex: "#019CA7" },
  { name: "Mint", hex: "#8BE2CF" },
  { name: "Upstate Green", hex: "#78BE20" },
  { name: "Bright Red", hex: "#E3002C" },
  { name: "Deep Maroon", hex: "#661D32" },
  { name: "Neon Green", hex: "#42D72D" },
  { name: "Lavendar", hex: "#AE94D1" },
  { name: "Neon Yellow", hex: "#EBFF00" },
  { name: "Seafoam", hex: "#2BD5C3" },
  { name: "Ice Light Blue", hex: "#00A3DE" },
  { name: "Lawn Green", hex: "#01A92A" },
  { name: "Army Green", hex: "#5C6838" },
  { name: "Peach", hex: "#F77D55" },
  { name: "Coastal Green", hex: "#6BCDB6" },
  { name: "Turqouise", hex: "#00AEC6" },
  { name: "Tennessee Orange", hex: "#FE8101" },
  { name: "Army Tan", hex: "#B2814E" },
  { name: "Glacier Grey", hex: "#A7BDD5" },
  { name: "Nude Tan", hex: "#F2CFB1" }
];

const BACKGROUND_OPTIONS = [
  {
    name: "White",
    gradient: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
    textColor: "text-black"
  },
  {
    name: "Black",
    gradient: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
    textColor: "text-white"
  },
  {
    name: "Grey",
    gradient: "linear-gradient(135deg, #2c3e50 0%, #3f4c6b 100%)",
    textColor: "text-white"
  },
  {
    name: "Red",
    gradient: "linear-gradient(135deg, #7f0000 0%, #8f0000 100%)",
    textColor: "text-white"
  },
  {
    name: "Navy",
    gradient: "linear-gradient(135deg, #000080 0%, #000066 100%)",
    textColor: "text-white"
  },
  {
    name: "None",
    gradient: "none",
    textColor: "text-black"
  }
];

export function LogoPreviewDialog({ isOpen, onClose, logo, onSave }: LogoPreviewDialogProps) {
  const [colors, setColors] = useState<ColorSwatch[]>([]);
  const [originalSvg, setOriginalSvg] = useState<string>("");
  const [modifiedSvg, setModifiedSvg] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);

  useEffect(() => {
    if (isOpen && logo.svg_link) {
      fetchAndExtractColors(logo.svg_link);
    }
  }, [isOpen, logo.svg_link]);

  const fetchAndExtractColors = async (svgUrl: string) => {
    try {
      const response = await fetch(svgUrl);
      const svgText = await response.text();
      setOriginalSvg(svgText);
      setModifiedSvg(svgText);
      const colors = extractColorsFromSVG(svgText);
      setColors(colors);
    } catch (error) {
      console.error('Error fetching SVG:', error);
      setColors([]);
    }
  };

  const extractColorsFromSVG = (svgText: string): ColorSwatch[] => {
    const colorMap = new Map<string, number>();
    
    const colorRegex = /(fill|stroke)="([^"]+)"/g;
    let match;
    
    while ((match = colorRegex.exec(svgText)) !== null) {
      const color = match[2].toLowerCase();
      
      if (color === 'none' || color === 'transparent' || color.startsWith('url(')) {
        continue;
      }
      
      const hexColor = nameToHex(color);
      if (hexColor) {
        colorMap.set(hexColor, (colorMap.get(hexColor) || 0) + 1);
      }
    }
    
    return Array.from(colorMap.entries())
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
  };

  const nameToHex = (color: string): string | null => {
    if (color.startsWith('#')) {
      return color;
    }
    
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const computedColor = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    
    const match = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      const [_, r, g, b] = match;
      return `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`;
    }
    
    return null;
  };

  const handlePresetColorSelect = (newColor: string) => {
    if (selectedColor) {
      const updatedSvg = modifiedSvg.replace(
        new RegExp(`(fill|stroke)="${selectedColor}"`, 'gi'),
        `$1="${newColor}"`
      );
      setModifiedSvg(updatedSvg);
      setColors(colors.map(c => 
        c.color === selectedColor ? { ...c, color: newColor } : c
      ));
      setSelectedColor(null);
    }
  };

  const handleDeleteColor = (colorToDelete: string) => {
    const updatedSvg = modifiedSvg.replace(
      new RegExp(`(fill|stroke)="${colorToDelete}"`, 'gi'),
      '$1="none"'
    );
    setModifiedSvg(updatedSvg);
    setColors(colors.filter(c => c.color !== colorToDelete));
  };

  const handleSave = () => {
    if (onSave && modifiedSvg) {
      const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
      const modifiedSvgUrl = URL.createObjectURL(blob);
      onSave({ ...logo, svg_link: modifiedSvgUrl });
    }
    onClose();
  };

  const handleReset = () => {
    setModifiedSvg(originalSvg);
    const originalColors = extractColorsFromSVG(originalSvg);
    setColors(originalColors);
    setSelectedBackground(BACKGROUND_OPTIONS[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{logo.description || 'Logo Preview'}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>Reset</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <h3 className="text-sm font-medium">Background</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {BACKGROUND_OPTIONS.map((bg) => (
                <Button
                  key={bg.name}
                  variant={selectedBackground === bg ? "default" : "outline"}
                  className={`relative h-10 w-24 ${bg.textColor}`}
                  style={{ background: bg.gradient }}
                  onClick={() => setSelectedBackground(bg)}
                >
                  <span className="absolute bottom-2 left-2 text-xs font-medium">
                    {bg.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          <div 
            className="aspect-square relative rounded-lg p-4 flex items-center justify-center transition-all duration-300"
            style={{ background: selectedBackground.gradient }}
          >
            <div className="max-w-[80%] max-h-[80%]">
              {modifiedSvg ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: modifiedSvg }} 
                  className="w-full h-full"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              ) : (
                <img
                  src={logo.svg_link || logo.png_url}
                  alt={logo.description}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
          {colors.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Colors Used</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map(({ color, count }, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted rounded-lg p-2"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-8 h-8 p-0 rounded hover:ring-2 ring-offset-2 transition-all"
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      </PopoverTrigger>
                    <PopoverContent className="w-128 p-3" align="start">
<div className="space-y-2">
  <h4 className="font-medium text-sm">Select New Color</h4>
  <div className="grid grid-cols-8 gap-1">
    {PRESET_COLORS.map((preset) => (
      <button
        key={preset.hex}
        className="relative group p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => handlePresetColorSelect(preset.hex)}
      >
        <div
          className="w-8 h-8 rounded border"
          style={{ backgroundColor: preset.hex }}
        />
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs bg-popover border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {preset.name}
        </span>
      </button>
    ))}
  </div>
</div>
</PopoverContent>
                    </Popover>
                    <div className="text-sm">
                      <div className="font-mono">{color}</div>
                      <div className="text-xs text-muted-foreground">
                        Used {count} time{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteColor(color)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}