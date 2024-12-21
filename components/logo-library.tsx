"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo, SelectedLogo } from '@/types';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface LogoLibraryProps {
  onLogoSelect: (logo: SelectedLogo) => void;
  onExpandChange: (expanded: boolean) => void;
}

export function LogoLibrary({ onLogoSelect, onExpandChange }: LogoLibraryProps) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const logosPerPage = 40;
  const defaultVisibleRows = 3; // Already set to 3 rows
  const logosPerRow = 4;

  useEffect(() => {
    fetchLogos();
  }, [page, searchTerm]);

  useEffect(() => {
    onExpandChange(expanded);
  }, [expanded, onExpandChange]);

const fetchLogos = async () => {
  setLoading(true);
  setError(null);
  try {
    let query = supabase
      .from('logos')
      .select('description, logo_id, logo_id_text, png_url, account_name, svg_link', { count: 'exact' });

    if (searchTerm) {
      const isNumeric = !isNaN(Number(searchTerm));
      if (isNumeric) {
        query = query.or(
          `description.ilike.%${searchTerm}%,` +
          `account_name.ilike.%${searchTerm}%,` +
          `logo_id_text.ilike.%${searchTerm}%`
        );
      } else {
        query = query.or(
          `description.ilike.%${searchTerm}%,` +
          `account_name.ilike.%${searchTerm}%`
        );
      }
    }

    const { data, count, error } = await query
      .range((page - 1) * logosPerPage, page * logosPerPage - 1)
      .order('logo_id');

    if (error) {
      throw error;
    }

    setLogos(data || []);
    setTotalPages(Math.ceil((count || 0) / logosPerPage));
  } catch (error) {
    console.error('Error fetching logos:', error);
    setError('Failed to load logos. Please try again later.');
  } finally {
    setLoading(false);
  }
};



  const handleLogoSelect = (logo: Logo) => {
    const selectedLogo: SelectedLogo = {
      ...logo,
      width: 1,
      quantity: 1,
    };
    onLogoSelect(selectedLogo);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    setExpanded(true);
  };

  const visibleLogos = expanded ? logos : logos.slice(0, defaultVisibleRows * logosPerRow);

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => fetchLogos()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by description, account name, or logo ID..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : logos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No logos found
        </div>
      ) : (
        <div className="space-y-4">
          <div 
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transition-all duration-500 ease-in-out`}
            style={{
              maxHeight: expanded ? `${Math.ceil(logos.length / logosPerRow) * 280}px` : '840px',
              overflow: 'hidden',
              transition: 'max-height 0.5s ease-in-out'
            }}
          >
            {visibleLogos.map((logo) => (
              <Card
                key={logo.logo_id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => handleLogoSelect(logo)}
              >
                <div className="aspect-square relative mb-2">
                  <img
                    src={logo.png_url}
                    alt={logo.description || 'Logo'}
                    className="object-contain w-full h-full"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5"
                  >
                    {logo.logo_id}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">
                  {logo.description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {logo.account_name || 'No account name'}
                </p>
              </Card>
            ))}
          </div>

          {logos.length > (defaultVisibleRows * logosPerRow) && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <span className="flex items-center gap-2">
                  Show Less <ChevronUp className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Show More ({logos.length - (defaultVisibleRows * logosPerRow)} more) <ChevronDown className="h-4 w-4" />
                </span>
              )}
            </Button>
          )}

          {expanded && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="py-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
