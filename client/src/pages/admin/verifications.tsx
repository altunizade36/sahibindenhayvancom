import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  CheckCircle, XCircle, Clock, Shield, Stethoscope, Truck, Package, Milk,
  User, FileText, Calendar, Building
} from "lucide-react";

type Verification = {
  id: string;
  user_id: string;
  professional_type: string;
  document_type: string;
  document_number: string | null;
  issuing_authority: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string | null;
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  veterinarian: { label: "Veteriner Hekim", icon: Stethoscope, color: "text-blue-600" },
  transporter: { label: "Nakliyeci", icon: Truck, color: "text-orange-600" },
  b2b_seller: { label: "B2B Yem Satıcısı", icon: Package, color: "text-green-600" },
  dairy_seller: { label: "Süt Ürünleri Satıcısı", icon: Milk, color: "text-cyan-600" },
};

const DOC_LABELS: Record<string, string> = {
  tvhb_diploma: "TVHB Diploması",
  veteriner_lisans: "Veteriner Lisansı",
  klinik_izin: "Klinik Açma İzni",
  tasima_ruhsati: "Taşıma Ruhsatı",
  arac_ruhsati: "Araç Ruhsatı",
  yetki_belgesi: "Yetki Belgesi",
  vergi_levhasi: "Vergi Levhası",
  kalite_sertifikasi: "Kalite Sertifikası",
  tarim_izni: "Tarım Bakanlığı İzni",
  gida_sicil_belgesi: "Gıda Sicil Belgesi",
  isyeri_acma_izni: "İşyeri Açma İzni",
  gida_guvenlik_sertifikasi: "Gıda Güvenliği Sertifikası",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" /> Onaylandı
    </Badge>
  );
  if (status === "rejected") return (
    <Badge className="bg-red-100 text-red-800">
      <XCircle className="w-3 h-3 mr-1" /> Reddedildi
    </Badge>
  );
  return (
    <Badge className="bg-yellow-100 text-yellow-800">
      <Clock className="w-3 h-3 mr-1" /> Bekliyor
    </Badge>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState<Verification | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  if (!user || (user as any).role !== "admin") {
    navigate("/");
    return null;
  }

  const { data: verifications = [], isLoading, refetch } = useQuery<Verification[]>({
    queryKey: ["/api/admin/verifications", statusFilter === "all" ? {} : { status: statusFilter }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/verifications?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/verifications/${id}`, { status, adminNotes: notes });
    },
    onSuccess: () => {
      toast({
        title: action === "approve" ? "Onaylandı" : "Reddedildi",
        description: `Doğrulama talebi ${action === "approve" ? "onaylandı" : "reddedildi"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      setSelected(null);
      setAction(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi.", variant: "destructive" });
    },
  });

  const handleReview = () => {
    if (!selected || !action) return;
    reviewMutation.mutate({
      id: selected.id,
      status: action === "approve" ? "approved" : "rejected",
      notes: adminNotes,
    });
  };

  const counts = {
    pending: verifications.filter(v => v.status === "pending").length,
    approved: verifications.filter(v => v.status === "approved").length,
    rejected: verifications.filter(v => v.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Mesleki Doğrulama Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Profesyonel doğrulama taleplerini inceleyin ve onaylayın
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{counts.pending}</div>
              <div className="text-sm text-muted-foreground mt-1">Bekleyen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-green-600">{counts.approved}</div>
              <div className="text-sm text-muted-foreground mt-1">Onaylanan</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-red-600">{counts.rejected}</div>
              <div className="text-sm text-muted-foreground mt-1">Reddedilen</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Bekleyen</TabsTrigger>
            <TabsTrigger value="approved">Onaylanan</TabsTrigger>
            <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected"].map(tab => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : verifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Bu kategoride doğrulama talebi yok.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {verifications.map((v) => {
                    const typeConf = TYPE_CONFIG[v.professional_type] || { label: v.professional_type, icon: Shield, color: "text-primary" };
                    const Icon = typeConf.icon;
                    return (
                      <Card key={v.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="p-2 bg-muted rounded-lg shrink-0">
                                <Icon className={`w-5 h-5 ${typeConf.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="font-semibold">{v.first_name} {v.last_name}</span>
                                  <StatusBadge status={v.status} />
                                  <Badge variant="outline" className="text-xs">{typeConf.label}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">{v.email}</span>
                                  </div>
                                  {v.city && (
                                    <div className="flex items-center gap-1">
                                      <Building className="w-3 h-3" />
                                      <span>{v.city}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span>{DOC_LABELS[v.document_type] || v.document_type}</span>
                                    {v.document_number && <span>· {v.document_number}</span>}
                                  </div>
                                  {v.issuing_authority && (
                                    <div className="flex items-center gap-1">
                                      <Building className="w-3 h-3" />
                                      <span className="truncate">{v.issuing_authority}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(v.created_at)}</span>
                                  </div>
                                </div>
                                {v.notes && (
                                  <p className="text-sm mt-2 p-2 bg-muted rounded text-muted-foreground">
                                    {v.notes}
                                  </p>
                                )}
                                {v.admin_notes && (
                                  <p className="text-sm mt-2 text-muted-foreground">
                                    <span className="font-medium">Admin notu:</span> {v.admin_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            {v.status === "pending" && (
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => { setSelected(v); setAction("approve"); }}
                                  data-testid={`button-approve-${v.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => { setSelected(v); setAction("reject"); }}
                                  data-testid={`button-reject-${v.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reddet
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setAction(null); setAdminNotes(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "approve" ? "Doğrulamayı Onayla" : "Doğrulamayı Reddet"}
              </DialogTitle>
              <DialogDescription>
                {selected?.first_name} {selected?.last_name} — {selected && (TYPE_CONFIG[selected.professional_type]?.label || selected.professional_type)}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {selected && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription className="text-sm space-y-1">
                    <div><strong>Belge:</strong> {DOC_LABELS[selected.document_type] || selected.document_type}</div>
                    {selected.document_number && <div><strong>No:</strong> {selected.document_number}</div>}
                    {selected.issuing_authority && <div><strong>Kurum:</strong> {selected.issuing_authority}</div>}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {action === "approve" ? "Onay notu (isteğe bağlı)" : "Red gerekçesi"}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    action === "approve"
                      ? "Onay ile ilgili notunuzu yazın..."
                      : "Reddetme gerekçenizi açıklayın..."
                  }
                  rows={3}
                  data-testid="textarea-admin-notes"
                />
              </div>
              {action === "reject" && !adminNotes && (
                <p className="text-sm text-red-600">Red gerekçesi yazmanız önerilir.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelected(null); setAction(null); setAdminNotes(""); }}>
                İptal
              </Button>
              <Button
                onClick={handleReview}
                disabled={reviewMutation.isPending}
                className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
                data-testid="button-confirm-review"
              >
                {reviewMutation.isPending
                  ? "İşleniyor..."
                  : action === "approve" ? "Onayla" : "Reddet"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
