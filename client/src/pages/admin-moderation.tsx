import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users, FileText, Shield } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
}

interface ListingWithSeller {
  id: string;
  title: string;
  description: string;
  price: string;
  city: string;
  district: string;
  status: string;
  createdAt: string;
  moderatedAt?: string;
  moderationReason?: string;
  sellerId: string;
  sellerUsername: string;
  sellerEmail: string;
  sellerIsVerified: boolean;
}

export default function AdminModeration() {
  const { toast } = useToast();
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: listings = [], isLoading: listingsLoading, refetch } = useQuery<ListingWithSeller[]>({
    queryKey: ["/api/admin/listings", statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/listings?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/listings/${id}/status`, {
        status,
        reason,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Başarılı",
        description: data.message || "İlan durumu güncellendi",
      });
      setShowRejectDialog(false);
      setShowApproveDialog(false);
      setSelectedListing(null);
      setRejectionReason("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem başarısız",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (listing: ListingWithSeller) => {
    setSelectedListing(listing);
    setShowApproveDialog(true);
  };

  const handleReject = (listing: ListingWithSeller) => {
    setSelectedListing(listing);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedListing) {
      moderateMutation.mutate({
        id: selectedListing.id,
        status: 'active',
      });
    }
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Hata",
        description: "Red nedeni zorunludur",
        variant: "destructive",
      });
      return;
    }

    if (selectedListing) {
      moderateMutation.mutate({
        id: selectedListing.id,
        status: 'rejected',
        reason: rejectionReason,
      });
    }
  };

  if (statsLoading || listingsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8" data-testid="page-admin-moderation">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">İlan Moderasyon Paneli</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
            <CardTitle className="text-sm font-medium">Doğrulanmış</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-verified-users">
              {stats?.verifiedUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen İlan</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-listings">
              {stats?.pendingListings || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif İlan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active-listings">
              {stats?.activeListings || 0}
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
      </div>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>İlan Moderasyon Kuyruğu</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" data-testid="tab-pending">
                Bekleyen ({stats?.pendingListings || 0})
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active">
                Aktif ({stats?.activeListings || 0})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Reddedilen
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                Tümü ({stats?.totalListings || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4">
              {listings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Bu kategoride ilan bulunmuyor</p>
                </div>
              ) : (
                listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden" data-testid={`listing-card-${listing.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg" data-testid={`listing-title-${listing.id}`}>
                                {listing.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {listing.description}
                              </p>
                            </div>
                            <Badge
                              variant={
                                listing.status === 'active' ? 'default' :
                                listing.status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                              data-testid={`listing-status-${listing.id}`}
                            >
                              {listing.status === 'pending' && '⏳ Bekliyor'}
                              {listing.status === 'active' && '✓ Aktif'}
                              {listing.status === 'rejected' && '✗ Reddedildi'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Fiyat:</span>{' '}
                              <span className="font-medium">₺{listing.price}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Konum:</span>{' '}
                              <span>{listing.city}, {listing.district}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Oluşturulma:</span>{' '}
                              <span>{new Date(listing.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm border-t pt-3">
                            <div>
                              <span className="text-muted-foreground">Satıcı:</span>{' '}
                              <span className="font-medium">{listing.sellerUsername}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>{' '}
                              <span>{listing.sellerEmail}</span>
                            </div>
                            <Badge variant={listing.sellerIsVerified ? "default" : "secondary"} className="h-6">
                              {listing.sellerIsVerified ? '✓ Doğrulanmış' : '⚠ Doğrulanmamış'}
                            </Badge>
                          </div>

                          {listing.moderationReason && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                              <p className="text-sm font-medium text-destructive">Red Nedeni:</p>
                              <p className="text-sm">{listing.moderationReason}</p>
                            </div>
                          )}
                        </div>

                        {listing.status === 'pending' && (
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <Button
                              onClick={() => handleApprove(listing)}
                              variant="default"
                              className="w-full"
                              data-testid={`button-approve-${listing.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Onayla
                            </Button>
                            <Button
                              onClick={() => handleReject(listing)}
                              variant="destructive"
                              className="w-full"
                              data-testid={`button-reject-${listing.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reddet
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent data-testid="dialog-approve">
          <DialogHeader>
            <DialogTitle>İlanı Onayla</DialogTitle>
            <DialogDescription>
              Bu ilanı onaylamak istediğinizden emin misiniz? İlan aktif hale gelecek ve kullanıcılara görünür olacaktır.
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="py-4">
              <p className="font-medium">{selectedListing.title}</p>
              <p className="text-sm text-muted-foreground">Satıcı: {selectedListing.sellerUsername}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              data-testid="button-cancel-approve"
            >
              İptal
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={moderateMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {moderateMutation.isPending ? 'Onaylanıyor...' : 'Onayla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>İlanı Reddet</DialogTitle>
            <DialogDescription>
              İlanı reddetmek için bir neden belirtmeniz gerekmektedir.
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{selectedListing.title}</p>
                <p className="text-sm text-muted-foreground">Satıcı: {selectedListing.sellerUsername}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Red Nedeni *</label>
                <Textarea
                  placeholder="Örn: İlan içeriği kurallara uygun değil, geçersiz fiyat, yanlış kategori..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  data-testid="input-rejection-reason"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              data-testid="button-cancel-reject"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={moderateMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {moderateMutation.isPending ? 'Reddediliyor...' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
