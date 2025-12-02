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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  AlertTriangle,
  FileText,
  User,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  listing?: {
    id: string;
    title: string;
    price: string;
    sellerId: string;
  };
  reportedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReportStats {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

const reasonLabels: Record<string, string> = {
  spam: "Spam / Reklam",
  fraud: "Dolandırıcılık",
  inappropriate: "Uygunsuz İçerik",
  duplicate: "Tekrarlayan İlan",
  wrong_category: "Yanlış Kategori",
  fake: "Sahte İlan",
  illegal: "Yasadışı İçerik",
  other: "Diğer",
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolveReport, setResolveReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolveStatus, setResolveStatus] = useState("resolved");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reports = [], isLoading, refetch } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const stats: ReportStats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      return apiRequest("PATCH", `/api/admin/reports/${id}`, { status, resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Şikayet durumu güncellendi" });
      setResolveReport(null);
      setResolution("");
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const filteredReports = reports.filter((report) => {
    if (statusFilter === "pending") return report.status === "pending";
    if (statusFilter === "resolved") return report.status === "resolved";
    if (statusFilter === "dismissed") return report.status === "dismissed";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Çözüldü
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white gap-1">
            <Clock className="h-3 w-3" />
            Beklemede
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Reddedildi
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (reason: string) => {
    const highPriority = ["fraud", "illegal", "fake"];
    const mediumPriority = ["inappropriate", "spam"];
    
    if (highPriority.includes(reason)) {
      return <Badge variant="destructive">Yüksek</Badge>;
    }
    if (mediumPriority.includes(reason)) {
      return <Badge variant="secondary" className="bg-yellow-500 text-white">Orta</Badge>;
    }
    return <Badge variant="outline">Düşük</Badge>;
  };

  const columns: Column<Report>[] = [
    {
      key: "reason",
      header: "Şikayet",
      cell: (report) => (
        <div>
          <p className="font-medium">{reasonLabels[report.reason] || report.reason}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {report.description}
          </p>
        </div>
      ),
    },
    {
      key: "reporter",
      header: "Bildiren",
      cell: (report) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={report.reporter?.profileImageUrl} />
            <AvatarFallback>
              {report.reporter?.firstName?.[0]}
              {report.reporter?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {report.reporter?.firstName} {report.reporter?.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "listing",
      header: "İlan",
      cell: (report) => (
        report.listing ? (
          <div className="text-sm">
            <p className="font-medium truncate max-w-[200px]">{report.listing.title}</p>
            <p className="text-muted-foreground">{report.listing.price} TL</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: "priority",
      header: "Öncelik",
      cell: (report) => getPriorityBadge(report.reason),
    },
    {
      key: "status",
      header: "Durum",
      cell: (report) => getStatusBadge(report.status),
    },
    {
      key: "createdAt",
      header: "Tarih",
      cell: (report) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(report.createdAt), {
            addSuffix: true,
            locale: tr,
          })}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-reports">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Şikayet Yönetimi</h1>
          <p className="text-muted-foreground">
            Kullanıcı şikayetlerini inceleyin ve çözümleyin
          </p>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam"
            value={stats.total}
            icon={<Flag className="h-4 w-4" />}
          />
          <StatCard
            title="Beklemede"
            value={stats.pending}
            icon={<Clock className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            title="Çözülen"
            value={stats.resolved}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Reddedilen"
            value={stats.dismissed}
            icon={<XCircle className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Şikayetler</CardTitle>
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
                  <TabsTrigger value="resolved">Çözülen</TabsTrigger>
                  <TabsTrigger value="dismissed">Reddedilen</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredReports}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Şikayet ara..."
              searchKey="description"
              onRefresh={refetch}
              getItemId={(r) => r.id}
              actions={[
                {
                  label: "Detay",
                  icon: <Eye className="h-4 w-4" />,
                  onClick: (report) => setSelectedReport(report),
                },
                {
                  label: "İlanı Görüntüle",
                  icon: <ExternalLink className="h-4 w-4" />,
                  onClick: (report) => report.listing && window.open(`/ilan/${report.listing.id}`, "_blank"),
                },
                {
                  label: "Çöz / Sonuçlandır",
                  icon: <CheckCircle className="h-4 w-4" />,
                  onClick: (report) => setResolveReport(report),
                },
              ]}
              emptyMessage="Şikayet bulunamadı"
            />
          </CardContent>
        </Card>
      </div>

      <DetailDrawer
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={reasonLabels[selectedReport?.reason || ""] || selectedReport?.reason || ""}
        subtitle={`Şikayet #${selectedReport?.id?.slice(0, 8)}`}
        badge={
          selectedReport?.status === "resolved"
            ? { label: "Çözüldü", variant: "default" }
            : selectedReport?.status === "pending"
            ? { label: "Beklemede", variant: "secondary" }
            : { label: "Reddedildi", variant: "outline" }
        }
        width="wide"
        actions={
          selectedReport?.status === "pending" && (
            <Button
              className="w-full"
              onClick={() => {
                setSelectedReport(null);
                setResolveReport(selectedReport);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Çöz / Sonuçlandır
            </Button>
          )
        }
        sections={
          selectedReport
            ? [
                {
                  id: "details",
                  title: "Şikayet Detayları",
                  content: (
                    <>
                      <div className="bg-accent/50 rounded-lg p-4 mb-4">
                        <p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                      </div>
                      <DetailGrid>
                        <DetailField
                          label="Şikayet Tipi"
                          value={reasonLabels[selectedReport.reason] || selectedReport.reason}
                        />
                        <DetailField
                          label="Öncelik"
                          value={getPriorityBadge(selectedReport.reason)}
                        />
                        <DetailField
                          label="Bildirim Tarihi"
                          value={format(new Date(selectedReport.createdAt), "dd MMMM yyyy HH:mm", {
                            locale: tr,
                          })}
                        />
                        <DetailField
                          label="Durum"
                          value={getStatusBadge(selectedReport.status)}
                        />
                      </DetailGrid>
                    </>
                  ),
                },
                {
                  id: "reporter",
                  title: "Bildiren Kullanıcı",
                  content: (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedReport.reporter?.profileImageUrl} />
                        <AvatarFallback>
                          {selectedReport.reporter?.firstName?.[0]}
                          {selectedReport.reporter?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedReport.reporter?.email}
                        </p>
                      </div>
                    </div>
                  ),
                },
                ...(selectedReport.listing
                  ? [
                      {
                        id: "listing",
                        title: "Şikayet Edilen İlan",
                        content: (
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{selectedReport.listing.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedReport.listing.price} TL
                                  </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/ilan/${selectedReport.listing.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Görüntüle
                                  </Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      },
                    ]
                  : []),
                ...(selectedReport.resolution
                  ? [
                      {
                        id: "resolution",
                        title: "Çözüm",
                        content: (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <p className="text-sm whitespace-pre-wrap">{selectedReport.resolution}</p>
                            {selectedReport.resolvedAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(selectedReport.resolvedAt), "dd MMMM yyyy HH:mm", {
                                  locale: tr,
                                })}
                              </p>
                            )}
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <Dialog open={!!resolveReport} onOpenChange={() => setResolveReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şikayeti Sonuçlandır</DialogTitle>
            <DialogDescription>
              Şikayetin sonucunu belirleyin ve açıklama ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sonuç</label>
              <Select value={resolveStatus} onValueChange={setResolveStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Çözüldü - İşlem Yapıldı</SelectItem>
                  <SelectItem value="dismissed">Reddedildi - Geçersiz Şikayet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Açıklama</label>
              <Textarea
                placeholder="Yapılan işlem veya red nedeni..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveReport(null)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                if (resolveReport) {
                  updateStatusMutation.mutate({
                    id: resolveReport.id,
                    status: resolveStatus,
                    resolution,
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              Sonuçlandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
