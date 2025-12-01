import { Home, List, MessageSquare, Calendar, Heart, Settings, Search, ChevronDown, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { Category, Location } from "@shared/schema";

// Main navigation items
const navItems = [
  { title: "Ana Sayfa", url: "/", icon: Home },
  { title: "İlanlar", url: "/ilanlar", icon: List },
];

function hasActiveDescendant(category: Category & { children?: Category[] }, activeCategoryId?: string): boolean {
  if (category.id === activeCategoryId) return true;
  if (!category.children) return false;
  return category.children.some(child => hasActiveDescendant(child, activeCategoryId));
}

function CategoryTreeItem({ category, level = 0, activeCategoryId }: { category: Category & { children?: Category[] }; level?: number; activeCategoryId?: string }) {
  const [location, setLocation] = useLocation();
  
  const hasChildren = category.children && category.children.length > 0;
  const isActive = category.id === activeCategoryId;
  const shouldBeOpen = hasActiveDescendant(category, activeCategoryId);
  const [isOpen, setIsOpen] = useState(shouldBeOpen);
  const userInteracted = useRef(false);
  const prevShouldBeOpen = useRef(shouldBeOpen);

  useEffect(() => {
    if (shouldBeOpen && !prevShouldBeOpen.current) {
      setIsOpen(true);
      userInteracted.current = false;
    }
    prevShouldBeOpen.current = shouldBeOpen;
  }, [shouldBeOpen]);

  const handleToggle = () => {
    userInteracted.current = true;
    setIsOpen(prev => !prev);
  };

  const handleNavigate = () => {
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
            className="overflow-hidden"
            data-testid={`category-${category.slug}`}
          >
            <span className="truncate" title={category.name}>{category.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }
    
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          onClick={handleNavigate}
          isActive={isActive}
          className="overflow-hidden"
          data-testid={`category-${category.slug}`}
        >
          <span className="truncate" title={category.name}>{category.name}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  if (level === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleNavigate}
          isActive={isActive}
          data-testid={`category-${category.slug}`}
        >
          <span className="truncate" title={category.name}>{category.name}</span>
        </SidebarMenuButton>
        <SidebarMenuAction
          onClick={handleToggle}
          data-testid={`toggle-${category.slug}`}
          aria-label={isOpen ? "Alt kategorileri gizle" : "Alt kategorileri göster"}
          aria-expanded={isOpen}
          className="text-sidebar-foreground"
        >
          <ChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </SidebarMenuAction>
        {isOpen && (
          <SidebarMenuSub>
            {category.children?.map((child) => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                level={level + 1}
                activeCategoryId={activeCategoryId}
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
        onClick={handleNavigate}
        isActive={isActive}
        data-testid={`category-${category.slug}`}
        className="pr-8"
      >
        <span className="truncate" title={category.name}>{category.name}</span>
      </SidebarMenuSubButton>
      <button
        type="button"
        onClick={handleToggle}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
        data-testid={`toggle-${category.slug}`}
        aria-label={isOpen ? "Alt kategorileri gizle" : "Alt kategorileri göster"}
        aria-expanded={isOpen}
      >
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <SidebarMenuSub className="pl-2 ml-2 border-l border-sidebar-border">
          {category.children?.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              activeCategoryId={activeCategoryId}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  );
}

function LocationFilters() {
  const [selectedIl, setSelectedIl] = useState<string | null>(null);
  const [selectedIlce, setSelectedIlce] = useState<string | null>(null);
  const [selectedMahalle, setSelectedMahalle] = useState<string | null>(null);
  const [location, navigate] = useLocation();

  // Fetch provinces (il)
  const { data: provinces = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations?type=il'],
  });

  // Fetch districts (ilce) for selected province
  const { data: districts = [] } = useQuery<Location[]>({
    queryKey: [`/api/locations?type=ilce&parent=${selectedIl}`],
    enabled: !!selectedIl,
  });

  // Fetch neighborhoods (mahalle) for selected district
  const { data: neighborhoods = [] } = useQuery<Location[]>({
    queryKey: [`/api/locations?type=mahalle&parent=${selectedIlce}`],
    enabled: !!selectedIlce,
  });

  // Fetch villages (köy) for selected neighborhood
  const { data: villages = [] } = useQuery<Location[]>({
    queryKey: [`/api/locations?type=koy&parent=${selectedMahalle}`],
    enabled: !!selectedMahalle,
  });

  const handleLocationChange = (locationId: string, level: 'il' | 'ilce' | 'mahalle' | 'koy') => {
    // Merge with existing query params
    const params = new URLSearchParams(location.split('?')[1] || '');
    params.set('konum', locationId);
    
    if (level === 'il') {
      setSelectedIl(locationId);
      setSelectedIlce(null);
      setSelectedMahalle(null);
    } else if (level === 'ilce') {
      setSelectedIlce(locationId);
      setSelectedMahalle(null);
    } else if (level === 'mahalle') {
      setSelectedMahalle(locationId);
    }
    
    navigate(`/ilanlar?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <Select value={selectedIl || ""} onValueChange={(val) => handleLocationChange(val, 'il')}>
        <SelectTrigger data-testid="select-il" className="w-full">
          <SelectValue placeholder="İl Seçin" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {provinces.map((prov) => (
            <SelectItem key={prov.id} value={prov.id} data-testid={`il-${prov.slug}`}>
              {prov.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedIl && districts.length > 0 && (
        <Select value={selectedIlce || ""} onValueChange={(val) => handleLocationChange(val, 'ilce')}>
          <SelectTrigger data-testid="select-ilce" className="w-full">
            <SelectValue placeholder="İlçe Seçin" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {districts.map((dist) => (
              <SelectItem key={dist.id} value={dist.id} data-testid={`ilce-${dist.slug}`}>
                {dist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedIlce && neighborhoods.length > 0 && (
        <Select value={selectedMahalle || ""} onValueChange={(val) => handleLocationChange(val, 'mahalle')}>
          <SelectTrigger data-testid="select-mahalle" className="w-full">
            <SelectValue placeholder="Mahalle Seçin" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {neighborhoods.map((neigh) => (
              <SelectItem key={neigh.id} value={neigh.id} data-testid={`mahalle-${neigh.slug}`}>
                {neigh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedMahalle && villages.length > 0 && (
        <Select onValueChange={(val) => handleLocationChange(val, 'koy')}>
          <SelectTrigger data-testid="select-koy" className="w-full">
            <SelectValue placeholder="Köy Seçin" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id} data-testid={`koy-${village.slug}`}>
                {village.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Extract categoryId from URL query params
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const activeCategoryId = searchParams.get('categoryId') || undefined;

  // Fetch category tree
  const { data: categoryTree = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories/tree'],
  });

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
          <SidebarGroupLabel>Kategoriler</SidebarGroupLabel>
          <SidebarGroupContent className="flex-1">
            <ScrollArea className="h-full">
              <SidebarMenu>
                {categoryTree.map((rootCategory) => (
                  <CategoryTreeItem
                    key={rootCategory.id}
                    category={rootCategory}
                    activeCategoryId={activeCategoryId}
                  />
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
