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
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  FileText,
  Download,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface DocumentData {
  document: {
    id: string;
    documentType: string;
    status: string;
    documentUrl: string;
    rejectionReason?: string;
    createdAt: string;
    verifiedAt?: string;
  };
  listing: {
    id: string;
    title: string;
    price?: string;
  };
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface DocumentStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

const documentTypeLabels: Record<string, string> = {
  microchip: "Mikroçip Belgesi",
  passport: "Hayvan Pasaportu",
  vaccination: "Aşı Kartı",
  health_certificate: "Sağlık Raporu",
  pedigree: "Soy Belgesi",
  cites: "CITES Belgesi",
  dkmp_permit: "DKMP İzin Belgesi",
  turkvet: "TÜRKVET Kaydı",
  ear_tag: "Kulak Küpesi",
  transport: "Nakil Belgesi",
  breeding_permit: "Yetiştiricilik Belgesi",
};

export default function AdminDocumentsPage() {
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [rejectDocument, setRejectDocument] = useState<DocumentData | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: documents = [], isLoading, refetch } = useQuery<DocumentData[]>({
    queryKey: ["/api/admin/listing-documents"],
  });

  const stats: DocumentStats = {
    total: documents.length,
    pending: documents.filter((d) => d.document.status === "pending").length,
    verified: documents.filter((d) => d.document.status === "verified").length,
    rejected: documents.filter((d) => d.document.status === "rejected").length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      return apiRequest("PATCH", `/api/admin/listing-documents/${id}`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listing-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Belge durumu güncellendi" });
      setRejectDocument(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      return Promise.all(
        ids.map((id) => apiRequest("PATCH", `/api/admin/listing-documents/${id}`, { status }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listing-documents"] });
      toast({ title: `${selectedIds.length} belge güncellendi` });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter === "pending") return doc.document.status === "pending";
    if (statusFilter === "verified") return doc.document.status === "verified";
    if (statusFilter === "rejected") return doc.document.status === "rejected";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Doğrulandı
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

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const columns: Column<DocumentData>[] = [
    {
      key: "document",
      header: "Belge",
      cell: (doc) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center overflow-hidden">
            {isImageFile(doc.document.documentUrl) ? (
              <img
                src={doc.document.documentUrl}
                alt=""
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setPreviewUrl(doc.document.documentUrl)}
              />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {documentTypeLabels[doc.document.documentType] || doc.document.documentType}
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {doc.listing.title}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "seller",
      header: "Yükleyen",
      cell: (doc) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={doc.seller.profileImageUrl} />
            <AvatarFallback>
              {doc.seller.firstName?.[0]}
              {doc.seller.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {doc.seller.firstName} {doc.seller.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (doc) => getStatusBadge(doc.document.status),
    },
    {
      key: "createdAt",
      header: "Tarih",
      cell: (doc) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(doc.document.createdAt), {
            addSuffix: true,
            locale: tr,
          })}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-documents">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Belge Doğrulama</h1>
          <p className="text-muted-foreground">
            Kullanıcıların yüklediği belgeleri inceleyin ve doğrulayın
          </p>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam"
            value={stats.total}
            icon={<FileCheck className="h-4 w-4" />}
          />
          <StatCard
            title="Beklemede"
            value={stats.pending}
            icon={<Clock className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            title="Doğrulanan"
            value={stats.verified}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Reddedilen"
            value={stats.rejected}
            icon={<XCircle className="h-4 w-4" />}
            variant="danger"
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Belgeler</CardTitle>
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
                  <TabsTrigger value="verified">Doğrulanan</TabsTrigger>
                  <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredDocuments}
              columns={columns}
              isLoading={isLoading}
              onRefresh={refetch}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getItemId={(d) => d.document.id}
              bulkActions={[
                {
                  label: "Toplu Onayla",
                  icon: <Check className="h-4 w-4" />,
                  onClick: (ids) => bulkUpdateMutation.mutate({ ids, status: "verified" }),
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
                  onClick: (doc) => setSelectedDocument(doc),
                },
                {
                  label: "Belgeyi Görüntüle",
                  icon: <ExternalLink className="h-4 w-4" />,
                  onClick: (doc) => window.open(doc.document.documentUrl, "_blank"),
                },
                {
                  label: "Onayla",
                  icon: <Check className="h-4 w-4" />,
                  onClick: (doc) =>
                    updateStatusMutation.mutate({ id: doc.document.id, status: "verified" }),
                },
                {
                  label: "Reddet",
                  icon: <X className="h-4 w-4" />,
                  onClick: (doc) => setRejectDocument(doc),
                  variant: "destructive",
                },
              ]}
              emptyMessage="Belge bulunamadı"
            />
          </CardContent>
        </Card>
      </div>

      <DetailDrawer
        open={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        title={documentTypeLabels[selectedDocument?.document.documentType || ""] || selectedDocument?.document.documentType || ""}
        subtitle={selectedDocument?.listing.title}
        badge={
          selectedDocument?.document.status === "verified"
            ? { label: "Doğrulandı", variant: "default" }
            : selectedDocument?.document.status === "pending"
            ? { label: "Beklemede", variant: "secondary" }
            : { label: "Reddedildi", variant: "destructive" }
        }
        width="wide"
        actions={
          selectedDocument?.document.status === "pending" && (
            <>
              <Button
                className="flex-1"
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: selectedDocument.document.id,
                    status: "verified",
                  });
                  setSelectedDocument(null);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Onayla
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedDocument(null);
                  setRejectDocument(selectedDocument);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Reddet
              </Button>
            </>
          )
        }
        sections={
          selectedDocument
            ? [
                {
                  id: "preview",
                  title: "Belge Önizleme",
                  content: (
                    <div className="space-y-4">
                      {isImageFile(selectedDocument.document.documentUrl) ? (
                        <div className="bg-accent rounded-lg overflow-hidden">
                          <img
                            src={selectedDocument.document.documentUrl}
                            alt=""
                            className="w-full h-auto max-h-[400px] object-contain cursor-pointer"
                            onClick={() => setPreviewUrl(selectedDocument.document.documentUrl)}
                          />
                        </div>
                      ) : (
                        <div className="bg-accent rounded-lg p-8 text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-4">PDF veya diğer dosya türü</p>
                          <Button variant="outline" asChild>
                            <a href={selectedDocument.document.documentUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Belgeyi İndir
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  id: "details",
                  title: "Belge Bilgileri",
                  content: (
                    <DetailGrid>
                      <DetailField
                        label="Belge Tipi"
                        value={documentTypeLabels[selectedDocument.document.documentType] || selectedDocument.document.documentType}
                      />
                      <DetailField
                        label="Durum"
                        value={getStatusBadge(selectedDocument.document.status)}
                      />
                      <DetailField
                        label="Yüklenme Tarihi"
                        value={format(new Date(selectedDocument.document.createdAt), "dd MMMM yyyy HH:mm", {
                          locale: tr,
                        })}
                      />
                      {selectedDocument.document.verifiedAt && (
                        <DetailField
                          label="Doğrulanma Tarihi"
                          value={format(new Date(selectedDocument.document.verifiedAt), "dd MMMM yyyy HH:mm", {
                            locale: tr,
                          })}
                        />
                      )}
                    </DetailGrid>
                  ),
                },
                {
                  id: "listing",
                  title: "İlgili İlan",
                  content: (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{selectedDocument.listing.title}</p>
                            {selectedDocument.listing.price && (
                              <p className="text-sm text-muted-foreground">
                                {selectedDocument.listing.price} TL
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/ilan/${selectedDocument.listing.id}`} target="_blank">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Görüntüle
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                },
                {
                  id: "seller",
                  title: "Yükleyen Kullanıcı",
                  content: (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedDocument.seller.profileImageUrl} />
                        <AvatarFallback>
                          {selectedDocument.seller.firstName?.[0]}
                          {selectedDocument.seller.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedDocument.seller.firstName} {selectedDocument.seller.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDocument.seller.email}
                        </p>
                      </div>
                    </div>
                  ),
                },
                ...(selectedDocument.document.rejectionReason
                  ? [
                      {
                        id: "rejection",
                        title: "Red Nedeni",
                        content: (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <p className="text-sm">{selectedDocument.document.rejectionReason}</p>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <Dialog open={!!rejectDocument} onOpenChange={() => setRejectDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Belgeyi Reddet</DialogTitle>
            <DialogDescription>
              Belgeyi reddetmek için bir neden belirtin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Red nedeni..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDocument(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectDocument) {
                  updateStatusMutation.mutate({
                    id: rejectDocument.document.id,
                    status: "rejected",
                    rejectionReason,
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

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Belge Önizleme</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt=""
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
