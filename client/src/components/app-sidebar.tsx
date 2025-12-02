import { Home, List, Search, ChevronRight, MapPin, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category, Location } from "@shared/schema";

// Main navigation items
const navItems = [
  { title: "Ana Sayfa", url: "/", icon: Home },
  { title: "İlanlar", url: "/ilanlar", icon: List },
];

interface CategoryStats {
  categoryId: string;
  count: number;
}

function CategoryTreeItem({ 
  category, 
  level = 0, 
  activeCategoryId,
  expandedIds,
  onToggle,
  categoryStats
}: { 
  category: Category & { children?: Category[] }; 
  level?: number; 
  activeCategoryId?: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  categoryStats: Map<string, number>;
}) {
  const [location, setLocation] = useLocation();
  
  const hasChildren = category.children && category.children.length > 0;
  const isActive = category.id === activeCategoryId;
  const isOpen = expandedIds.has(category.id);

  // Calculate total count for this category (including children)
  const getTotalCount = (cat: Category & { children?: Category[] }): number => {
    let total = categoryStats.get(cat.id) || 0;
    if (cat.children) {
      cat.children.forEach(child => {
        total += getTotalCount(child as Category & { children?: Category[] });
      });
    }
    return total;
  };
  
  const count = getTotalCount(category);

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams(location.split('?')[1] || '');
    params.set('categoryId', category.id);
    setLocation(`/ilanlar?${params.toString()}`);
  };

  if (!hasChildren) {
    if (level === 0) {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={handleNavigate}
            isActive={isActive}
            data-testid={`category-${category.slug}`}
            className="justify-between"
          >
            <span className="truncate" title={category.name}>{category.name}</span>
            <span className="text-xs text-muted-foreground ml-1">({count})</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }
    
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          onClick={handleNavigate}
          isActive={isActive}
          data-testid={`category-${category.slug}`}
          className="justify-between"
        >
          <span className="truncate" title={category.name}>{category.name}</span>
          <span className="text-xs text-muted-foreground ml-1">({count})</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  if (level === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          data-testid={`category-${category.slug}`}
          onClick={handleNavigate}
          className="justify-between pr-8"
        >
          <span className="truncate" title={category.name}>
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground">({count})</span>
        </SidebarMenuButton>
        <SidebarMenuAction
          data-testid={`toggle-${category.slug}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(category.id);
          }}
          className="transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <ChevronRight className="h-4 w-4" />
        </SidebarMenuAction>
        {isOpen && (
          <SidebarMenuSub>
            {category.children?.map((child) => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                level={level + 1}
                activeCategoryId={activeCategoryId}
                expandedIds={expandedIds}
                onToggle={onToggle}
                categoryStats={categoryStats}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={isActive}
        data-testid={`category-${category.slug}`}
        onClick={handleNavigate}
        className="justify-between pr-6"
      >
        <span className="truncate" title={category.name}>
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </SidebarMenuSubButton>
      <button
        data-testid={`toggle-${category.slug}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(category.id);
        }}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-transform duration-200"
        style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      {isOpen && (
        <SidebarMenuSub className="ml-2 border-l border-sidebar-border pl-2">
          {category.children?.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              activeCategoryId={activeCategoryId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              categoryStats={categoryStats}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  );
}

function LocationFilters() {
  const [location, navigate] = useLocation();
  
  // Parse current location filters from URL (uses city/district names)
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const urlCity = searchParams.get('city') || "";
  const urlDistrict = searchParams.get('district') || "";

  // Fetch provinces (il)
  const { data: provinces = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations', { type: 'il' }],
  });

  // Find selected city to get its ID for district query (match by name)
  const selectedCityData = provinces.find(p => p.name === urlCity);

  // Fetch districts (ilce) for selected province
  const { data: districts = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations', { type: 'ilce', parent: selectedCityData?.id }],
    enabled: !!selectedCityData?.id,
  });

  const handleCityChange = (cityName: string) => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    if (cityName && cityName !== 'all') {
      params.set('city', cityName);
    } else {
      params.delete('city');
    }
    // Reset district when city changes
    params.delete('district');
    navigate(`/ilanlar${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleDistrictChange = (districtName: string) => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    if (districtName && districtName !== 'all') {
      params.set('district', districtName);
    } else {
      params.delete('district');
    }
    navigate(`/ilanlar${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const clearLocation = () => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    params.delete('city');
    params.delete('district');
    navigate(`/ilanlar${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="space-y-2">
      <Select value={urlCity || "all"} onValueChange={handleCityChange}>
        <SelectTrigger data-testid="select-sidebar-city" className="w-full">
          <SelectValue placeholder="İl Seçin" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="all">Tüm İller</SelectItem>
          {provinces.map((prov) => (
            <SelectItem key={prov.id} value={prov.name} data-testid={`sidebar-il-${prov.slug}`}>
              {prov.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {urlCity && districts.length > 0 && (
        <Select value={urlDistrict || "all"} onValueChange={handleDistrictChange}>
          <SelectTrigger data-testid="select-sidebar-district" className="w-full">
            <SelectValue placeholder="İlçe Seçin" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Tüm İlçeler</SelectItem>
            {districts.map((dist) => (
              <SelectItem key={dist.id} value={dist.name} data-testid={`sidebar-ilce-${dist.slug}`}>
                {dist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(urlCity || urlDistrict) && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearLocation}
          className="w-full h-8 text-xs text-muted-foreground"
          data-testid="button-clear-location"
        >
          <X className="w-3 h-3 mr-1" />
          Konumu Temizle
        </Button>
      )}
    </div>
  );
}

// Helper to collect all ancestor IDs of active category
function getExpandedAncestors(categories: Category[], activeCategoryId?: string): Set<string> {
  const result = new Set<string>();
  
  function findPath(cats: Category[], targetId: string, path: string[]): boolean {
    for (const cat of cats) {
      const catWithChildren = cat as Category & { children?: Category[] };
      if (cat.id === targetId) {
        path.forEach(id => result.add(id));
        return true;
      }
      if (catWithChildren.children && catWithChildren.children.length > 0) {
        if (findPath(catWithChildren.children, targetId, [...path, cat.id])) {
          return true;
        }
      }
    }
    return false;
  }
  
  if (activeCategoryId) {
    findPath(categories, activeCategoryId, []);
  }
  
  return result;
}

export function AppSidebar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Extract categoryId from URL query params
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const activeCategoryId = searchParams.get('categoryId') || undefined;

  // Fetch category tree with retry and proper error handling
  const { data: categoryTree = [], isLoading: categoriesLoading, isError, isFetching, refetch } = useQuery<Category[]>({
    queryKey: ['/api/categories/tree'],
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 5, // More retries for important data
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000), // Up to 15 seconds
  });

  // Fetch category stats for listing counts
  const { data: categoryStatsData = [] } = useQuery<CategoryStats[]>({
    queryKey: ['/api/categories/stats'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Convert stats array to Map for O(1) lookup
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    categoryStatsData.forEach(stat => {
      map.set(stat.categoryId, stat.count);
    });
    return map;
  }, [categoryStatsData]);
  
  // Debug log only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Categories loaded:', categoryTree.length, 'Loading:', categoriesLoading, 'Fetching:', isFetching, 'Error:', isError);
  }

  // Auto-expand ancestors of active category
  useEffect(() => {
    if (activeCategoryId && categoryTree.length > 0) {
      const ancestors = getExpandedAncestors(categoryTree, activeCategoryId);
      setExpandedIds(prev => {
        const newSet = new Set(prev);
        ancestors.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [activeCategoryId, categoryTree]);

  const handleToggle = useCallback((categoryId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  return (
    <Sidebar collapsible="offcanvas" data-testid="app-sidebar">
      {/* Main Navigation - Always visible at top */}
      <SidebarHeader className="border-b">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={location.split('?')[0] === item.url}
                data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <SidebarGroup>
          <SidebarGroupLabel>Arama</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İlan ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Location Filters */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <MapPin className="h-4 w-4 inline mr-1" />
            Konum
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <LocationFilters />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Category Tree */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="flex items-center gap-2">
            Kategoriler 
            {categoriesLoading ? (
              <span className="text-xs text-muted-foreground animate-pulse">(Yükleniyor...)</span>
            ) : isError ? (
              <span className="text-xs text-destructive">(Hata!)</span>
            ) : isFetching ? (
              <span className="text-xs text-muted-foreground">(Güncelleniyor...)</span>
            ) : categoryTree.length > 0 ? (
              <span className="text-xs text-muted-foreground">({categoryTree.length})</span>
            ) : null}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="overflow-y-auto">
              {isError ? (
                <div className="p-2 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Kategoriler yüklenemedi</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-categories">
                    Tekrar Dene
                  </Button>
                </div>
              ) : categoriesLoading ? (
                <div className="p-2 space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <SidebarMenu>
                  {categoryTree.map((rootCategory) => (
                    <CategoryTreeItem
                      key={rootCategory.id}
                      category={rootCategory}
                      activeCategoryId={activeCategoryId}
                      expandedIds={expandedIds}
                      onToggle={handleToggle}
                      categoryStats={categoryStats}
                    />
                  ))}
                </SidebarMenu>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
