import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { DataTable, Column } from "@/components/admin/data-table";
import { DetailDrawer, DetailField, DetailGrid, DetailTimeline } from "@/components/admin/detail-drawer";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  FileText,
  Store,
  MessageSquare,
  Heart,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: string;
  status?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  listingCount?: number;
  storeId?: string;
}

interface UserStats {
  total: number;
  verified: number;
  unverified: number;
  banned: number;
  admins: number;
  sellers: number;
  todayNew: number;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [banUser, setBanUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const stats: UserStats = {
    total: users.length,
    verified: users.filter((u) => u.emailVerified || u.phoneVerified).length,
    unverified: users.filter((u) => !u.emailVerified && !u.phoneVerified).length,
    banned: users.filter((u) => u.status === "banned").length,
    admins: users.filter((u) => u.role === "admin").length,
    sellers: users.filter((u) => u.role === "seller").length,
    todayNew: users.filter((u) => {
      const today = new Date();
      const created = new Date(u.createdAt);
      return created.toDateString() === today.toDateString();
    }).length,
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı rolü güncellendi" });
      setRoleChangeUser(null);
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı durumu güncellendi" });
      setBanUser(null);
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter((user) => {
    if (statusFilter === "verified") return user.emailVerified || user.phoneVerified;
    if (statusFilter === "unverified") return !user.emailVerified && !user.phoneVerified;
    if (statusFilter === "banned") return user.status === "banned";
    if (statusFilter === "admin") return user.role === "admin";
    if (statusFilter === "seller") return user.role === "seller";
    return true;
  });

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "Kullanıcı",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImageUrl} />
            <AvatarFallback>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (user) => (
        <Badge
          variant={
            user.role === "admin"
              ? "default"
              : user.role === "seller"
              ? "secondary"
              : "outline"
          }
        >
          {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
          {user.role === "admin"
            ? "Admin"
            : user.role === "seller"
            ? "Satıcı"
            : "Kullanıcı"}
        </Badge>
      ),
    },
    {
      key: "verification",
      header: "Doğrulama",
      cell: (user) => (
        <div className="flex gap-1">
          {user.emailVerified ? (
            <Badge variant="default" className="bg-green-500 gap-1">
              <Mail className="h-3 w-3" />
              Email
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
            </Badge>
          )}
          {user.phoneVerified ? (
            <Badge variant="default" className="bg-green-500 gap-1">
              <Phone className="h-3 w-3" />
              Tel
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (user) => {
        if (user.status === "banned") {
          return (
            <Badge variant="destructive" className="gap-1">
              <Ban className="h-3 w-3" />
              Yasaklı
            </Badge>
          );
        }
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Aktif
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Kayıt Tarihi",
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(user.createdAt), "dd MMM yyyy", { locale: tr })}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-users">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm kullanıcıları görüntüleyin ve yönetin
          </p>
        </div>

        <StatCardGrid columns={6}>
          <StatCard
            title="Toplam"
            value={stats.total}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Doğrulanmış"
            value={stats.verified}
            icon={<UserCheck className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Doğrulanmamış"
            value={stats.unverified}
            icon={<UserX className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            title="Yasaklı"
            value={stats.banned}
            icon={<Ban className="h-4 w-4" />}
            variant="danger"
          />
          <StatCard
            title="Admin"
            value={stats.admins}
            icon={<Shield className="h-4 w-4" />}
          />
          <StatCard
            title="Bugün Kayıt"
            value={stats.todayNew}
            icon={<Calendar className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Kullanıcılar</CardTitle>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="verified">Doğrulanmış</TabsTrigger>
                  <TabsTrigger value="unverified">Doğrulanmamış</TabsTrigger>
                  <TabsTrigger value="banned">Yasaklı</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredUsers}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Kullanıcı ara..."
              searchKey="email"
              onRefresh={refetch}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getItemId={(u) => u.id}
              actions={[
                {
                  label: "Detay",
                  icon: <Eye className="h-4 w-4" />,
                  onClick: (user) => setSelectedUser(user),
                },
                {
                  label: "Rol Değiştir",
                  icon: <Shield className="h-4 w-4" />,
                  onClick: (user) => setRoleChangeUser(user),
                },
                {
                  label: user.status === "banned" ? "Yasağı Kaldır" : "Yasakla",
                  icon: <Ban className="h-4 w-4" />,
                  onClick: (user) => setBanUser(user),
                  variant: user.status === "banned" ? "default" : "destructive",
                },
              ]}
              emptyMessage="Kullanıcı bulunamadı"
            />
          </CardContent>
        </Card>
      </div>

      <DetailDrawer
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`${selectedUser?.firstName} ${selectedUser?.lastName}`}
        subtitle={selectedUser?.email}
        badge={
          selectedUser?.role === "admin"
            ? { label: "Admin", variant: "default" }
            : selectedUser?.role === "seller"
            ? { label: "Satıcı", variant: "secondary" }
            : { label: "Kullanıcı", variant: "outline" }
        }
        width="wide"
        tabs={[
          {
            id: "info",
            title: "Bilgiler",
            content: selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedUser.profileImageUrl} />
                    <AvatarFallback className="text-2xl">
                      {selectedUser.firstName?.[0]}
                      {selectedUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-muted-foreground">
                      @{selectedUser.username || "kullanici"}
                    </p>
                  </div>
                </div>

                <DetailGrid>
                  <DetailField label="Email" value={selectedUser.email} />
                  <DetailField label="Telefon" value={selectedUser.phone || "-"} />
                  <DetailField
                    label="Email Doğrulaması"
                    value={
                      selectedUser.emailVerified ? (
                        <Badge variant="default" className="bg-green-500">
                          Doğrulandı
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Doğrulanmadı</Badge>
                      )
                    }
                  />
                  <DetailField
                    label="Telefon Doğrulaması"
                    value={
                      selectedUser.phoneVerified ? (
                        <Badge variant="default" className="bg-green-500">
                          Doğrulandı
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Doğrulanmadı</Badge>
                      )
                    }
                  />
                  <DetailField
                    label="Kayıt Tarihi"
                    value={format(new Date(selectedUser.createdAt), "dd MMMM yyyy HH:mm", {
                      locale: tr,
                    })}
                  />
                  <DetailField
                    label="Son Giriş"
                    value={
                      selectedUser.lastLoginAt
                        ? formatDistanceToNow(new Date(selectedUser.lastLoginAt), {
                            addSuffix: true,
                            locale: tr,
                          })
                        : "-"
                    }
                  />
                </DetailGrid>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(null);
                      setRoleChangeUser(selectedUser);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Rol Değiştir
                  </Button>
                  <Button
                    variant={selectedUser.status === "banned" ? "default" : "destructive"}
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(null);
                      setBanUser(selectedUser);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {selectedUser.status === "banned" ? "Yasağı Kaldır" : "Yasakla"}
                  </Button>
                </div>
              </div>
            ),
          },
          {
            id: "activity",
            title: "Aktivite",
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-2xl font-bold">
                            {selectedUser?.listingCount || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">İlan</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-2xl font-bold">
                            {selectedUser?.storeId ? 1 : 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Mağaza</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Detaylı aktivite geçmişi yakında eklenecek
                </p>
              </div>
            ),
          },
        ]}
      />

      <AlertDialog open={!!roleChangeUser} onOpenChange={() => setRoleChangeUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı Rolünü Değiştir</AlertDialogTitle>
            <AlertDialogDescription>
              {roleChangeUser?.firstName} {roleChangeUser?.lastName} için yeni rol seçin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              defaultValue={roleChangeUser?.role}
              onValueChange={(value) => {
                if (roleChangeUser) {
                  updateRoleMutation.mutate({ id: roleChangeUser.id, role: value });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Kullanıcı</SelectItem>
                <SelectItem value="seller">Satıcı</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!banUser} onOpenChange={() => setBanUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banUser?.status === "banned" ? "Yasağı Kaldır" : "Kullanıcıyı Yasakla"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banUser?.status === "banned"
                ? `${banUser?.firstName} ${banUser?.lastName} kullanıcısının yasağını kaldırmak istediğinizden emin misiniz?`
                : `${banUser?.firstName} ${banUser?.lastName} kullanıcısını yasaklamak istediğinizden emin misiniz? Bu kullanıcı platforma erişemeyecek.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (banUser) {
                  banUserMutation.mutate({
                    id: banUser.id,
                    status: banUser.status === "banned" ? "active" : "banned",
                  });
                }
              }}
              className={banUser?.status !== "banned" ? "bg-destructive" : ""}
            >
              {banUser?.status === "banned" ? "Yasağı Kaldır" : "Yasakla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
