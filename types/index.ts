export interface Logo {
  description: string;
  logo_id: string;
  png_url: string;
  account_name: string;
  svg_link: string;
}

export interface SelectedLogo extends Logo {
  width: number;
  quantity: number;
  notes?: string;
  rotated?: boolean;
}

export interface Sheet {
  size: SheetSize;
  logos: Array<{
    logo: SelectedLogo;
    position: { x: number; y: number };
    dimensions: { width: number; height: number };
    rotated: boolean;
  }>;
}

export interface GroupedSheet {
  sheet: Sheet;
  quantity: number;
  index: number;
}

export type SheetSize = 'Small' | 'Medium' | 'Large' | 'Extra Large';

export const SHEET_DIMENSIONS = {
  'Small': { width: 11.00, height: 12.50 },
  'Medium': { width: 22.50, height: 12.50 },
  'Large': { width: 22.50, height: 25.00 },
  'Extra Large': { width: 22.50, height: 60.00 }
};

export const SHEET_PRICES = {
  'Small': 3.35,
  'Medium': 6.50,
  'Large': 12.75,
  'Extra Large': 30.00
};