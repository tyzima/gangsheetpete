import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Sheet, SHEET_DIMENSIONS } from '@/types';

async function loadSVG(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const svgText = await response.text();
    // Add viewBox and preserveAspectRatio attributes to maintain aspect ratio
    const modifiedSvg = svgText.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
    const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error loading SVG:', error);
    return '';
  }
}

export async function generatePDF(element: HTMLElement, sheet: Sheet, index: number) {
  const dimensions = SHEET_DIMENSIONS[sheet.size];
  
  // Create PDF with exact dimensions
  const pdf = new jsPDF({
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
    unit: 'in',
    format: [dimensions.width, dimensions.height]
  });

  // Create a temporary container with exact dimensions
  const container = document.createElement('div');
  container.style.width = `${dimensions.width}in`;
  container.style.height = `${dimensions.height}in`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.backgroundColor = 'white';
  document.body.appendChild(container);

  try {
    // Create logo elements with exact dimensions
    for (const item of sheet.logos) {
      const logoContainer = document.createElement('div');
      logoContainer.style.position = 'absolute';
      logoContainer.style.left = `${item.position.x}in`;
      logoContainer.style.top = `${item.position.y}in`;
      logoContainer.style.width = `${item.rotated ? item.logo.width / 2 : item.logo.width}in`;
      logoContainer.style.height = `${item.rotated ? item.logo.width : item.logo.width / 2}in`;

      const img = document.createElement('img');
      if (item.logo.svg_link) {
        const objectUrl = await loadSVG(item.logo.svg_link);
        if (objectUrl) {
          img.src = objectUrl;
        } else {
          img.src = item.logo.png_url;
        }
      } else {
        img.src = item.logo.png_url;
      }

      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      if (item.rotated) {
        img.style.transform = 'rotate(90deg)';
        img.style.transformOrigin = 'center center';
      }

      logoContainer.appendChild(img);
      container.appendChild(logoContainer);

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });
    }

    // Convert to canvas at high DPI
    const canvas = await html2canvas(container, {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      onclone: (clonedDoc, element) => {
        element.style.width = `${dimensions.width}in`;
        element.style.height = `${dimensions.height}in`;
      }
    });

    // Add to PDF with exact dimensions
    pdf.addImage(
      canvas.toDataURL('image/png', 1.0),
      'PNG',
      0,
      0,
      dimensions.width,
      dimensions.height,
      undefined,
      'FAST'
    );

    pdf.save(`dtf-sheet-${index + 1}-${sheet.size.toLowerCase()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateAllPDFs(sheets: Sheet[]) {
  // Create first sheet's dimensions as initial PDF size
  const firstDimensions = SHEET_DIMENSIONS[sheets[0].size];
  const pdf = new jsPDF({
    orientation: firstDimensions.width > firstDimensions.height ? 'landscape' : 'portrait',
    unit: 'in',
    format: [firstDimensions.width, firstDimensions.height]
  });

  for (const [index, sheet] of sheets.entries()) {
    const dimensions = SHEET_DIMENSIONS[sheet.size];
    
    // Add new page with correct dimensions for subsequent sheets
    if (index > 0) {
      pdf.addPage([dimensions.width, dimensions.height]);
    }

    // Create temporary container for this sheet
    const container = document.createElement('div');
    container.style.width = `${dimensions.width}in`;
    container.style.height = `${dimensions.height}in`;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    try {
      // Create logo elements with exact dimensions
      for (const item of sheet.logos) {
        const logoContainer = document.createElement('div');
        logoContainer.style.position = 'absolute';
        logoContainer.style.left = `${item.position.x}in`;
        logoContainer.style.top = `${item.position.y}in`;
        logoContainer.style.width = `${item.rotated ? item.logo.width / 2 : item.logo.width}in`;
        logoContainer.style.height = `${item.rotated ? item.logo.width : item.logo.width / 2}in`;

        const img = document.createElement('img');
        if (item.logo.svg_link) {
          const objectUrl = await loadSVG(item.logo.svg_link);
          if (objectUrl) {
            img.src = objectUrl;
          } else {
            img.src = item.logo.png_url;
          }
        } else {
          img.src = item.logo.png_url;
        }

        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        if (item.rotated) {
          img.style.transform = 'rotate(90deg)';
          img.style.transformOrigin = 'center center';
        }

        logoContainer.appendChild(img);
        container.appendChild(logoContainer);

        // Wait for image to load
        await new Promise((resolve) => {
          img.onload = resolve;
        });
      }

      // Convert to canvas at high DPI
      const canvas = await html2canvas(container, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (clonedDoc, element) => {
          element.style.width = `${dimensions.width}in`;
          element.style.height = `${dimensions.height}in`;
        }
      });

      // Add to PDF with exact dimensions
      pdf.addImage(
        canvas.toDataURL('image/png', 1.0),
        'PNG',
        0,
        0,
        dimensions.width,
        dimensions.height,
        undefined,
        'FAST'
      );
    } finally {
      document.body.removeChild(container);
    }
  }

  pdf.save('all-dtf-sheets.pdf');
}