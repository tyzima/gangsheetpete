'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectedLogo, SheetSize, SHEET_DIMENSIONS } from '@/types';
import { Trash2, Edit, Info, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { LogoPreviewDialog } from './logo-preview-dialog';
import { ModeToggle } from './mode-toggle';

interface SelectedLogosProps {
  logos: SelectedLogo[];
  onLogoRemove: (index: number) => void;
  onLogoUpdate: (index: number, updatedLogo: SelectedLogo) => void;
  preferredSheetSize: SheetSize | null;
  onPreferredSheetSizeChange: (size: SheetSize | null) => void;
}

const DIMENSION_PRESETS = [
  { name: 'Glove', width: 1.5 },
  { name: 'Shirt', width: 9.5 },
  { name: 'Bag', width: 10.5 },
  { name: 'Shorts', width: 3.5 },
] as const;

export function SelectedLogos({
  logos,
  onLogoRemove,
  onLogoUpdate,
  preferredSheetSize,
  onPreferredSheetSizeChange,
}: SelectedLogosProps) {
  const [previewLogo, setPreviewLogo] = useState<SelectedLogo | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleWidthChange = (index: number, width: number) => {
    const updatedLogo = { ...logos[index], width };
    onLogoUpdate(index, updatedLogo);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedLogo = { ...logos[index], quantity };
    onLogoUpdate(index, updatedLogo);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updatedLogo = { ...logos[index], notes };
    onLogoUpdate(index, updatedLogo);
  };

  const handleRotationToggle = (index: number) => {
    const updatedLogo = {
      ...logos[index],
      rotated: !logos[index].rotated,
    };
    onLogoUpdate(index, updatedLogo);
  };

  const handleLogoSave = (updatedLogo: Partial<SelectedLogo>) => {
    if (editingIndex !== null) {
      onLogoUpdate(editingIndex, { ...logos[editingIndex], ...updatedLogo });
    }
    setPreviewLogo(null);
    setEditingIndex(null);
  };

  const handleEdit = (logo: SelectedLogo, index: number) => {
    setPreviewLogo(logo);
    setEditingIndex(index);
  };

  const isGloveSize = (width: number) => {
    return Math.abs(width - DIMENSION_PRESETS[0].width) < 0.1;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold">
            2
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Assign Size and Qty
          </span>
        </div>{' '}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sheet Size:</span>
            <Select
              value={preferredSheetSize || 'auto'}
              onValueChange={(value: string) =>
                onPreferredSheetSizeChange(
                  value === 'auto' ? null : (value as SheetSize)
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Auto (Recommended)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Recommended)</SelectItem>
                {(Object.keys(SHEET_DIMENSIONS) as SheetSize[]).map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} ({SHEET_DIMENSIONS[size].width}" ×{' '}
                    {SHEET_DIMENSIONS[size].height}")
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ModeToggle />
        </div>
      </div>

      {logos.length === 0 ? (
        <p className="text-muted-foreground">No logos selected</p>
      ) : (
        <div className="space-y-4">
          {logos.map((logo, index) => (
            <Card key={`${logo.logo_id}-${index}`} className="p-4">
              <div className="flex gap-4">
                <div className="w-20 space-y-2">
                  <div className="h-20 relative">
                    <div className="w-full h-full">
                      <img
                        src={logo.png_url}
                        alt={logo.description}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleEdit(logo, index)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  <p className="font-medium">{logo.description}</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {DIMENSION_PRESETS.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleWidthChange(index, preset.width)
                            }
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-end">
                      {/* Width Input */}
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Width (inches)
                        </label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={logo.width}
                          onChange={(e) =>
                            handleWidthChange(
                              index,
                              parseFloat(e.target.value) || 0.1
                            )
                          }
                          className="w-full"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-muted-foreground">
                            Quantity
                          </label>
                          {isGloveSize(logo.width) && (
                            <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Order 2X
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleQuantityChange(
                                index,
                                Math.max(1, logo.quantity - 1)
                              )
                            }
                            disabled={logo.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={logo.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleQuantityChange(index, logo.quantity + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Input
                          placeholder="Add notes for this logo..."
                          value={logo.notes || ''}
                          onChange={(e) =>
                            handleNotesChange(index, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onLogoRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LogoPreviewDialog
        isOpen={!!previewLogo}
        onClose={() => {
          setPreviewLogo(null);
          setEditingIndex(null);
        }}
        logo={previewLogo || { description: '', png_url: '' }}
        onSave={handleLogoSave}
      />
    </div>
  );
}
