import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Store, 
  FileCheck, 
  Flag, 
  BookOpen,
  Check, 
  X, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Eye,
  Shield,
  Settings,
  ChevronRight,
  Search,
  RefreshCw,
  UserCog,
  Ban,
  CheckCircle
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings?: number;
  pendingStores?: number;
  pendingReports?: number;
}

interface Listing {
  id: string;
  title: string;
  status: string;
  price: string;
  createdAt: string;
  seller?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

interface StoreData {
  id: string;
  name: string;
  status: string;
  storeType: string;
  city: string;
  createdAt: string;
  owner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporter?: {
    firstName: string;
    lastName: string;
  };
  listing?: {
    title: string;
  };
}

interface DocumentData {
  document: {
    id: string;
    documentType: string;
    status: string;
    documentUrl: string;
    createdAt: string;
  };
  listing: {
    id: string;
    title: string;
  };
  seller: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const menuItems = [
  { id: "dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { id: "listings", label: "İlan Yönetimi", icon: FileText },
  { id: "users", label: "Kullanıcılar", icon: Users },
  { id: "stores", label: "Mağazalar", icon: Store },
  { id: "documents", label: "Belge Doğrulama", icon: FileCheck },
  { id: "verifications", label: "Mesleki Doğrulama", icon: Shield, href: "/admin/dogrulamalar" },
  { id: "reports", label: "Şikayetler", icon: Flag },
  { id: "blog", label: "Blog Yönetimi", icon: BookOpen },
];

const documentTypeNames: Record<string, string> = {
  'microchip': 'Mikroçip Belgesi',
  'passport': 'Hayvan Pasaportu',
  'vaccination': 'Aşı Kartı',
  'health_certificate': 'Sağlık Raporu',
  'pedigree': 'Soy Belgesi',
  'cites': 'CITES Belgesi',
  'dkmp_permit': 'DKMP İzin Belgesi',
  'turkvet': 'TÜRKVET Kaydı',
  'ear_tag': 'Kulak Küpesi',
  'transport': 'Nakil Belgesi',
  'breeding_permit': 'Yetiştiricilik Belgesi',
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-6 w-6" />
              Erişim Engellendi
            </CardTitle>
            <CardDescription>
              Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece admin kullanıcıları erişebilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: listings = [], isLoading: listingsLoading, refetch: refetchListings } = useQuery<Listing[]>({
    queryKey: ["/api/admin/listings"],
  });

  const { data: usersData = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users",
  });

  const { data: storesData = [], refetch: refetchStores } = useQuery<StoreData[]>({
    queryKey: ["/api/admin/stores"],
    enabled: activeTab === "stores",
  });

