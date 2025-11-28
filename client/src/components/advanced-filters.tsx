import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Filter, X, SlidersHorizontal, MapPin, Calendar, Heart, Tag, ArrowUpDown, Check } from "lucide-react";
import type { Location, Category } from "@shared/schema";

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  currentFilters: FilterValues;
}

export interface FilterValues {
  minPrice?: string;
  maxPrice?: string;
  city?: string;
  minAge?: string;
  maxAge?: string;
  gender?: string;
  breed?: string;
  healthStatus?: string;
  vaccinated?: string;
  sortBy?: string;
  sortOrder?: string;
}

const sortOptions = [
  { value: "createdAt_desc", label: "En Yeni", icon: Calendar },
  { value: "createdAt_asc", label: "En Eski", icon: Calendar },
  { value: "price_asc", label: "Fiyat (Düşükten Yükseğe)", icon: ArrowUpDown },
  { value: "price_desc", label: "Fiyat (Yüksekten Düşüğe)", icon: ArrowUpDown },
  { value: "views_desc", label: "En Çok Görüntülenen", icon: Heart },
];

const quickFilters = [
  { key: "vaccinated", value: "true", label: "Aşılı", icon: Check },
  { key: "healthStatus", value: "healthy", label: "Sağlıklı", icon: Heart },
  { key: "gender", value: "male", label: "Erkek", icon: Tag },
  { key: "gender", value: "female", label: "Dişi", icon: Tag },
];

