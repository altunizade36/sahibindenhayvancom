import { useState, useRef, useEffect } from "react";
import { Search, MapPin, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Location } from "@shared/schema";

interface SearchBarProps {
  onSearch?: (query: string, category?: string, location?: string) => void;
  categories?: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
}

export function SearchBar({ onSearch, categories = [] }: SearchBarProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [cityOpen, setCityOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: cities = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { type: "il" }],
    staleTime: 1000 * 60 * 60,
  });

  // Filter only main categories (parentId is null)
  const mainCategories = categories.filter(c => !c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch(query, category === "all" ? undefined : category, selectedCity || undefined);
    } else {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (category && category !== "all") params.set("categoryId", category);
      if (selectedCity) params.set("city", selectedCity);
      setLocation(`/ilanlar${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setCategory("all");
    setSelectedCity("");
    inputRef.current?.focus();
  };

  const selectedCityName = cities.find(c => c.slug === selectedCity)?.name;

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`w-full max-w-4xl mx-auto bg-background rounded-xl shadow-lg border transition-shadow ${isFocused ? 'ring-2 ring-primary/20' : ''}`}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center p-2 gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Ne aramak istersiniz? (köpek, kedi, kuş...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-11 pr-8 h-12 border-0 shadow-none focus-visible:ring-0 text-base"
            data-testid="input-search"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Category Select */}
        {mainCategories.length > 0 && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 h-12 border-0 shadow-none focus:ring-0 hover:bg-accent/50" data-testid="select-category">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {mainCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="h-8 w-px bg-border" />

        {/* City Select */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={cityOpen}
              className="w-40 h-12 justify-between font-normal cursor-pointer"
              data-testid="select-city"
            >
              <div className="flex items-center gap-2 truncate pointer-events-none">
                <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedCityName || "Tüm Türkiye"}</span>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-50 pointer-events-none" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <Command>
              <CommandInput placeholder="Şehir ara..." />
              <CommandList>
                <CommandEmpty>Şehir bulunamadı.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      setSelectedCity("");
                      setCityOpen(false);
                    }}
                  >
                    Tüm Türkiye
                  </CommandItem>
                  {cities.map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.name}
                      onSelect={() => {
                        setSelectedCity(city.slug);
                        setCityOpen(false);
                      }}
                    >
                      {city.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <Button type="submit" size="lg" className="h-12 px-6" data-testid="button-search">
          <Search className="w-5 h-5 mr-2" />
          Ara
        </Button>
      </div>

      {/* Mobile Layout - Optimized for sub-400px */}
      <div className="md:hidden p-2 min-[400px]:p-3 space-y-1.5 min-[400px]:space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Ne arıyorsunuz?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-9 pr-8 h-10 text-sm"
            data-testid="input-search-mobile"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setQuery("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Filters Row - side by side with constrained widths */}
        <div className="flex gap-1.5 min-[400px]:gap-2">
          {/* Category */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[calc(50%-3px)] h-9 text-xs min-[400px]:text-sm px-1.5 min-[400px]:px-2 hover:bg-accent/50" data-testid="select-category-mobile">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">Tümü</SelectItem>
              {mainCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City */}
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityOpen}
                className="w-[calc(50%-3px)] h-9 justify-between font-normal text-xs min-[400px]:text-sm px-1.5 min-[400px]:px-2 cursor-pointer"
                data-testid="select-city-mobile"
              >
                <div className="flex items-center gap-0.5 truncate flex-1 min-w-0 pointer-events-none">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{selectedCityName || "Şehir"}</span>
                </div>
                <ChevronDown className="w-3 h-3 shrink-0 opacity-50 ml-0.5 pointer-events-none" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start">
              <Command>
                <CommandInput placeholder="Şehir ara..." className="h-9 text-sm" />
                <CommandList className="max-h-48">
                  <CommandEmpty>Bulunamadı</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        setSelectedCity("");
                        setCityOpen(false);
                      }}
                      className="text-sm"
                    >
                      Tüm Türkiye
                    </CommandItem>
                    {cities.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={city.name}
                        onSelect={() => {
                          setSelectedCity(city.slug);
                          setCityOpen(false);
                        }}
                        className="text-sm"
                      >
                        {city.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Button */}
        <Button type="submit" className="w-full h-10" data-testid="button-search-mobile">
          <Search className="w-4 h-4 mr-2" />
          Ara
        </Button>
      </div>
    </form>
  );
}
