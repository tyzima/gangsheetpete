import { Sheet, SHEET_DIMENSIONS } from '@/types';
import html2canvas from 'html2canvas';

const DPI = 300;
const FOOTER_HEIGHT = 0.65;
const THUMBNAIL_SIZE = 0.7;
const FONT_SIZE = 48;
const PADDING = 0.1 * DPI;

interface GeneratePNGOptions {
  rotations?: { [key: string]: number };
}

export async function generatePNG(
  sheet: Sheet, 
  index: number, 
  filename: string,
  options: GeneratePNGOptions = {}
) {
  const dimensions = SHEET_DIMENSIONS[sheet.size];
  const pixelWidth = Math.round(dimensions.width * DPI);
  const pixelHeight = Math.round((dimensions.height + FOOTER_HEIGHT) * DPI);

  const container = document.createElement('div');
  container.style.width = `${pixelWidth}px`;
  container.style.height = `${pixelHeight}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.backgroundColor = 'transparent';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  document.body.appendChild(container);

  try {
    // Main content area for logos
    const contentArea = document.createElement('div');
    contentArea.style.position = 'absolute';
    contentArea.style.top = '0';
    contentArea.style.left = '0';
    contentArea.style.width = `${dimensions.width * DPI}px`;
    contentArea.style.height = `${dimensions.height * DPI}px`;
    container.appendChild(contentArea);

    // Add logos to content area
    for (const item of sheet.logos) {
      const logoId = `${item.logo.logo_id}-${sheet.logos.indexOf(item)}`;
      const rotation = options.rotations?.[logoId] || 0;
      
      // Calculate rotated dimensions
      let width = item.dimensions.width;
      let height = item.dimensions.height;
      if (rotation % 180 !== 0) {
        // Swap width and height for 90° or 270° rotations
        [width, height] = [height, width];
      }

      const logoContainer = document.createElement('div');
      logoContainer.style.position = 'absolute';
      
      // Calculate center point
      const centerX = item.position.x + (item.dimensions.width / 2);
      const centerY = item.position.y + (item.dimensions.height / 2);
      
      // Position based on center and rotated dimensions
      const left = centerX - (width / 2);
      const top = centerY - (height / 2);
      
      logoContainer.style.left = `${left * DPI}px`;
      logoContainer.style.top = `${top * DPI}px`;
      logoContainer.style.width = `${width * DPI}px`;
      logoContainer.style.height = `${height * DPI}px`;

      // Create wrapper for rotation
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.position = 'absolute';
      
      if (rotation) {
        wrapper.style.transform = `rotate(${rotation}deg)`;
        wrapper.style.transformOrigin = 'center center';
      }

      const img = document.createElement('img');
      img.src = item.logo.svg_link || item.logo.png_url;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.crossOrigin = 'anonymous';

      wrapper.appendChild(img);
      logoContainer.appendChild(wrapper);
      contentArea.appendChild(logoContainer);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          img.crossOrigin = '';
          img.src = item.logo.png_url;
          img.onload = resolve;
          img.onerror = reject;
        };
      });
    }

    // Footer
    const footer = document.createElement('div');
    footer.style.position = 'absolute';
    footer.style.left = '0';
    footer.style.top = `${(dimensions.height * DPI) - 40}px`;
    footer.style.width = `${dimensions.width * DPI}px`;
    footer.style.height = `${FOOTER_HEIGHT * DPI}px`;
    footer.style.minHeight = `${FOOTER_HEIGHT * DPI}px`;
    footer.style.backgroundColor = '#f8f9fa';
    footer.style.borderTop = '2px solid #e9ecef';
    footer.style.display = 'flex';
    footer.style.alignItems = 'flex-start';
    footer.style.paddingTop = '30px';
    footer.style.gap = `${PADDING * 2}px`;
    footer.style.padding = `${PADDING}px`;
    footer.style.overflowX = 'auto';
    footer.style.overflowY = 'hidden';
    footer.style.whiteSpace = 'nowrap';

    // Add unique logos to footer
    const uniqueLogos = Array.from(new Map(
      sheet.logos.map(item => [item.logo.logo_id, item.logo])
    ).values());

    uniqueLogos.forEach((logo) => {
      const logoInfo = document.createElement('div');
      logoInfo.style.display = 'flex';
      logoInfo.style.alignItems = 'center';
      logoInfo.style.gap = `${PADDING}px`;
      logoInfo.style.backgroundColor = 'white';
      logoInfo.style.padding = `${PADDING}px`;
      logoInfo.style.borderRadius = '8px';
      logoInfo.style.border = '1px solid #e9ecef';
      logoInfo.style.height = `${(FOOTER_HEIGHT * DPI) - (PADDING * 1.5)}px`;
      logoInfo.style.flexShrink = '0';
      logoInfo.style.boxSizing = 'border-box';

      // Thumbnail
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.style.width = `${THUMBNAIL_SIZE * DPI}px`;
      thumbnailContainer.style.height = `${THUMBNAIL_SIZE * DPI}px`;
      thumbnailContainer.style.backgroundColor = '#f8f9fa';
      thumbnailContainer.style.borderRadius = '4px';
      thumbnailContainer.style.display = 'flex';
      thumbnailContainer.style.alignItems = 'center';
      thumbnailContainer.style.justifyContent = 'center';
      thumbnailContainer.style.overflow = 'hidden';

      const thumbnail = document.createElement('img');
      thumbnail.src = logo.png_url;
      thumbnail.style.maxWidth = '100%';
      thumbnail.style.maxHeight = '100%';
      thumbnail.style.objectFit = 'contain';
      thumbnail.crossOrigin = 'anonymous';
      thumbnailContainer.appendChild(thumbnail);

      // Text container
      const textContainer = document.createElement('div');
      textContainer.style.display = 'flex';
      textContainer.style.alignItems = 'center';
      textContainer.style.gap = `${PADDING}px`;
      textContainer.style.height = '100%';

      // Account name
      const accountName = document.createElement('span');
      accountName.textContent = logo.account_name;
      accountName.style.fontSize = `${FONT_SIZE * 0.9}px`;
      accountName.style.fontWeight = '600';
      accountName.style.whiteSpace = 'nowrap';
      accountName.style.flexShrink = '0';
      accountName.style.lineHeight = '1.2';

      // ID
      const logoId = document.createElement('span');
      logoId.textContent = `(ID: ${logo.logo_id})`;
      logoId.style.fontSize = `${FONT_SIZE * 0.9}px`;
      logoId.style.color = '#666';
      logoId.style.whiteSpace = 'nowrap';
      logoId.style.flexShrink = '0';
      logoId.style.lineHeight = '1.2';

      // Notes
      if (logo.notes) {
        const notes = document.createElement('span');
        notes.textContent = `- ${logo.notes}`;
        notes.style.fontSize = `${FONT_SIZE * 0.9}px`;
        notes.style.color = '#666';
        notes.style.fontWeight = '600';
        notes.style.whiteSpace = 'nowrap';
        notes.style.flexShrink = '0';
        notes.style.lineHeight = '1.2';
        textContainer.appendChild(notes);
      }

      textContainer.appendChild(accountName);
      textContainer.appendChild(logoId);

      logoInfo.appendChild(thumbnailContainer);
      logoInfo.appendChild(textContainer);
      footer.appendChild(logoInfo);
    });

    container.appendChild(footer);

    // Convert to canvas
    const canvas = await html2canvas(container, {
      width: pixelWidth,
      height: pixelHeight,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      imageTimeout: 0,
      logging: false,
      onclone: (clonedDoc, element) => {
        element.style.width = `${pixelWidth}px`;
        element.style.height = `${pixelHeight}px`;
      }
    });

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } finally {
    document.body.removeChild(container);
  }
}