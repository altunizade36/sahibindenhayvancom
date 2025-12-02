import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  Users,
  Store,
  FileCheck,
  Flag,
  BookOpen,
  Settings,
  FolderTree,
  Bell,
  Activity,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Home,
  MessageSquare,
  BarChart3,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  pendingStores: number;
  pendingReports: number;
  pendingDocuments: number;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "secondary";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Erişim Engellendi</h1>
          <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Button asChild>
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
        </div>
      </div>
    );
  }

  const navGroups: NavGroup[] = [
    {
      title: "Genel",
      items: [
        { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { id: "analytics", label: "Analitik", href: "/admin/analitik", icon: BarChart3 },
      ],
    },
    {
      title: "İçerik Yönetimi",
      items: [
        { 
          id: "listings", 
          label: "İlanlar", 
          href: "/admin/ilanlar", 
          icon: FileText,
          badge: stats?.pendingListings,
          badgeVariant: stats?.pendingListings ? "destructive" : undefined,
        },
        { 
          id: "stores", 
          label: "Mağazalar", 
          href: "/admin/magazalar", 
          icon: Store,
          badge: stats?.pendingStores,
          badgeVariant: stats?.pendingStores ? "destructive" : undefined,
        },
        { id: "categories", label: "Kategoriler", href: "/admin/kategoriler", icon: FolderTree },
        { id: "blog", label: "Blog", href: "/admin/blog", icon: BookOpen },
      ],
    },
    {
      title: "Kullanıcılar",
      items: [
        { id: "users", label: "Kullanıcılar", href: "/admin/kullanicilar", icon: Users },
        { id: "messages", label: "Mesajlar", href: "/admin/mesajlar", icon: MessageSquare },
      ],
    },
    {
      title: "Moderasyon",
      items: [
        { 
          id: "reports", 
          label: "Şikayetler", 
          href: "/admin/sikayetler", 
          icon: Flag,
          badge: stats?.pendingReports,
          badgeVariant: stats?.pendingReports ? "destructive" : undefined,
        },
        { 
          id: "documents", 
          label: "Belgeler", 
          href: "/admin/belgeler", 
          icon: FileCheck,
          badge: stats?.pendingDocuments,
          badgeVariant: stats?.pendingDocuments ? "secondary" : undefined,
        },
      ],
    },
    {
      title: "Sistem",
      items: [
        { id: "notifications", label: "Bildirimler", href: "/admin/bildirimler", icon: Bell },
        { id: "logs", label: "Aktivite Logları", href: "/admin/loglar", icon: Activity },
        { id: "settings", label: "Ayarlar", href: "/admin/ayarlar", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">sahibindenhayvan.com</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <a
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`nav-admin-${item.id}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant={item.badgeVariant || "secondary"} className="h-5 min-w-[20px] flex items-center justify-center">
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Siteye Dön
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="admin-layout">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-bold">Admin Panel</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>

      <div className="lg:pl-64">
        <header className="hidden lg:flex items-center justify-between border-b bg-card px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleDateString("tr-TR", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(stats?.pendingListings || 0) + (stats?.pendingReports || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">
                  {(stats?.pendingListings || 0) + (stats?.pendingReports || 0)} bekleyen işlem
                </span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/panel/ayarlar">
                    <Settings className="h-4 w-4 mr-2" />
                    Profil Ayarları
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
