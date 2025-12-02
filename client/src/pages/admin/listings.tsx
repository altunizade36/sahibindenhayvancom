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
import { Link } from "wouter";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Tag,
  User,
  ExternalLink,
  Image as ImageIcon,
  Ban,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  status: string;
  city: string;
  district?: string;
  categoryId?: string;
  categoryName?: string;
  createdAt: string;
  moderatedAt?: string;
  moderationReason?: string;
  images?: string[];
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface ListingStats {
  total: number;
  active: number;
  pending: number;
  rejected: number;
  todayNew: number;
}

export default function AdminListingsPage() {
  const { toast } = useToast();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [rejectListing, setRejectListing] = useState<Listing | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: listings = [], isLoading, refetch } = useQuery<Listing[]>({
    queryKey: ["/api/admin/listings"],
  });

  const stats: ListingStats = {
    total: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    pending: listings.filter((l) => l.status === "pending").length,
    rejected: listings.filter((l) => l.status === "rejected").length,
    todayNew: listings.filter((l) => {
      const today = new Date();
      const created = new Date(l.createdAt);
      return created.toDateString() === today.toDateString();
    }).length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/admin/listings/${id}/status`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "İlan durumu güncellendi" });
      setRejectListing(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      return Promise.all(
        ids.map((id) => apiRequest("PATCH", `/api/admin/listings/${id}/status`, { status }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: `${selectedIds.length} ilan güncellendi` });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const filteredListings = listings.filter((listing) => {
    if (statusFilter === "pending") return listing.status === "pending";
    if (statusFilter === "active") return listing.status === "active";
    if (statusFilter === "rejected") return listing.status === "rejected";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Aktif
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: Column<Listing>[] = [
    {
      key: "listing",
      header: "İlan",
      cell: (listing) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center overflow-hidden">
            {listing.images?.[0] ? (
              <img
                src={listing.images[0]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[300px]">{listing.title}</p>
            <p className="text-sm text-muted-foreground">
              {listing.price} TL • {listing.city}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "seller",
      header: "Satıcı",
      cell: (listing) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={listing.seller?.profileImageUrl} />
            <AvatarFallback>
              {listing.seller?.firstName?.[0]}
              {listing.seller?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {listing.seller?.firstName} {listing.seller?.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (listing) => getStatusBadge(listing.status),
    },
    {
      key: "createdAt",
      header: "Tarih",
      cell: (listing) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(listing.createdAt), {
            addSuffix: true,
            locale: tr,
          })}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-listings">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">İlan Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm ilanları görüntüleyin, onaylayın veya reddedin
          </p>
        </div>

        <StatCardGrid columns={5}>
          <StatCard
            title="Toplam"
            value={stats.total}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            title="Aktif"
            value={stats.active}
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
            title="Bugün Eklenen"
            value={stats.todayNew}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>İlanlar</CardTitle>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">
                    Tümü ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1">
                    Beklemede
                    {stats.pending > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                        {stats.pending}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="active">Aktif ({stats.active})</TabsTrigger>
                  <TabsTrigger value="rejected">Reddedilen ({stats.rejected})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredListings}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="İlan ara..."
              searchKey="title"
              onRefresh={refetch}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getItemId={(l) => l.id}
              bulkActions={[
                {
                  label: "Toplu Onayla",
                  icon: <Check className="h-4 w-4" />,
                  onClick: (ids) => bulkUpdateMutation.mutate({ ids, status: "active" }),
                },
                {
                  label: "Toplu Reddet",
                  icon: <X className="h-4 w-4" />,
                  onClick: (ids) => bulkUpdateMutation.mutate({ ids, status: "rejected" }),
                  variant: "destructive",
                },
              ]}
              actions={[
                {
                  label: "Detay",
                  icon: <Eye className="h-4 w-4" />,
                  onClick: (listing) => setSelectedListing(listing),
                },
                {
                  label: "İlanı Görüntüle",
                  icon: <ExternalLink className="h-4 w-4" />,
                  onClick: (listing) => window.open(`/ilan/${listing.id}`, "_blank"),
                },
                {
                  label: "Onayla",
                  icon: <Check className="h-4 w-4" />,
                  onClick: (listing) =>
                    updateStatusMutation.mutate({ id: listing.id, status: "active" }),
                },
                {
                  label: "Reddet",
                  icon: <X className="h-4 w-4" />,
                  onClick: (listing) => setRejectListing(listing),
                  variant: "destructive",
                },
              ]}
              emptyMessage="İlan bulunamadı"
            />
          </CardContent>
        </Card>
      </div>

      <DetailDrawer
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title={selectedListing?.title || ""}
        subtitle={`${selectedListing?.price} TL`}
        badge={
          selectedListing?.status === "active"
            ? { label: "Aktif", variant: "default" }
            : selectedListing?.status === "pending"
            ? { label: "Beklemede", variant: "secondary" }
            : { label: "Reddedildi", variant: "destructive" }
        }
        width="wide"
        actions={
          selectedListing?.status === "pending" && (
            <>
              <Button
                className="flex-1"
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: selectedListing.id,
                    status: "active",
                  });
                  setSelectedListing(null);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Onayla
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedListing(null);
                  setRejectListing(selectedListing);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Reddet
              </Button>
            </>
          )
        }
        sections={
          selectedListing
            ? [
                {
                  id: "details",
                  title: "İlan Detayları",
                  content: (
                    <DetailGrid>
                      <DetailField label="Başlık" value={selectedListing.title} />
                      <DetailField label="Fiyat" value={`${selectedListing.price} TL`} />
                      <DetailField
                        label="Konum"
                        value={`${selectedListing.city}${
                          selectedListing.district ? `, ${selectedListing.district}` : ""
                        }`}
                      />
                      <DetailField
                        label="Kategori"
                        value={selectedListing.categoryName || "-"}
                      />
                      <DetailField
                        label="Oluşturulma"
                        value={format(new Date(selectedListing.createdAt), "dd MMMM yyyy HH:mm", {
                          locale: tr,
                        })}
                      />
                      <DetailField
                        label="Durum"
                        value={getStatusBadge(selectedListing.status)}
                      />
                    </DetailGrid>
                  ),
                },
                {
                  id: "description",
                  title: "Açıklama",
                  content: (
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedListing.description}
                    </p>
                  ),
                },
                {
                  id: "seller",
                  title: "Satıcı Bilgileri",
                  content: (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedListing.seller?.profileImageUrl} />
                        <AvatarFallback>
                          {selectedListing.seller?.firstName?.[0]}
                          {selectedListing.seller?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedListing.seller?.firstName}{" "}
                          {selectedListing.seller?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedListing.seller?.email}
                        </p>
                      </div>
                    </div>
                  ),
                },
                ...(selectedListing.moderationReason
                  ? [
                      {
                        id: "moderation",
                        title: "Moderasyon",
                        content: (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Red Nedeni:
                            </p>
                            <p className="text-sm">{selectedListing.moderationReason}</p>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <Dialog open={!!rejectListing} onOpenChange={() => setRejectListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İlanı Reddet</DialogTitle>
            <DialogDescription>
              İlanı reddetmek için bir neden belirtin. Bu neden satıcıya bildirilecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium mb-2">{rejectListing?.title}</p>
            <Textarea
              placeholder="Red nedeni..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectListing(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectListing) {
                  updateStatusMutation.mutate({
                    id: rejectListing.id,
                    status: "rejected",
                    reason: rejectionReason,
                  });
                }
              }}
              disabled={!rejectionReason.trim() || updateStatusMutation.isPending}
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
