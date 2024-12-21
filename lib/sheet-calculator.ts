import { SelectedLogo, Sheet, SheetSize, SHEET_DIMENSIONS, SHEET_PRICES } from '@/types';

const SPACING = 0.15; // 0.15 inches spacing between logos
const MARGIN = 0.2; // 0.2 inches margin around the sheet
const SMALL_LOGO_THRESHOLD = 2.25; // Logos under this width are considered small

interface LogoPlacement {
  logo: SelectedLogo;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  rotated: boolean;
}

interface SheetFitResult {
  placements: LogoPlacement[];
  logosPlaced: number;
  costPerLogo: number;
}

interface LogoInstance {
  logo: SelectedLogo;
  dimensions: { width: number; height: number };
  instanceId: string;
}

async function getImageAspectRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width / img.height);
    img.onerror = () => resolve(2); // Default to 2:1 aspect ratio if image fails to load
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

function findBestFitForSheet(
  logos: LogoInstance[],
  size: SheetSize
): SheetFitResult {
  const dimensions = SHEET_DIMENSIONS[size];
  const placements: LogoPlacement[] = [];
  let currentY = MARGIN;
  let logosToPlace = [...logos];
  let logosPlaced = 0;

  // Sort logos by height (descending) for better packing
  logosToPlace.sort((a, b) => b.dimensions.height - a.dimensions.height);

  // Process logos row by row
  while (logosToPlace.length > 0) {
    let currentX = MARGIN;
    let rowHeight = 0;
    const rowLogos = [];

    // Try to fill the current row
    for (let i = 0; i < logosToPlace.length; i++) {
      const logo = logosToPlace[i];
      const rotated = logo.logo.rotated || false;
      const effectiveWidth = rotated ? logo.dimensions.height : logo.dimensions.width;
      const effectiveHeight = rotated ? logo.dimensions.width : logo.dimensions.height;

      // Check if logo fits in the current row
      if (currentX + effectiveWidth <= dimensions.width - MARGIN) {
        rowLogos.push(logo);
        currentX += effectiveWidth + SPACING;
        rowHeight = Math.max(rowHeight, effectiveHeight);
      } else {
        break; // Move to next row
      }
    }

    if (rowLogos.length === 0) break; // Stop if no logos fit in the row

    // Check if row fits in the remaining sheet height
    if (currentY + rowHeight > dimensions.height - MARGIN) {
      break; // No more rows can fit
    }

    // Place logos in the row
    currentX = MARGIN;
    for (const logo of rowLogos) {
      const rotated = logo.logo.rotated || false;
      const effectiveWidth = rotated ? logo.dimensions.height : logo.dimensions.width;
      const effectiveHeight = rotated ? logo.dimensions.width : logo.dimensions.height;

      placements.push({
        logo: logo.logo,
        position: { x: currentX, y: currentY },
        dimensions: { width: effectiveWidth, height: effectiveHeight },
        rotated,
      });
      currentX += effectiveWidth + SPACING;
      logosPlaced++;
    }

    // Move to the next row
    currentY += rowHeight + SPACING;
    logosToPlace = logosToPlace.filter((logo) => !rowLogos.includes(logo));
  }

  const costPerLogo = logosPlaced > 0 ? SHEET_PRICES[size] / logosPlaced : Infinity;

  return { placements, logosPlaced, costPerLogo };
}

function groupLogosByNotes(logos: LogoInstance[]): Map<string, LogoInstance[]> {
  const groups = new Map<string, LogoInstance[]>();
  
  // Group logos by notes
  logos.forEach(logo => {
    const notes = logo.logo.notes || '';
    if (!groups.has(notes)) {
      groups.set(notes, []);
    }
    groups.get(notes)!.push(logo);
  });

  return groups;
}

export async function calculateSheets(
  selectedLogos: SelectedLogo[],
  preferredSize: SheetSize | null = null
): Promise<Sheet[]> {
  if (!selectedLogos.length) return [];

  const sheets: Sheet[] = [];

  // Pre-calculate aspect ratios
  const aspectRatios = new Map<string, number>();

  await Promise.all(
    selectedLogos.map(async (logo) => {
      if (!aspectRatios.has(logo.logo_id)) {
        const ratio = await getImageAspectRatio(logo.svg_link || logo.png_url);
        aspectRatios.set(logo.logo_id, ratio);
      }
    })
  );

  // Create logo instances with dimensions
  const allLogos: LogoInstance[] = [];
  selectedLogos.forEach((logo) => {
    const ratio = aspectRatios.get(logo.logo_id) || 2;
    const dimensions = {
      width: logo.width,
      height: logo.width / ratio
    };

    for (let i = 0; i < logo.quantity; i++) {
      allLogos.push({
        logo: {
          ...logo,
          width: dimensions.width
        },
        dimensions,
        instanceId: `${logo.logo_id}-${i}`
      });
    }
  });

  // Group logos by notes
  const groupedLogos = groupLogosByNotes(allLogos);

  // Process each group separately
  for (const [notes, logos] of groupedLogos) {
    let remainingLogos = [...logos];

    while (remainingLogos.length > 0) {
      let bestSize = preferredSize || 'Small';
      let bestResult: SheetFitResult | null = null;

      if (!preferredSize) {
        // Try each size and use the most cost-effective one
        const sizes: SheetSize[] = ['Small', 'Medium', 'Large', 'Extra Large'];
        let bestCostPerLogo = Infinity;

        for (const size of sizes) {
          const result = findBestFitForSheet(remainingLogos, size);
          
          if (result.logosPlaced > 0 && result.costPerLogo < bestCostPerLogo) {
            bestCostPerLogo = result.costPerLogo;
            bestSize = size;
            bestResult = result;
          }
        }
      } else {
        bestResult = findBestFitForSheet(remainingLogos, bestSize);
      }

      if (bestResult && bestResult.placements.length > 0) {
        sheets.push({
          size: bestSize,
          logos: bestResult.placements
        });
        remainingLogos = remainingLogos.slice(bestResult.logosPlaced);
      } else {
        if (!preferredSize) {
          const currentSizeIndex = ['Small', 'Medium', 'Large', 'Extra Large'].indexOf(bestSize);
          if (currentSizeIndex < 3) {
            continue;
          }
        }
        sheets.push({
          size: bestSize,
          logos: [
            {
              logo: remainingLogos[0].logo,
              position: { x: MARGIN, y: MARGIN },
              dimensions: remainingLogos[0].dimensions,
              rotated: remainingLogos[0].logo.rotated || false
            },
          ],
        });
        remainingLogos.shift();
      }
    }
  }

  return sheets;
}