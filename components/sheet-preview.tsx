'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Sheet, SHEET_DIMENSIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Edit,
  Save,
  Maximize2,
  X,
  Group,
  Ungroup,
  Copy,
  RotateCw,
} from 'lucide-react';
import { generatePNG } from '@/lib/image-generator';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface SheetPreviewProps {
  sheet: Sheet;
  index: number;
  quantity?: number;
  onSheetUpdate?: (sheet: Sheet) => void;
}

interface DraggableLogoProps {
  id: string;
  index: number;
  item: Sheet['logos'][0];
  scale: number;
  isEditing: boolean;
  isSelected: boolean;
  groupId?: string;
  rotation?: number;
  onSelect: (index: number, event: React.MouseEvent) => void;
}

export function SheetPreview({
  sheet,
  index,
  quantity = 1,
  onSheetUpdate,
}: SheetPreviewProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = SHEET_DIMENSIONS[sheet.size];
  const [isEditing, setIsEditing] = useState(false);
  const [currentSheet, setCurrentSheet] = useState<Sheet>(sheet);
  const [selectedLogos, setSelectedLogos] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [groups, setGroups] = useState<{ [key: string]: number[] }>({});
  const [rotations, setRotations] = useState<{ [key: string]: number }>({});

  const maxPreviewWidth = isFullscreen ? window.innerWidth - 100 : 400;
  const maxPreviewHeight = isFullscreen ? window.innerHeight - 300 : 500;
  const scale = Math.min(
    maxPreviewWidth / dimensions.width,
    maxPreviewHeight / dimensions.height
  );

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `sheet-${index}`,
  });

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLogos.length) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const updatedLogos = currentSheet.logos.filter(
          (_, idx) => !selectedLogos.includes(idx)
        );
        const updatedSheet = { ...currentSheet, logos: updatedLogos };
        setCurrentSheet(updatedSheet);
        setSelectedLogos([]);
        // Clear any groups containing deleted logos
        const updatedGroups = { ...groups };
        Object.keys(updatedGroups).forEach((groupId) => {
          updatedGroups[groupId] = updatedGroups[groupId].filter(
            (idx) => !selectedLogos.includes(idx)
          );
          if (updatedGroups[groupId].length < 2) {
            delete updatedGroups[groupId];
          }
        });
        setGroups(updatedGroups);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        const updatedLogos = [...currentSheet.logos];
        const updatedRotations = { ...rotations };

        selectedLogos.forEach((logoIndex) => {
          const logo = updatedLogos[logoIndex];
          const logoId = `${logo.logo.logo_id}-${logoIndex}`;
          const currentRotation = rotations[logoId] || 0;
          updatedRotations[logoId] = (currentRotation + 90) % 360;

          const originalWidth = logo.dimensions.width;
          const originalHeight = logo.dimensions.height;

          const centerX = logo.position.x + originalWidth / 2;
          const centerY = logo.position.y + originalHeight / 2;
          const newWidth = originalHeight;
          const newHeight = originalWidth;
          const newX = centerX - newWidth / 2;
          const newY = centerY - newHeight / 2;

          updatedLogos[logoIndex] = {
            ...logo,
            dimensions: {
              width: newWidth,
              height: newHeight,
            },
            position: {
              x: Math.max(0, Math.min(dimensions.width - newWidth, newX)),
              y: Math.max(0, Math.min(dimensions.height - newHeight, newY)),
            },
          };
        });

        setRotations(updatedRotations);
        const updatedSheet = { ...currentSheet, logos: updatedLogos };
        setCurrentSheet(updatedSheet);
      } else if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const updatedLogos = [...currentSheet.logos];
        const updatedRotations = { ...rotations };

        const newLogos = selectedLogos.map((logoIndex) => {
          const logo = { ...currentSheet.logos[logoIndex] };
          const originalLogoId = `${logo.logo.logo_id}-${logoIndex}`;
          const newLogoId = `${logo.logo.logo_id}-${updatedLogos.length}`;

          // Copy rotation if exists
          if (rotations[originalLogoId]) {
            updatedRotations[newLogoId] = rotations[originalLogoId];
          }

          // Offset duplicated logos slightly
          logo.position = {
            x: Math.min(
              dimensions.width - logo.dimensions.width,
              logo.position.x + 20
            ),
            y: Math.min(
              dimensions.height - logo.dimensions.height,
              logo.position.y + 20
            ),
          };
          return logo;
        });

        setRotations(updatedRotations);
        const updatedSheet = {
          ...currentSheet,
          logos: [...updatedLogos, ...newLogos],
        };
        setCurrentSheet(updatedSheet);
        // Select the newly duplicated logos
        const newIndices = newLogos.map((_, i) => updatedLogos.length + i);
        setSelectedLogos(newIndices);
      } else if (e.key.toLowerCase() === 'g' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          // Ungroup
          const updatedGroups = { ...groups };
          Object.keys(updatedGroups).forEach((groupId) => {
            if (
              selectedLogos.some((idx) => updatedGroups[groupId].includes(idx))
            ) {
              delete updatedGroups[groupId];
            }
          });
          setGroups(updatedGroups);
        } else {
          // Group
          if (selectedLogos.length >= 2) {
            const groupId = `group-${Date.now()}`;
            setGroups((prev) => ({
              ...prev,
              [groupId]: selectedLogos,
            }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEditing,
    selectedLogos,
    currentSheet,
    dimensions.width,
    dimensions.height,
    groups,
    rotations,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || !containerRef.current || activeId) return;

    // Prevent default browser selection behavior
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsSelecting(true);
    setSelectionBox({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });

    // Clear selection if not holding shift
    if (!e.shiftKey) {
      setSelectedLogos([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current || !selectionBox || activeId)
      return;

    // Prevent default browser selection behavior
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setSelectionBox({
      ...selectionBox,
      currentX: x,
      currentY: y,
    });

    // Calculate selection box coordinates
    const left = Math.min(selectionBox.startX, x);
    const right = Math.max(selectionBox.startX, x);
    const top = Math.min(selectionBox.startY, y);
    const bottom = Math.max(selectionBox.startY, y);

    // Check which logos are within the selection box
    const selectedIndices = currentSheet.logos.reduce(
      (indices: number[], logo, index) => {
        const logoLeft = logo.position.x;
        const logoRight = logo.position.x + logo.dimensions.width;
        const logoTop = logo.position.y;
        const logoBottom = logo.position.y + logo.dimensions.height;

        if (
          logoRight >= left &&
          logoLeft <= right &&
          logoBottom >= top &&
          logoTop <= bottom
        ) {
          indices.push(index);
        }

        return indices;
      },
      []
    );

    setSelectedLogos((prev) => {
      const newSelection = new Set([...prev]);
      selectedIndices.forEach((index) => newSelection.add(index));
      return Array.from(newSelection);
    });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionBox(null);
  };

  const handleDownload = async () => {
    const filename =
      quantity > 1 ? `${sheet.size}-QTY${quantity}.png` : `${sheet.size}.png`;
    await generatePNG(currentSheet, index, filename, { rotations });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, delta } = event;

    if (!active) return;

    const logoId = active.id as string;
    const logoIndex = parseInt(logoId.split('-')[1]);

    if (isNaN(logoIndex)) return;

    const updatedLogos = [...currentSheet.logos];
    const deltaX = delta.x / scale;
    const deltaY = delta.y / scale;

    // Find if the dragged logo is part of a group
    let logosToMove = selectedLogos.length > 0 ? selectedLogos : [logoIndex];
    Object.entries(groups).forEach(([groupId, groupIndices]) => {
      if (groupIndices.includes(logoIndex)) {
        logosToMove = groupIndices;
      }
    });

    logosToMove.forEach((idx) => {
      if (idx >= 0 && idx < updatedLogos.length) {
        const logo = updatedLogos[idx];
        const newX = Math.max(
          0,
          Math.min(
            dimensions.width - logo.dimensions.width,
            logo.position.x + deltaX
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            dimensions.height - logo.dimensions.height,
            logo.position.y + deltaY
          )
        );

        updatedLogos[idx] = {
          ...logo,
          position: { x: newX, y: newY },
        };
      }
    });

    const updatedSheet = { ...currentSheet, logos: updatedLogos };
    setCurrentSheet(updatedSheet);
  };

  const handleLogoSelect = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();

    // Find if logo is part of a group
    let groupIndices: number[] = [];
    Object.entries(groups).forEach(([groupId, indices]) => {
      if (indices.includes(index)) {
        groupIndices = indices;
      }
    });

    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      setSelectedLogos((prev) => {
        if (groupIndices.length > 0) {
          return prev.includes(index)
            ? prev.filter((i) => !groupIndices.includes(i))
            : [...prev, ...groupIndices];
        }
        return prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index];
      });
    } else {
      setSelectedLogos(groupIndices.length > 0 ? groupIndices : [index]);
    }
  };

  const handleGroup = () => {
    if (selectedLogos.length >= 2) {
      const groupId = `group-${Date.now()}`;
      setGroups((prev) => ({
        ...prev,
        [groupId]: selectedLogos,
      }));
    }
  };

  const handleUngroup = () => {
    const updatedGroups = { ...groups };
    Object.keys(updatedGroups).forEach((groupId) => {
      if (selectedLogos.some((idx) => updatedGroups[groupId].includes(idx))) {
        delete updatedGroups[groupId];
      }
    });
    setGroups(updatedGroups);
  };

  const handleDuplicate = () => {
    if (selectedLogos.length === 0) return;

    const updatedLogos = [...currentSheet.logos];
    const updatedRotations = { ...rotations };

    const newLogos = selectedLogos.map((logoIndex) => {
      const logo = { ...currentSheet.logos[logoIndex] };
      const originalLogoId = `${logo.logo.logo_id}-${logoIndex}`;
      const newLogoId = `${logo.logo.logo_id}-${updatedLogos.length}`;

      // Copy rotation if exists
      if (rotations[originalLogoId]) {
        updatedRotations[newLogoId] = rotations[originalLogoId];
      }

      // Position new logo 20px below its original position
      logo.position = {
        x: logo.position.x,
        y: Math.min(
          dimensions.height - logo.dimensions.height,
          logo.position.y + 20
        ),
      };
      return logo;
    });

    setRotations(updatedRotations);
    const updatedSheet = {
      ...currentSheet,
      logos: [...updatedLogos, ...newLogos],
    };
    setCurrentSheet(updatedSheet);

    // Select the newly duplicated logos
    const newIndices = newLogos.map((_, i) => updatedLogos.length + i);
    setSelectedLogos(newIndices);
  };

  const handleSave = () => {
    setIsEditing(false);
    setIsFullscreen(false);
    if (onSheetUpdate) {
      onSheetUpdate(currentSheet);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsFullscreen(true);
  };

  const handleRotate = () => {
    const updatedSheet = { ...currentSheet };
    const updatedRotations = { ...rotations };

    selectedLogos.forEach((logoIndex) => {
      const logo = updatedSheet.logos[logoIndex];
      const logoId = `${logo.logo.logo_id}-${logoIndex}`;
      const currentRotation = rotations[logoId] || 0;
      updatedRotations[logoId] = (currentRotation + 90) % 360;

      const originalWidth = logo.dimensions.width;
      const originalHeight = logo.dimensions.height;

      // Calculate center point
      const centerX = logo.position.x + originalWidth / 2;
      const centerY = logo.position.y + originalHeight / 2;

      // Swap width and height
      const newWidth = originalHeight;
      const newHeight = originalWidth;

      // Calculate new position to maintain center point
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;

      updatedSheet.logos[logoIndex] = {
        ...logo,
        dimensions: {
          width: newWidth,
          height: newHeight,
        },
        position: {
          x: Math.max(0, Math.min(dimensions.width - newWidth, newX)),
          y: Math.max(0, Math.min(dimensions.height - newHeight, newY)),
        },
      };
    });

    setRotations(updatedRotations);
    setCurrentSheet(updatedSheet);
  };

  const previewContent = (
    <div className="flex items-center justify-center">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          ref={containerRef}
          className="border-2 border-dashed relative bg-muted select-none"
          style={{
            width: dimensions.width * scale,
            height: dimensions.height * scale,
            minWidth: dimensions.width * scale,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, 20px)',
              gridTemplateRows: 'repeat(auto-fill, 20px)',
              opacity: 0.05,
            }}
          >
            {Array.from({
              length:
                Math.ceil((dimensions.height * scale) / 20) *
                Math.ceil((dimensions.width * scale) / 20),
            }).map((_, i) => (
              <div
                key={i}
                className="border border-black dark:border-white"
              ></div>
            ))}
          </div>

          {/* Selection box */}
          {selectionBox && !activeId && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
              style={{
                left: `${
                  Math.min(selectionBox.startX, selectionBox.currentX) * scale
                }px`,
                top: `${
                  Math.min(selectionBox.startY, selectionBox.currentY) * scale
                }px`,
                width: `${
                  Math.abs(selectionBox.currentX - selectionBox.startX) * scale
                }px`,
                height: `${
                  Math.abs(selectionBox.currentY - selectionBox.startY) * scale
                }px`,
              }}
            />
          )}

          {currentSheet.logos.map((item, logoIndex) => {
            // Find if logo is part of a group
            let groupId: string | undefined;
            Object.entries(groups).forEach(([id, indices]) => {
              if (indices.includes(logoIndex)) {
                groupId = id;
              }
            });

            const logoId = `${item.logo.logo_id}-${logoIndex}`;
            const rotation = rotations[logoId] || 0;

            return (
              <DraggableLogo
                key={logoId}
                id={logoId}
                index={logoIndex}
                item={item}
                scale={scale}
                isEditing={isEditing}
                isSelected={selectedLogos.includes(logoIndex)}
                groupId={groupId}
                rotation={rotation}
                onSelect={handleLogoSelect}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-4 z-[101] bg-background rounded-lg shadow-lg border flex flex-col">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="bg-primary text-secondary hover:bg-black/90"
              >
                {currentSheet.size}
              </Badge>
              {quantity > 1 && (
                <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black">
                  × {quantity}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {selectedLogos.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleDuplicate}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                    Rotate
                  </Button>
                </>
              )}
              {selectedLogos.length >= 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleGroup}
                  >
                    <Group className="h-4 w-4" />
                    Group
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleUngroup}
                  >
                    <Ungroup className="h-4 w-4" />
                    Ungroup
                  </Button>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center">
            {previewContent}
          </div>

          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {dimensions.width}" × {dimensions.height}"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click and drag to select multiple logos. Hold Shift to add to
              selection. Press{' '}
              <kbd className="px-1 py-0.5 bg-muted rounded">R</kbd> to rotate,
              <kbd className="px-1 py-0.5 bg-muted rounded">Backspace</kbd> or
              <kbd className="px-1 py-0.5 bg-muted rounded">Delete</kbd> to
              remove selected logos. Press{' '}
              <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl/Cmd + G</kbd>{' '}
              to group,
              <kbd className="px-1 py-0.5 bg-muted rounded">
                Ctrl/Cmd + Shift + G
              </kbd>{' '}
              to ungroup,
              <kbd className="px-1 py-0.5 bg-muted rounded">
                Ctrl/Cmd + D
              </kbd>{' '}
              to duplicate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="default"
            className="bg-primary text-secondary hover:bg-black/90"
          >
            {currentSheet.size}
          </Badge>
          {quantity > 1 && (
            <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black">
              × {quantity}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              {selectedLogos.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleDuplicate}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                    Rotate
                  </Button>
                </>
              )}
              {selectedLogos.length >= 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleGroup}
                  >
                    <Group className="h-4 w-4" />
                    Group
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleUngroup}
                  >
                    <Ungroup className="h-4 w-4" />
                    Ungroup
                  </Button>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
                Expand
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">{previewContent}</div>

      <p className="text-sm text-muted-foreground mt-2">
        {dimensions.width}" × {dimensions.height}"
      </p>
      {isEditing && (
        <p className="text-xs text-muted-foreground mt-1">
          Click and drag to select multiple logos. Hold Shift to add to
          selection. Press <kbd className="px-1 py-0.5 bg-muted rounded">R</kbd>{' '}
          to rotate,
          <kbd className="px-1 py-0.5 bg-muted rounded">Backspace</kbd> or
          <kbd className="px-1 py-0.5 bg-muted rounded">Delete</kbd> to remove
          selected logos. Press{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl/Cmd + G</kbd> to
          group,
          <kbd className="px-1 py-0.5 bg-muted rounded">
            Ctrl/Cmd + Shift + G
          </kbd>{' '}
          to ungroup,
          <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl/Cmd + D</kbd> to
          duplicate.
        </p>
      )}
    </Card>
  );
}

function DraggableLogo({
  id,
  index,
  item,
  scale,
  isEditing,
  isSelected,
  groupId,
  rotation = 0,
  onSelect,
}: DraggableLogoProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    data: { index },
    disabled: !isEditing,
  });

  // Calculate container dimensions based on rotation
  let containerWidth = item.dimensions.width;
  let containerHeight = item.dimensions.height;
  if (rotation % 180 !== 0) {
    // Swap width and height for 90° or 270° rotations
    [containerWidth, containerHeight] = [containerHeight, containerWidth];
  }

  const style: React.CSSProperties = {
    width: `${containerWidth * scale}px`,
    height: `${containerHeight * scale}px`,
    left: `${
      (item.position.x + (item.dimensions.width - containerWidth) / 2) * scale
    }px`,
    top: `${
      (item.position.y + (item.dimensions.height - containerHeight) / 2) * scale
    }px`,
    position: 'absolute',
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${rotation}deg)`
      : `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    touchAction: 'none',
  };

  // The image should maintain its original dimensions
  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`border-2 transition-all duration-200 select-none ${
        isEditing ? 'cursor-move' : ''
      } ${
        isSelected
          ? 'border-primary ring-2 ring-primary ring-offset-2'
          : 'border-transparent'
      } 
      group hover:border-primary/50 ${
        groupId ? 'outline outline-2 outline-blue-500/50' : ''
      }`}
      style={style}
      onClick={(e) => isEditing && onSelect(index, e)}
    >
      {/* Shadow box overlay */}
      <div className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none" />

      <img
        src={item.logo.svg_link || item.logo.png_url}
        alt={item.logo.description}
        style={imgStyle}
        draggable={false}
      />

      {isEditing && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      )}
    </div>
  );
}
