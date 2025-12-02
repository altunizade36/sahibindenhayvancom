import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Filter, X, SlidersHorizontal, MapPin, Calendar, Heart, Tag, ArrowUpDown, Check, Syringe, Scissors, Award, Bell, Save, Trash2, BellRing } from "lucide-react";
import type { Location, Category } from "@shared/schema";
import { AGE_CATEGORIES, GENDER_OPTIONS, HEALTH_STATUS_OPTIONS, CHARACTER_TRAITS } from "@shared/listing-options";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  currentFilters: FilterValues;
}

export interface FilterValues {
  minPrice?: string;
  maxPrice?: string;
  city?: string;
  district?: string;
  minAge?: string;
  maxAge?: string;
  ageCategory?: string;
  gender?: string;
  breed?: string;
  healthStatus?: string;
  vaccinated?: string;
  neutered?: string;
  pedigree?: string;
  characterTraits?: string[];
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
  { key: "vaccinated", value: "true", label: "Aşılı", icon: Syringe },
  { key: "neutered", value: "true", label: "Kısır", icon: Scissors },
  { key: "pedigree", value: "true", label: "Pedigree", icon: Award },
  { key: "healthStatus", value: "healthy", label: "Sağlıklı", icon: Heart },
  { key: "gender", value: "male", label: "Erkek", icon: Tag },
  { key: "gender", value: "female", label: "Dişi", icon: Tag },
];

const pricePresets = [
  { label: "5.000 TL'ye kadar", max: 5000 },
  { label: "10.000 TL'ye kadar", max: 10000 },
  { label: "25.000 TL'ye kadar", max: 25000 },
  { label: "50.000 TL'ye kadar", max: 50000 },
  { label: "100.000 TL'ye kadar", max: 100000 },
];

