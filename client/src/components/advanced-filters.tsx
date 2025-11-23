import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import type { Location } from "@shared/schema";

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
}

export function AdvancedFilters({ onFilterChange, currentFilters }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(currentFilters);

  const { data: cities = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { type: "il" }],
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const handleApply = () => {
    onFilterChange(localFilters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterValues = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    key => currentFilters[key as keyof FilterValues] !== undefined && currentFilters[key as keyof FilterValues] !== ''
  ).length;

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Gelişmiş Filtreler
            {activeFilterCount > 0 && (
              <Badge variant="secondary" data-testid="badge-active-filters">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-toggle-filters">
            {isExpanded ? "Gizle" : "Göster"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Range */}
            <div className="space-y-2">
              <Label>Fiyat Aralığı (₺)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                  data-testid="input-min-price"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                  data-testid="input-max-price"
                />
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label>Yaş Aralığı (ay)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minAge || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, minAge: e.target.value })}
                  data-testid="input-min-age"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxAge || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxAge: e.target.value })}
                  data-testid="input-max-age"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>Şehir</Label>
              <Select
                value={localFilters.city || 'all'}
                onValueChange={(value) => setLocalFilters({ ...localFilters, city: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-city">
                  <SelectValue placeholder="Tüm Şehirler" />
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

            {/* Gender */}
            <div className="space-y-2">
              <Label>Cinsiyet</Label>
              <Select
                value={localFilters.gender || 'all'}
                onValueChange={(value) => setLocalFilters({ ...localFilters, gender: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Dişi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label>Irk</Label>
              <Input
                type="text"
                placeholder="Irk ara..."
                value={localFilters.breed || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, breed: e.target.value })}
                data-testid="input-breed"
              />
            </div>

            {/* Health Status */}
            <div className="space-y-2">
              <Label>Sağlık Durumu</Label>
              <Select
                value={localFilters.healthStatus || 'all'}
                onValueChange={(value) => setLocalFilters({ ...localFilters, healthStatus: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-health-status">
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
            <div className="space-y-2">
              <Label>Aşı Durumu</Label>
              <Select
                value={localFilters.vaccinated || 'all'}
                onValueChange={(value) => setLocalFilters({ ...localFilters, vaccinated: value === 'all' ? undefined : value })}
              >
                <SelectTrigger data-testid="select-vaccinated">
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

          <div className="flex gap-2 pt-4">
            <Button onClick={handleApply} className="flex-1" data-testid="button-apply-filters">
              <Filter className="w-4 h-4 mr-2" />
              Filtreleri Uygula
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-reset-filters">
              <X className="w-4 h-4 mr-2" />
              Temizle
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
