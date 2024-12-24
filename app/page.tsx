'use client';

import { useState, useEffect } from 'react';
import { LogoLibrary } from '@/components/logo-library';
import { SelectedLogos } from '@/components/selected-logos';
import { SheetPreview } from '@/components/sheet-preview';
import { Button } from '@/components/ui/button';
import { SelectedLogo, Sheet, GroupedSheet, SheetSize } from '@/types';
import { calculateSheets } from '@/lib/sheet-calculator';
import { Printer, ChevronUp, ChevronDown, LayoutPanelLeft } from 'lucide-react';

export default function Home() {
  const [selectedLogos, setSelectedLogos] = useState<SelectedLogo[]>([]);
  const [sheets, setSheets] = useState<GroupedSheet[]>([]);
  const [showSheets, setShowSheets] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [preferredSheetSize, setPreferredSheetSize] =
    useState<SheetSize | null>(null);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  const [isLogoSectionCollapsed, setIsLogoSectionCollapsed] = useState(false);

  const handleLogoSelect = (logo: SelectedLogo) => {
    setSheets([]);
    setShowSheets(false);
    setSelectedLogos([...selectedLogos, logo]);
  };

  const handleLogoRemove = (index: number) => {
    setSheets([]);
    setShowSheets(false);
    setSelectedLogos(selectedLogos.filter((_, i) => i !== index));
  };

  const handleLogoUpdate = (index: number, updatedLogo: SelectedLogo) => {
    setSheets([]);
    setShowSheets(false);
    const newLogos = [...selectedLogos];
    newLogos[index] = updatedLogo;
    setSelectedLogos(newLogos);
  };

  const handleSheetUpdate = (index: number, updatedSheet: Sheet) => {
    const updatedSheets = [...sheets];
    updatedSheets[index] = {
      ...updatedSheets[index],
      sheet: updatedSheet,
    };
    setSheets(updatedSheets);
  };

  const groupIdenticalSheets = (sheets: Sheet[]): GroupedSheet[] => {
    const groupedSheets = new Map<string, GroupedSheet>();

    sheets.forEach((sheet, index) => {
      const key = JSON.stringify({
        size: sheet.size,
        logos: sheet.logos.map((logo) => ({
          logo_id: logo.logo.logo_id,
          width: logo.dimensions.width,
          height: logo.dimensions.height,
          position: logo.position,
          rotated: logo.rotated,
        })),
      });

      if (groupedSheets.has(key)) {
        groupedSheets.get(key)!.quantity++;
      } else {
        groupedSheets.set(key, {
          sheet,
          quantity: 1,
          index,
        });
      }
    });

    return Array.from(groupedSheets.values());
  };

  const handleBuildSheets = async () => {
    setIsCalculating(true);
    setIsLogoSectionCollapsed(true);
    try {
      const calculatedSheets = await calculateSheets(
        selectedLogos,
        preferredSheetSize
      );
      const groupedSheets = groupIdenticalSheets(calculatedSheets);
      setSheets(groupedSheets);
      setShowSheets(true);
    } catch (error) {
      console.error('Error calculating sheets:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-left justify-left gap-2">
            <LayoutPanelLeft className="h-6 w-6 mt-2 text-primary" />
            <h1 className="text-2xl font-normal tracking-tighter">
              <span className="text-2xl font-bold">Sheet </span>
               Builder
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border rounded-lg overflow-hidden relative z-20">
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center p-4 h-auto z-10"
              onClick={() => setIsLogoSectionCollapsed(!isLogoSectionCollapsed)}
            >
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold">
                  1
                </span>
                <span className="text-xl font-semibold tracking-tight">
                  Add Logos
                </span>
              </div>
              {isLogoSectionCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>

            <div
              className={`transition-all duration-300 ease-in-out ${
                isLogoSectionCollapsed ? 'h-0' : 'h-auto'
              }`}
            >
              <div
                className={`p-4 ${isLogoSectionCollapsed ? 'hidden' : 'block'}`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                  <div className="space-y-6">
                    <LogoLibrary
                      onLogoSelect={handleLogoSelect}
                      onExpandChange={setIsLibraryExpanded}
                    />
                  </div>

                  <div
                    className={`space-y-6 transition-all duration-300 ease-in-out ${
                      isLibraryExpanded
                        ? 'lg:fixed lg:top-4 lg:right-4 lg:w-[calc(50%-2rem)] lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:bg-background lg:p-4 lg:rounded-lg lg:shadow-lg lg:border lg:opacity-100 lg:translate-x-0 lg:z-30'
                        : 'lg:opacity-100 lg:translate-x-0'
                    }`}
                  >
                    <SelectedLogos
                      logos={selectedLogos}
                      onLogoRemove={handleLogoRemove}
                      onLogoUpdate={handleLogoUpdate}
                      preferredSheetSize={preferredSheetSize}
                      onPreferredSheetSizeChange={setPreferredSheetSize}
                    />

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBuildSheets}
                      disabled={selectedLogos.length === 0 || isCalculating}
                    >
                      {isCalculating ? 'Calculating...' : 'Build Sheets'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showSheets && sheets.length > 0 && (
            <div className="mt-8 relative">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold">
                    3
                  </span>
                  <span className="text-xl font-semibold">Download Sheets</span>
                </div>{' '}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sheets.map((groupedSheet, index) => (
                  <SheetPreview
                    key={index}
                    sheet={groupedSheet.sheet}
                    index={groupedSheet.index}
                    quantity={groupedSheet.quantity}
                    onSheetUpdate={(updatedSheet) =>
                      handleSheetUpdate(index, updatedSheet)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