export function AdvancedFilters({ onFilterChange, currentFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const { data: cities = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { type: "il" }],
    staleTime: 1000 * 60 * 60,
  });

  const handleApply = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterValues = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const handleQuickFilter = (key: string, value: string) => {
    const newFilters = { ...currentFilters };
    if (newFilters[key as keyof FilterValues] === value) {
      delete newFilters[key as keyof FilterValues];
    } else {
      (newFilters as any)[key] = value;
    }
    onFilterChange(newFilters);
  };

  const handleSortChange = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split("_");
    onFilterChange({ ...currentFilters, sortBy, sortOrder });
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    key => currentFilters[key as keyof FilterValues] !== undefined && 
           currentFilters[key as keyof FilterValues] !== '' &&
           key !== 'sortBy' && key !== 'sortOrder'
  ).length;

  const currentSort = currentFilters.sortBy && currentFilters.sortOrder 
    ? `${currentFilters.sortBy}_${currentFilters.sortOrder}` 
    : "createdAt_desc";

  const FilterContent = () => (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["price", "location", "animal"]} className="w-full">
        {/* Price Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Fiyat Aralığı
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Min (₺)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                  className="h-10"
                  data-testid="input-min-price"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max (₺)</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                  className="h-10"
                  data-testid="input-max-price"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Location Filter */}
        <AccordionItem value="location">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Konum
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <Select
                value={localFilters.city || 'all'}
                onValueChange={(value) => setLocalFilters({ ...localFilters, city: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="h-10" data-testid="select-city">
                  <SelectValue placeholder="Şehir Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şehirler</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.slug}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Animal Details */}
        <AccordionItem value="animal">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Hayvan Özellikleri
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {/* Gender */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cinsiyet</Label>
                <Select
                  value={localFilters.gender || 'all'}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, gender: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-10" data-testid="select-gender">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Dişi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Yaş (ay)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minAge || ''}
                    onChange={(e) => setLocalFilters({ ...localFilters, minAge: e.target.value })}
                    className="h-10"
                    data-testid="input-min-age"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxAge || ''}
                    onChange={(e) => setLocalFilters({ ...localFilters, maxAge: e.target.value })}
                    className="h-10"
                    data-testid="input-max-age"
                  />
                </div>
              </div>

              {/* Breed */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Irk</Label>
                <Input
                  type="text"
                  placeholder="Irk ara..."
                  value={localFilters.breed || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, breed: e.target.value })}
                  className="h-10"
                  data-testid="input-breed"
                />
              </div>

              {/* Health Status */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sağlık Durumu</Label>
                <Select
                  value={localFilters.healthStatus || 'all'}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, healthStatus: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-10" data-testid="select-health-status">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="healthy">Sağlıklı</SelectItem>
                    <SelectItem value="needs_attention">Dikkat Gerekiyor</SelectItem>
                    <SelectItem value="under_treatment">Tedavi Altında</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vaccinated */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Aşı Durumu</Label>
                <Select
                  value={localFilters.vaccinated || 'all'}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, vaccinated: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-10" data-testid="select-vaccinated">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="true">Aşılı</SelectItem>
                    <SelectItem value="false">Aşısız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Top Bar - Sort + Filter Button */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        {/* Quick Filters - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {quickFilters.map((filter) => {
            const isActive = currentFilters[filter.key as keyof FilterValues] === filter.value;
            return (
              <Button
                key={`${filter.key}-${filter.value}`}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter(filter.key, filter.value)}
                className="shrink-0 h-8 text-xs"
                data-testid={`quick-filter-${filter.key}-${filter.value}`}
              >
                <filter.icon className="w-3 h-3 mr-1" />
                {filter.label}
              </Button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-48 h-9" data-testid="select-sort">
              <ArrowUpDown className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Button - Opens Sheet on Mobile, Collapsible on Desktop */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="h-9 shrink-0"
                data-testid="button-open-filters"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Filtreler</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col h-[100dvh] max-h-[100dvh]">
              <SheetHeader className="p-3 min-[400px]:p-4 border-b shrink-0">
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtreler
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Arama sonuçlarını daraltın
                </SheetDescription>
              </SheetHeader>
              
              <ScrollArea className="flex-1 p-3 min-[400px]:p-4 overflow-y-auto">
                <FilterContent />
              </ScrollArea>

              <SheetFooter className="p-3 min-[400px]:p-4 border-t gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex-1 h-11"
                  data-testid="button-reset-filters"
                >
                  <X className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
                <Button 
                  onClick={handleApply}
                  className="flex-1 h-11"
                  data-testid="button-apply-filters"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Uygula ({activeFilterCount})
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Aktif:</span>
          {currentFilters.minPrice && (
            <Badge variant="secondary" className="text-xs gap-1">
              Min: ₺{currentFilters.minPrice}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, minPrice: undefined })}
              />
            </Badge>
          )}
          {currentFilters.maxPrice && (
            <Badge variant="secondary" className="text-xs gap-1">
              Max: ₺{currentFilters.maxPrice}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, maxPrice: undefined })}
              />
            </Badge>
          )}
          {currentFilters.city && (
            <Badge variant="secondary" className="text-xs gap-1">
              {cities.find(c => c.slug === currentFilters.city)?.name || currentFilters.city}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, city: undefined })}
              />
            </Badge>
          )}
          {currentFilters.gender && (
            <Badge variant="secondary" className="text-xs gap-1">
              {currentFilters.gender === 'male' ? 'Erkek' : 'Dişi'}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, gender: undefined })}
              />
            </Badge>
          )}
          {currentFilters.healthStatus && (
            <Badge variant="secondary" className="text-xs gap-1">
              {currentFilters.healthStatus === 'healthy' ? 'Sağlıklı' : currentFilters.healthStatus}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, healthStatus: undefined })}
              />
            </Badge>
          )}
          {currentFilters.vaccinated && (
            <Badge variant="secondary" className="text-xs gap-1">
              {currentFilters.vaccinated === 'true' ? 'Aşılı' : 'Aşısız'}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, vaccinated: undefined })}
              />
            </Badge>
          )}
          {currentFilters.breed && (
            <Badge variant="secondary" className="text-xs gap-1">
              Irk: {currentFilters.breed}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, breed: undefined })}
              />
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-6 text-xs text-muted-foreground"
            data-testid="button-clear-all-filters"
          >
            Tümünü Temizle
          </Button>
        </div>
      )}
    </div>
  );
}