  const { data: reportsData = [], refetch: refetchReports } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
    enabled: activeTab === "reports",
  });

  const { data: documentsData = [], refetch: refetchDocuments } = useQuery<DocumentData[]>({
    queryKey: ["/api/admin/listing-documents"],
    enabled: activeTab === "documents",
  });

  // Mutations
  const updateListingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/listings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "İlan durumu güncellendi" });
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı rolü güncellendi" });
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/stores/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      toast({ title: "Mağaza durumu güncellendi" });
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/reports/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Şikayet durumu güncellendi" });
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      return apiRequest("PATCH", `/api/admin/listing-documents/${id}`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listing-documents"] });
      toast({ title: "Belge durumu güncellendi" });
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const pendingListings = listings.filter(l => l.status === 'pending');
  const activeListings = listings.filter(l => l.status === 'active');
  const rejectedListings = listings.filter(l => l.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'verified':
      case 'resolved':
        return <Badge className="bg-green-500">{status === 'active' ? 'Aktif' : status === 'approved' ? 'Onaylı' : status === 'verified' ? 'Doğrulandı' : 'Çözüldü'}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Beklemede</Badge>;
      case 'rejected':
      case 'dismissed':
        return <Badge variant="destructive">{status === 'rejected' ? 'Reddedildi' : 'Reddedildi'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin-dashboard">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r bg-card hidden md:block">
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Admin Panel
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => (item as any).href ? navigate((item as any).href) : setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.id === 'listings' && pendingListings.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">{pendingListings.length}</Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-3 right-3">
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Siteye Dön
            </Button>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
          <div className="flex justify-around p-2">
            {menuItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <item.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Genel Bakış</h1>
                  <p className="text-muted-foreground">Platform istatistikleri ve hızlı işlemler</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchStats()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-users">
                      {stats?.totalUsers || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam İlan</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-listings">
                      {stats?.totalListings || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aktif İlan</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-active-listings">
                      {stats?.activeListings || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/50">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bekleyen İlan</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-listings">
                      {pendingListings.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      Onay Bekleyen İlanlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingListings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Bekleyen ilan yok</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingListings.slice(0, 5).map((listing) => (
                          <div key={listing.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{listing.title}</p>
                              <p className="text-sm text-muted-foreground">{listing.price} TL</p>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateListingMutation.mutate({ id: listing.id, status: "active" })}
                                disabled={updateListingMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateListingMutation.mutate({ id: listing.id, status: "rejected" })}
                                disabled={updateListingMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {pendingListings.length > 5 && (
                          <Button variant="ghost" className="w-full" onClick={() => setActiveTab("listings")}>
                            Tümünü Gör ({pendingListings.length} ilan)
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Son Şikayetler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportsData.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Şikayet yok</p>
                    ) : (
                      <div className="space-y-3">
                        {reportsData.filter(r => r.status === 'pending').slice(0, 5).map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{report.reason}</p>
                              <p className="text-sm text-muted-foreground truncate">{report.description}</p>
                            </div>
                            {getStatusBadge(report.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı Erişim</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("listings")}>
                      <FileText className="h-6 w-6" />
                      <span>İlanlar</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("users")}>
                      <Users className="h-6 w-6" />
                      <span>Kullanıcılar</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("stores")}>
                      <Store className="h-6 w-6" />
                      <span>Mağazalar</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                      <Link href="/admin/blog">
                        <BookOpen className="h-6 w-6" />
                        <span>Blog</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === "listings" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">İlan Yönetimi</h1>
                  <p className="text-muted-foreground">Tüm ilanları yönetin ve moderasyon yapın</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="İlan ara..." 
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => refetchListings()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending" className="gap-2">
                    Bekleyen
                    {pendingListings.length > 0 && <Badge variant="destructive">{pendingListings.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="active">Aktif ({activeListings.length})</TabsTrigger>
                  <TabsTrigger value="rejected">Reddedilen ({rejectedListings.length})</TabsTrigger>
                  <TabsTrigger value="all">Tümü ({listings.length})</TabsTrigger>
                </TabsList>

                {['pending', 'active', 'rejected', 'all'].map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <Card>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {(tab === 'all' ? listings : listings.filter(l => l.status === tab))
                            .filter(l => !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((listing) => (
                            <div key={listing.id} className="flex items-center justify-between p-4 hover:bg-accent/50">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium truncate">{listing.title}</h3>
                                  {getStatusBadge(listing.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {listing.price} TL • {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/ilan/${listing.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                {listing.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => updateListingMutation.mutate({ id: listing.id, status: "active" })}
                                      disabled={updateListingMutation.isPending}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Onayla
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updateListingMutation.mutate({ id: listing.id, status: "rejected" })}
                                      disabled={updateListingMutation.isPending}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reddet
                                    </Button>
                                  </>
                                )}
                                {listing.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateListingMutation.mutate({ id: listing.id, status: "rejected" })}
                                    disabled={updateListingMutation.isPending}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Kaldır
                                  </Button>
                                )}
                                {listing.status === 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateListingMutation.mutate({ id: listing.id, status: "active" })}
                                    disabled={updateListingMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aktifleştir
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Kullanıcı Yönetimi</h1>
                  <p className="text-muted-foreground">Tüm kullanıcıları görüntüleyin ve yönetin</p>
                </div>
                <Button variant="outline" onClick={() => refetchUsers()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Kullanıcı</th>
                          <th className="text-left p-4 font-medium">İletişim</th>
                          <th className="text-left p-4 font-medium">Rol</th>
                          <th className="text-left p-4 font-medium">Durum</th>
                          <th className="text-left p-4 font-medium">Kayıt Tarihi</th>
                          <th className="text-left p-4 font-medium">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {usersData.map((userData) => (
                          <tr key={userData.id} className="hover:bg-accent/50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{userData.firstName} {userData.lastName}</p>
                                <p className="text-sm text-muted-foreground">{userData.id.slice(0, 8)}...</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="text-sm">{userData.email || '-'}</p>
                                <p className="text-sm text-muted-foreground">{userData.phone || '-'}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Select
                                value={userData.role}
                                onValueChange={(value) => updateUserRoleMutation.mutate({ id: userData.id, role: value })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="buyer">Alıcı</SelectItem>
                                  <SelectItem value="seller">Satıcı</SelectItem>
                                  <SelectItem value="vet">Veteriner</SelectItem>
                                  <SelectItem value="transporter">Nakliyeci</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                {userData.emailVerified && <Badge variant="outline" className="text-xs">Email ✓</Badge>}
                                {userData.phoneVerified && <Badge variant="outline" className="text-xs">Tel ✓</Badge>}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(userData.createdAt).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="p-4">
                              <Button size="sm" variant="ghost">
                                <UserCog className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stores Tab */}
          {activeTab === "stores" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Mağaza Yönetimi</h1>
                  <p className="text-muted-foreground">Mağaza başvurularını inceleyin ve onaylayın</p>
                </div>
                <Button variant="outline" onClick={() => refetchStores()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {storesData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Henüz mağaza başvurusu yok</p>
                  ) : (
                    <div className="divide-y">
                      {storesData.map((store) => (
                        <div key={store.id} className="flex items-center justify-between p-4 hover:bg-accent/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{store.name}</h3>
                              {getStatusBadge(store.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {store.storeType} • {store.city} • {new Date(store.createdAt).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {store.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateStoreMutation.mutate({ id: store.id, status: "approved" })}
                                  disabled={updateStoreMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateStoreMutation.mutate({ id: store.id, status: "rejected" })}
                                  disabled={updateStoreMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reddet
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Belge Doğrulama</h1>
                  <p className="text-muted-foreground">Yasal belgeleri inceleyin ve doğrulayın</p>
                </div>
                <Button variant="outline" onClick={() => refetchDocuments()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {documentsData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Doğrulama bekleyen belge yok</p>
                  ) : (
                    <div className="divide-y">
                      {documentsData.map((doc) => (
                        <div key={doc.document.id} className="flex items-center justify-between p-4 hover:bg-accent/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {documentTypeNames[doc.document.documentType] || doc.document.documentType}
                              </h3>
                              {getStatusBadge(doc.document.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              İlan: {doc.listing?.title || 'Bilinmiyor'} • 
                              Satıcı: {doc.seller?.firstName} {doc.seller?.lastName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={doc.document.documentUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                Görüntüle
                              </a>
                            </Button>
                            {doc.document.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateDocumentMutation.mutate({ id: doc.document.id, status: "verified" })}
                                  disabled={updateDocumentMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateDocumentMutation.mutate({ id: doc.document.id, status: "rejected", rejectionReason: "Belge geçersiz veya eksik" })}
                                  disabled={updateDocumentMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reddet
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Şikayet Yönetimi</h1>
                  <p className="text-muted-foreground">Kullanıcı şikayetlerini inceleyin ve çözümleyin</p>
                </div>
                <Button variant="outline" onClick={() => refetchReports()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {reportsData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Henüz şikayet yok</p>
                  ) : (
                    <div className="divide-y">
                      {reportsData.map((report) => (
                        <div key={report.id} className="p-4 hover:bg-accent/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{report.reason}</h3>
                                {getStatusBadge(report.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                              <p className="text-xs text-muted-foreground">
                                İlan: {report.listing?.title || 'Bilinmiyor'} • 
                                Şikayet eden: {report.reporter?.firstName} {report.reporter?.lastName} • 
                                {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                              </p>
                            </div>
                            {report.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => updateReportMutation.mutate({ id: report.id, status: "resolved" })}
                                  disabled={updateReportMutation.isPending}
                                >
                                  Çözüldü
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReportMutation.mutate({ id: report.id, status: "dismissed" })}
                                  disabled={updateReportMutation.isPending}
                                >
                                  Reddet
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blog Tab */}
          {activeTab === "blog" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Blog Yönetimi</h1>
                  <p className="text-muted-foreground">Blog yazılarını düzenleyin</p>
                </div>
              </div>

              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Blog yönetimi için ayrı sayfayı kullanın</p>
                  <Button asChild>
                    <Link href="/admin/blog">
                      Blog Yönetimine Git
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
