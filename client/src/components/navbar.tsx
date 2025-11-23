import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { PawPrint, Plus, User, LogOut, Settings, Heart, MessageSquare, Gavel, Radio } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <PawPrint className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">sahibinden<span className="text-primary">hayvan</span></span>
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

          <div className="flex items-center gap-3">
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
                        <AvatarImage src={user?.avatar || undefined} />
                        <AvatarFallback>{user?.fullName[0]}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user?.fullName}</span>
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
    </header>
  );
}
