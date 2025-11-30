import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { Plus, User, LogOut, Settings, Heart, MessageSquare, Gavel, Radio, Menu, Bell, Search, X, Store, Shield, Building2 } from "lucide-react";
import { GiUnicorn } from "react-icons/gi";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { LanguageToggle } from "@/components/language-toggle";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notificationCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ilanlar?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16 gap-2">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={true}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <GiUnicorn className="w-6 h-6 text-primary" />
                    <span className="text-base">sahibinden<span className="text-primary">hayvan</span></span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigasyon menüsü
                  </SheetDescription>
                </SheetHeader>

                {/* User Info Section (if logged in) */}
                {isAuthenticated && user && (
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-lg">{user.firstName?.[0] || user.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Kullanıcı'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col p-2">
                  {/* Main Navigation */}
                  <div className="space-y-1">
                    <Link href="/ilanlar">
                      <Button variant={location === "/ilanlar" ? "secondary" : "ghost"} className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-listings">
                        <Search className="w-4 h-4 mr-3" />
                        İlanlar
                      </Button>
                    </Link>
                    <Link href="/acik-artirmalar">
                      <Button variant={location.startsWith("/acik-artirma") ? "secondary" : "ghost"} className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-auctions">
                        <Gavel className="w-4 h-4 mr-3" />
                        Açık Artırma
                      </Button>
                    </Link>
                    <Link href="/canli-yayinlar">
                      <Button variant={location.startsWith("/canli-yayin") ? "secondary" : "ghost"} className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-streams">
                        <Radio className="w-4 h-4 mr-3" />
                        Canlı Yayın
                      </Button>
                    </Link>
                    <Link href="/magazalar">
                      <Button variant={location.startsWith("/magaza") ? "secondary" : "ghost"} className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-stores">
                        <Store className="w-4 h-4 mr-3" />
                        Mağazalar
                      </Button>
                    </Link>
                    <Link href="/blog">
                      <Button variant={location === "/blog" ? "secondary" : "ghost"} className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-blog">
                        Blog
                      </Button>
                    </Link>
                  </div>

                  {isAuthenticated ? (
                    <>
                      {/* Quick Actions */}
                      <div className="border-t my-2 pt-2">
                        <Link href="/ilan-ver">
                          <Button className="w-full h-11" onClick={closeMobileMenu} data-testid="mobile-link-add-listing">
                            <Plus className="w-4 h-4 mr-2" />
                            Ücretsiz İlan Ver
                          </Button>
                        </Link>
                      </div>

                      {/* User Actions */}
                      <div className="border-t my-2 pt-2 space-y-1">
                        <Link href="/panel">
                          <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-dashboard">
                            <User className="w-4 h-4 mr-3" />
                            Panelim
                          </Button>
                        </Link>
                        <Link href="/favoriler">
                          <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-favorites">
                            <Heart className="w-4 h-4 mr-3" />
                            Favorilerim
                          </Button>
                        </Link>
                        <Link href="/mesajlar">
                          <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-messages">
                            <MessageSquare className="w-4 h-4 mr-3" />
                            Mesajlar
                          </Button>
                        </Link>
                        <Link href="/my-store">
                          <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-my-store">
                            <Building2 className="w-4 h-4 mr-3" />
                            Mağazam
                          </Button>
                        </Link>
                        <Link href="/bildirimler">
                          <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-notifications">
                            <Bell className="w-4 h-4 mr-3" />
                            Bildirimler
                            {notificationCount.count > 0 && (
                              <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                                {notificationCount.count > 9 ? "9+" : notificationCount.count}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                        <Link href="/ayarlar">
                          <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-settings">
                            <Settings className="w-4 h-4 mr-3" />
                            Ayarlar
                          </Button>
                        </Link>
                      </div>

                      {/* Admin Section */}
                      {isAdmin && (
                        <div className="border-t my-2 pt-2 space-y-1">
                          <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Admin</p>
                          <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start h-11" onClick={closeMobileMenu} data-testid="mobile-link-admin">
                              <Shield className="w-4 h-4 mr-3" />
                              Admin Paneli
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* Logout */}
                      <div className="border-t my-2 pt-2">
                        <Button variant="ghost" className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { logout(); closeMobileMenu(); }} data-testid="mobile-button-logout">
                          <LogOut className="w-4 h-4 mr-3" />
                          Çıkış Yap
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t my-2 pt-2 space-y-2">
                      <Link href="/giris">
                        <Button variant="outline" className="w-full h-11" onClick={closeMobileMenu} data-testid="mobile-button-login">
                          Giriş Yap
                        </Button>
                      </Link>
                      <Link href="/kayit">
                        <Button className="w-full h-11" onClick={closeMobileMenu} data-testid="mobile-button-register">
                          Ücretsiz Üye Ol
                        </Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-1.5 cursor-pointer" data-testid="link-home">
                <GiUnicorn className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-sm md:text-lg font-bold hidden sm:inline">
                  sahibinden<span className="text-primary">hayvan</span>
                </span>
                <span className="text-sm font-bold sm:hidden">
                  s<span className="text-primary">h</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link href="/ilanlar" className={`text-sm hover:text-primary transition-colors ${location === "/ilanlar" ? "text-primary font-medium" : ""}`} data-testid="link-listings">
              İlanlar
            </Link>
            <Link href="/acik-artirmalar" className={`flex items-center gap-1 text-sm hover:text-primary transition-colors ${location.startsWith("/acik-artirma") ? "text-primary font-medium" : ""}`} data-testid="link-auctions">
              <Gavel className="w-3.5 h-3.5" />
              Açık Artırma
            </Link>
            <Link href="/canli-yayinlar" className={`flex items-center gap-1 text-sm hover:text-primary transition-colors ${location.startsWith("/canli-yayin") ? "text-primary font-medium" : ""}`} data-testid="link-streams">
              <Radio className="w-3.5 h-3.5" />
              Canlı Yayın
            </Link>
            <Link href="/magazalar" className={`flex items-center gap-1 text-sm hover:text-primary transition-colors ${location.startsWith("/magaza") ? "text-primary font-medium" : ""}`} data-testid="link-stores">
              <Store className="w-3.5 h-3.5" />
              Mağazalar
            </Link>
            <Link href="/blog" className={`text-sm hover:text-primary transition-colors ${location === "/blog" ? "text-primary font-medium" : ""}`} data-testid="link-blog">
              Blog
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Mobile Search Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden shrink-0"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              data-testid="button-mobile-search"
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Hayvan ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 lg:w-56 pl-9 h-9"
                  data-testid="input-search"
                />
              </div>
            </form>

            {/* Mobile Quick Actions */}
            {isAuthenticated && (
              <>
                <Link href="/bildirimler" className="md:hidden">
                  <Button variant="ghost" size="icon" className="relative shrink-0" data-testid="button-mobile-notifications">
                    <Bell className="w-5 h-5" />
                    {notificationCount.count > 0 && (
                      <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        {notificationCount.count > 9 ? "9+" : notificationCount.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/ilan-ver" className="md:hidden">
                  <Button size="icon" className="shrink-0" data-testid="button-mobile-add-listing">
                    <Plus className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link href="/ilan-ver">
                    <Button size="sm" data-testid="button-add-listing">
                      <Plus className="w-4 h-4 mr-1.5" />
                      İlan Ver
                    </Button>
                  </Link>

                  <NotificationDropdown />
                  
                  <LanguageToggle />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl || undefined} />
                          <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-semibold">{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/panel">
                        <DropdownMenuItem className="cursor-pointer" data-testid="link-dashboard">
                          <User className="w-4 h-4 mr-2" />
                          Panelim
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/favoriler">
                        <DropdownMenuItem className="cursor-pointer" data-testid="link-favorites">
                          <Heart className="w-4 h-4 mr-2" />
                          Favorilerim
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/mesajlar">
                        <DropdownMenuItem className="cursor-pointer" data-testid="link-messages">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Mesajlar
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-store">
                        <DropdownMenuItem className="cursor-pointer" data-testid="link-my-store">
                          <Building2 className="w-4 h-4 mr-2" />
                          Mağazam
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/ayarlar">
                        <DropdownMenuItem className="cursor-pointer" data-testid="link-settings">
                          <Settings className="w-4 h-4 mr-2" />
                          Ayarlar
                        </DropdownMenuItem>
                      </Link>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <Link href="/admin">
                            <DropdownMenuItem className="cursor-pointer" data-testid="link-admin">
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Paneli
                            </DropdownMenuItem>
                          </Link>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive" data-testid="button-logout">
                        <LogOut className="w-4 h-4 mr-2" />
                        Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <LanguageToggle />
                  <Link href="/giris">
                    <Button variant="ghost" size="sm" data-testid="button-login">
                      Giriş
                    </Button>
                  </Link>
                  <Link href="/kayit">
                    <Button size="sm" data-testid="button-register">
                      Üye Ol
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Login/Register */}
            {!isAuthenticated && (
              <div className="flex md:hidden items-center gap-1.5">
                <Link href="/giris">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" data-testid="button-mobile-login">
                    Giriş
                  </Button>
                </Link>
                <Link href="/kayit">
                  <Button size="sm" className="h-8 px-2 text-xs" data-testid="button-mobile-register">
                    Üye Ol
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar (expandable) */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Hayvan, cins veya konum ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-10"
                  autoFocus
                  data-testid="input-mobile-search"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
