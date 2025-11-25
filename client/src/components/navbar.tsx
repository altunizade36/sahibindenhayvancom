import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Sparkles, Plus, User, LogOut, Settings, Heart, MessageSquare, Gavel, Radio, Menu } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <div className="relative">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <Sparkles className="w-2 h-2 md:w-3 md:h-3 text-yellow-400 absolute -top-0.5 -right-0.5 animate-pulse" />
              </div>
              <span className="text-lg md:text-xl font-bold">sahibinden<span className="text-primary">hayvan</span></span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/ilanlar" className={`hover:text-primary transition-colors ${location === "/ilanlar" ? "text-primary" : ""}`} data-testid="link-listings">
              İlanlar
            </Link>
            <Link href="/acik-artirmalar" className={`flex items-center gap-1 hover:text-primary transition-colors ${location.startsWith("/acik-artirma") ? "text-primary" : ""}`} data-testid="link-auctions">
              <Gavel className="w-4 h-4" />
              Açık Artırma
            </Link>
            <Link href="/canli-yayinlar" className={`flex items-center gap-1 hover:text-primary transition-colors ${location.startsWith("/canli-yayin") || location.startsWith("/yayin-baslat") ? "text-primary" : ""}`} data-testid="link-streams">
              <Radio className="w-4 h-4" />
              Canlı Yayın
            </Link>
            <Link href="/blog" className={`hover:text-primary transition-colors ${location === "/blog" ? "text-primary" : ""}`} data-testid="link-blog">
              Blog
            </Link>
            <Link href="/hizmetler" className={`hover:text-primary transition-colors ${location === "/hizmetler" ? "text-primary" : ""}`} data-testid="link-services">
              Hizmetler
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={true}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="relative">
                      <Sparkles className="w-6 h-6 text-primary" />
                      <Sparkles className="w-2 h-2 text-yellow-400 absolute -top-0.5 -right-0.5 animate-pulse" />
                    </div>
                    sahibinden<span className="text-primary">hayvan</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigasyon menüsü
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/ilanlar">
                    <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-listings">
                      İlanlar
                    </Button>
                  </Link>
                  <Link href="/acik-artirmalar">
                    <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-auctions">
                      <Gavel className="w-5 h-5 mr-2" />
                      Açık Artırma
                    </Button>
                  </Link>
                  <Link href="/canli-yayinlar">
                    <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-streams">
                      <Radio className="w-5 h-5 mr-2" />
                      Canlı Yayın
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-blog">
                      Blog
                    </Button>
                  </Link>
                  <Link href="/hizmetler">
                    <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-services">
                      Hizmetler
                    </Button>
                  </Link>

                  {isAuthenticated ? (
                    <>
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <Link href="/ilan-ver">
                          <Button className="w-full text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-add-listing">
                            <Plus className="w-5 h-5 mr-2" />
                            İlan Ver
                          </Button>
                        </Link>
                        <Link href="/panel">
                          <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-dashboard">
                            <User className="w-5 h-5 mr-2" />
                            Panelim
                          </Button>
                        </Link>
                        <Link href="/favoriler">
                          <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-favorites">
                            <Heart className="w-5 h-5 mr-2" />
                            Favorilerim
                          </Button>
                        </Link>
                        <Link href="/mesajlar">
                          <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-messages">
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Mesajlar
                          </Button>
                        </Link>
                        <Link href="/ayarlar">
                          <Button variant="ghost" className="w-full justify-start text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-link-settings">
                            <Settings className="w-5 h-5 mr-2" />
                            Ayarlar
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start text-lg h-12 text-destructive" onClick={() => { logout(); closeMobileMenu(); }} data-testid="mobile-button-logout">
                          <LogOut className="w-5 h-5 mr-2" />
                          Çıkış Yap
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-4 mt-4 space-y-3">
                      <Link href="/giris">
                        <Button variant="outline" className="w-full text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-button-login">
                          Giriş Yap
                        </Button>
                      </Link>
                      <Link href="/kayit">
                        <Button className="w-full text-lg h-12" onClick={closeMobileMenu} data-testid="mobile-button-register">
                          Üye Ol
                        </Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/ilan-ver">
                    <Button data-testid="button-add-listing">
                      <Plus className="w-4 h-4 mr-2" />
                      İlan Ver
                    </Button>
                  </Link>

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
                      <Link href="/ayarlar">
                        <DropdownMenuItem className="cursor-pointer" data-testid="link-settings">
                          <Settings className="w-4 h-4 mr-2" />
                          Ayarlar
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="cursor-pointer" data-testid="button-logout">
                        <LogOut className="w-4 h-4 mr-2" />
                        Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/giris">
                    <Button variant="ghost" data-testid="button-login">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/kayit">
                    <Button data-testid="button-register">
                      Üye Ol
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
