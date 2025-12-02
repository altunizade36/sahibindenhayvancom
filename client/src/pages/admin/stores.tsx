import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { DataTable, Column } from "@/components/admin/data-table";
import { DetailDrawer, DetailField, DetailGrid } from "@/components/admin/detail-drawer";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  FileText,
  ExternalLink,
  Ban,
  ShieldCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface StoreData {
  id: string;
  name: string;
  description?: string;
  status: string;
  storeType: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  rating?: number;
  reviewCount?: number;
  listingCount?: number;
  createdAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface StoreStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  suspended: number;
}

const storeTypeLabels: Record<string, string> = {
  petshop: "Pet Shop",
  veterinary: "Veteriner",
  breeder: "Yetiştirici",
  shelter: "Barınak",
  farm: "Çiftlik",
  other: "Diğer",
};

export default function AdminStoresPage() {
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [rejectStore, setRejectStore] = useState<StoreData | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspendStore, setSuspendStore] = useState<StoreData | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: stores = [], isLoading, refetch } = useQuery<StoreData[]>({
    queryKey: ["/api/admin/stores"],
  });

  const stats: StoreStats = {
    total: stores.length,
    approved: stores.filter((s) => s.status === "approved").length,
    pending: stores.filter((s) => s.status === "pending").length,
    rejected: stores.filter((s) => s.status === "rejected").length,
    suspended: stores.filter((s) => s.status === "suspended").length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/stores/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Mağaza durumu güncellendi" });
      setRejectStore(null);
      setSuspendStore(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const filteredStores = stores.filter((store) => {
    if (statusFilter === "pending") return store.status === "pending";
    if (statusFilter === "approved") return store.status === "approved";
    if (statusFilter === "rejected") return store.status === "rejected";
    if (statusFilter === "suspended") return store.status === "suspended";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Onaylı
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white gap-1">
            <Clock className="h-3 w-3" />
            Beklemede
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Reddedildi
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive" className="gap-1">
            <Ban className="h-3 w-3" />
            Askıda
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: Column<StoreData>[] = [
    {
      key: "store",
      header: "Mağaza",
      cell: (store) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={store.logoUrl} />
            <AvatarFallback>
              <Store className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{store.name}</p>
            <p className="text-sm text-muted-foreground">
              {storeTypeLabels[store.storeType] || store.storeType}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Sahibi",
      cell: (store) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={store.owner?.profileImageUrl} />
            <AvatarFallback>
              {store.owner?.firstName?.[0]}
              {store.owner?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {store.owner?.firstName} {store.owner?.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Konum",
      cell: (store) => (
        <span className="text-sm text-muted-foreground">
          {store.city}{store.district ? `, ${store.district}` : ""}
        </span>
      ),
    },
    {
      key: "stats",
      header: "İstatistik",
      cell: (store) => (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {store.listingCount || 0}
          </span>
          {store.rating && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {store.rating.toFixed(1)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (store) => getStatusBadge(store.status),
    },
    {
      key: "createdAt",
      header: "Kayıt",
      cell: (store) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(store.createdAt), {
            addSuffix: true,
            locale: tr,
          })}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-stores">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mağaza Yönetimi</h1>
          <p className="text-muted-foreground">
            Mağazaları onaylayın, yönetin ve denetleyin
          </p>
        </div>

        <StatCardGrid columns={5}>
          <StatCard
            title="Toplam"
            value={stats.total}
            icon={<Store className="h-4 w-4" />}
          />
          <StatCard
            title="Onaylı"
            value={stats.approved}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Beklemede"
            value={stats.pending}
            icon={<Clock className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            title="Reddedilen"
            value={stats.rejected}
            icon={<XCircle className="h-4 w-4" />}
            variant="danger"
          />
          <StatCard
            title="Askıda"
            value={stats.suspended}
            icon={<Ban className="h-4 w-4" />}
            variant="danger"
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Mağazalar</CardTitle>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1">
                    Beklemede
                    {stats.pending > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                        {stats.pending}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Onaylı</TabsTrigger>
                  <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
                  <TabsTrigger value="suspended">Askıda</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredStores}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Mağaza ara..."
              searchKey="name"
              onRefresh={refetch}
              getItemId={(s) => s.id}
              actions={[
                {
                  label: "Detay",
                  icon: <Eye className="h-4 w-4" />,
                  onClick: (store) => setSelectedStore(store),
                },
                {
                  label: "Mağazayı Görüntüle",
                  icon: <ExternalLink className="h-4 w-4" />,
                  onClick: (store) => window.open(`/magaza/${store.id}`, "_blank"),
                },
                {
                  label: "Onayla",
                  icon: <Check className="h-4 w-4" />,
                  onClick: (store) =>
                    updateStatusMutation.mutate({ id: store.id, status: "approved" }),
                },
                {
                  label: "Reddet",
                  icon: <X className="h-4 w-4" />,
                  onClick: (store) => setRejectStore(store),
                  variant: "destructive",
                },
                {
                  label: store.status === "suspended" ? "Askıyı Kaldır" : "Askıya Al",
                  icon: <Ban className="h-4 w-4" />,
                  onClick: (store) => setSuspendStore(store),
                  variant: "destructive",
                },
              ]}
              emptyMessage="Mağaza bulunamadı"
            />
          </CardContent>
        </Card>
      </div>

      <DetailDrawer
        open={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        title={selectedStore?.name || ""}
        subtitle={storeTypeLabels[selectedStore?.storeType || ""] || selectedStore?.storeType}
        badge={
          selectedStore?.status === "approved"
            ? { label: "Onaylı", variant: "default" }
            : selectedStore?.status === "pending"
            ? { label: "Beklemede", variant: "secondary" }
            : { label: selectedStore?.status || "", variant: "destructive" }
        }
        width="wide"
        actions={
          selectedStore?.status === "pending" && (
            <>
              <Button
                className="flex-1"
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: selectedStore.id,
                    status: "approved",
                  });
                  setSelectedStore(null);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Onayla
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedStore(null);
                  setRejectStore(selectedStore);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Reddet
              </Button>
            </>
          )
        }
        sections={
          selectedStore
            ? [
                {
                  id: "details",
                  title: "Mağaza Bilgileri",
                  content: (
                    <>
                      {selectedStore.bannerUrl && (
                        <div className="h-32 rounded-lg overflow-hidden mb-4 bg-accent">
                          <img
                            src={selectedStore.bannerUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <DetailGrid>
                        <DetailField label="Mağaza Adı" value={selectedStore.name} />
                        <DetailField
                          label="Tür"
                          value={storeTypeLabels[selectedStore.storeType] || selectedStore.storeType}
                        />
                        <DetailField
                          label="Konum"
                          value={`${selectedStore.city}${
                            selectedStore.district ? `, ${selectedStore.district}` : ""
                          }`}
                        />
                        <DetailField label="Adres" value={selectedStore.address} />
                        <DetailField label="Telefon" value={selectedStore.phone} />
                        <DetailField label="Email" value={selectedStore.email} />
                        <DetailField label="Website" value={selectedStore.website} />
                        <DetailField
                          label="Kayıt Tarihi"
                          value={format(new Date(selectedStore.createdAt), "dd MMMM yyyy", {
                            locale: tr,
                          })}
                        />
                      </DetailGrid>
                    </>
                  ),
                },
                {
                  id: "description",
                  title: "Açıklama",
                  content: (
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedStore.description || "Açıklama yok"}
                    </p>
                  ),
                },
                {
                  id: "owner",
                  title: "Mağaza Sahibi",
                  content: (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedStore.owner?.profileImageUrl} />
                        <AvatarFallback>
                          {selectedStore.owner?.firstName?.[0]}
                          {selectedStore.owner?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedStore.owner?.firstName} {selectedStore.owner?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedStore.owner?.email}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "stats",
                  title: "İstatistikler",
                  content: (
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <p className="text-2xl font-bold">{selectedStore.listingCount || 0}</p>
                          <p className="text-xs text-muted-foreground">İlan</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <p className="text-2xl font-bold">
                            {selectedStore.rating?.toFixed(1) || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">Puan</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <p className="text-2xl font-bold">{selectedStore.reviewCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Değerlendirme</p>
                        </CardContent>
                      </Card>
                    </div>
                  ),
                },
              ]
            : []
        }
      />

      <Dialog open={!!rejectStore} onOpenChange={() => setRejectStore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mağazayı Reddet</DialogTitle>
            <DialogDescription>
              Mağaza başvurusunu reddetmek için bir neden belirtin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium mb-2">{rejectStore?.name}</p>
            <Textarea
              placeholder="Red nedeni..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectStore(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectStore) {
                  updateStatusMutation.mutate({
                    id: rejectStore.id,
                    status: "rejected",
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!suspendStore} onOpenChange={() => setSuspendStore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspendStore?.status === "suspended" ? "Askıyı Kaldır" : "Mağazayı Askıya Al"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspendStore?.status === "suspended"
                ? `${suspendStore?.name} mağazasının askı durumunu kaldırmak istediğinizden emin misiniz?`
                : `${suspendStore?.name} mağazasını askıya almak istediğinizden emin misiniz? Mağaza ve ilanları görünmez olacak.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (suspendStore) {
                  updateStatusMutation.mutate({
                    id: suspendStore.id,
                    status: suspendStore.status === "suspended" ? "approved" : "suspended",
                  });
                }
              }}
              className={suspendStore?.status !== "suspended" ? "bg-destructive" : ""}
            >
              {suspendStore?.status === "suspended" ? "Askıyı Kaldır" : "Askıya Al"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