const formatPrice = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

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

  // Fetch districts when city is selected (find city by name)
  const selectedCityData = cities.find(c => c.name === localFilters.city);
  const { data: districts = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { type: "ilce", parent: selectedCityData?.id }],
    enabled: !!selectedCityData?.id,
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

  const activeFilterCount = Object.keys(currentFilters).filter(key => {
    const value = currentFilters[key as keyof FilterValues];
    if (key === 'sortBy' || key === 'sortOrder') return false;
    if (key === 'characterTraits') return Array.isArray(value) && value.length > 0;
    return value !== undefined && value !== '';
  }).length + (currentFilters.characterTraits?.length ? currentFilters.characterTraits.length - 1 : 0);

  const currentSort = currentFilters.sortBy && currentFilters.sortOrder 
    ? `${currentFilters.sortBy}_${currentFilters.sortOrder}` 
    : "createdAt_desc";

  const FilterContent = () => (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["price", "location", "animal", "traits"]} className="w-full">
        {/* Price Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Fiyat Aralığı
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {/* Price Presets */}
              <div className="flex flex-wrap gap-1.5">
                {pricePresets.map((preset) => {
                  const isSelected = !localFilters.minPrice && localFilters.maxPrice === String(preset.max);
                  return (
                    <Badge
                      key={preset.max}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setLocalFilters({ 
                        ...localFilters, 
                        minPrice: undefined,
                        maxPrice: isSelected ? undefined : String(preset.max)
                      })}
                      data-testid={`badge-price-preset-${preset.max}`}
                    >
                      {preset.label}
                    </Badge>
                  );
                })}
              </div>
              
              {/* Price Range Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{localFilters.minPrice ? `₺${Number(localFilters.minPrice).toLocaleString('tr-TR')}` : '₺0'}</span>
                  <span>{localFilters.maxPrice ? `₺${Number(localFilters.maxPrice).toLocaleString('tr-TR')}` : '₺1.000.000+'}</span>
                </div>
                <Slider
                  min={0}
                  max={1000000}
                  step={1000}
                  value={[
                    Number(localFilters.minPrice) || 0,
                    Number(localFilters.maxPrice) || 1000000
                  ]}
                  onValueChange={([min, max]) => {
                    setLocalFilters({
                      ...localFilters,
                      minPrice: min > 0 ? String(min) : undefined,
                      maxPrice: max < 1000000 ? String(max) : undefined,
                    });
                  }}
                  className="cursor-pointer"
                  data-testid="slider-price-range"
                />
              </div>

              {/* Manual Price Inputs */}
              <div className="grid grid-cols-2 gap-2">
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
            <div className="space-y-3 pt-2">
              {/* City Selection */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">İl</Label>
                <Select
                  value={localFilters.city || 'all'}
                  onValueChange={(value) => setLocalFilters({ 
                    ...localFilters, 
                    city: value === 'all' ? undefined : value,
                    district: undefined // Reset district when city changes
                  })}
                >
                  <SelectTrigger className="h-10 hover:bg-accent/50" data-testid="select-city">
                    <SelectValue placeholder="İl Seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Tüm İller</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Selection - Only shown when city is selected */}
              {localFilters.city && districts.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">İlçe</Label>
                  <Select
                    value={localFilters.district || 'all'}
                    onValueChange={(value) => setLocalFilters({ 
                      ...localFilters, 
                      district: value === 'all' ? undefined : value 
                    })}
                  >
                    <SelectTrigger className="h-10 hover:bg-accent/50" data-testid="select-district">
                      <SelectValue placeholder="İlçe Seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Tüm İlçeler</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.name}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                  <SelectTrigger className="h-10 hover:bg-accent/50" data-testid="select-gender">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Category */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Yaş Kategorisi</Label>
                <Select
                  value={localFilters.ageCategory || 'all'}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, ageCategory: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="h-10 hover:bg-accent/50" data-testid="select-age-category">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {AGE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectTrigger className="h-10 hover:bg-accent/50" data-testid="select-health-status">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {HEALTH_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="filter-vaccinated" className="text-xs cursor-pointer flex items-center gap-2">
                    <Syringe className="w-3.5 h-3.5" />
                    Aşılı
                  </Label>
                  <Switch
                    id="filter-vaccinated"
                    checked={localFilters.vaccinated === 'true'}
                    onCheckedChange={(checked) => setLocalFilters({ ...localFilters, vaccinated: checked ? 'true' : undefined })}
                    data-testid="switch-filter-vaccinated"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="filter-neutered" className="text-xs cursor-pointer flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5" />
                    Kısırlaştırılmış
                  </Label>
                  <Switch
                    id="filter-neutered"
                    checked={localFilters.neutered === 'true'}
                    onCheckedChange={(checked) => setLocalFilters({ ...localFilters, neutered: checked ? 'true' : undefined })}
                    data-testid="switch-filter-neutered"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="filter-pedigree" className="text-xs cursor-pointer flex items-center gap-2">
                    <Award className="w-3.5 h-3.5" />
                    Pedigree Belgeli
                  </Label>
                  <Switch
                    id="filter-pedigree"
                    checked={localFilters.pedigree === 'true'}
                    onCheckedChange={(checked) => setLocalFilters({ ...localFilters, pedigree: checked ? 'true' : undefined })}
                    data-testid="switch-filter-pedigree"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Character Traits */}
        <AccordionItem value="traits">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Karakter Özellikleri
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-2">
              {CHARACTER_TRAITS.map((trait) => {
                const isSelected = localFilters.characterTraits?.includes(trait.value);
                return (
                  <Badge
                    key={trait.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all px-2.5 py-1 text-xs ${isSelected ? "bg-primary" : ""}`}
                    onClick={() => {
                      const currentTraits = localFilters.characterTraits || [];
                      const newTraits = isSelected
                        ? currentTraits.filter(t => t !== trait.value)
                        : [...currentTraits, trait.value];
                      setLocalFilters({ ...localFilters, characterTraits: newTraits.length > 0 ? newTraits : undefined });
                    }}
                    data-testid={`badge-filter-trait-${trait.value}`}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {trait.label}
                  </Badge>
                );
              })}
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
            <SelectTrigger className="w-full sm:w-48 h-9 hover:bg-accent/50" data-testid="select-sort">
              <ArrowUpDown className="w-4 h-4 mr-2 shrink-0 pointer-events-none" />
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
              {currentFilters.city}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, city: undefined, district: undefined })}
              />
            </Badge>
          )}
          {currentFilters.district && (
            <Badge variant="secondary" className="text-xs gap-1">
              {currentFilters.district}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, district: undefined })}
              />
            </Badge>
          )}
          {currentFilters.gender && (
            <Badge variant="secondary" className="text-xs gap-1">
              {GENDER_OPTIONS.find(g => g.value === currentFilters.gender)?.label || currentFilters.gender}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, gender: undefined })}
              />
            </Badge>
          )}
          {currentFilters.ageCategory && (
            <Badge variant="secondary" className="text-xs gap-1">
              {AGE_CATEGORIES.find(a => a.value === currentFilters.ageCategory)?.label || currentFilters.ageCategory}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, ageCategory: undefined })}
              />
            </Badge>
          )}
          {currentFilters.healthStatus && (
            <Badge variant="secondary" className="text-xs gap-1">
              {HEALTH_STATUS_OPTIONS.find(h => h.value === currentFilters.healthStatus)?.label || currentFilters.healthStatus}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, healthStatus: undefined })}
              />
            </Badge>
          )}
          {currentFilters.vaccinated === 'true' && (
            <Badge variant="secondary" className="text-xs gap-1">
              Aşılı
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, vaccinated: undefined })}
              />
            </Badge>
          )}
          {currentFilters.neutered === 'true' && (
            <Badge variant="secondary" className="text-xs gap-1">
              Kısırlaştırılmış
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, neutered: undefined })}
              />
            </Badge>
          )}
          {currentFilters.pedigree === 'true' && (
            <Badge variant="secondary" className="text-xs gap-1">
              Pedigree
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...currentFilters, pedigree: undefined })}
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
          {currentFilters.characterTraits && currentFilters.characterTraits.length > 0 && (
            currentFilters.characterTraits.map(trait => (
              <Badge key={trait} variant="secondary" className="text-xs gap-1">
                {CHARACTER_TRAITS.find(t => t.value === trait)?.label || trait}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => {
                    const newTraits = currentFilters.characterTraits!.filter(t => t !== trait);
                    onFilterChange({ ...currentFilters, characterTraits: newTraits.length > 0 ? newTraits : undefined });
                  }}
                />
              </Badge>
            ))
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
