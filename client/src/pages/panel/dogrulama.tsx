import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Stethoscope,
  Truck,
  Package,
  Milk,
  FileText,
  Info,
  AlertTriangle,
  Send
} from "lucide-react";

type VerificationRequest = {
  id: string;
  professional_type: string;
  document_type: string;
  document_number: string | null;
  issuing_authority: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const PROFESSIONAL_TYPES = [
  {
    value: "veterinarian",
    label: "Veteriner Hekim",
    icon: Stethoscope,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    documents: [
      { value: "tvhb_diploma", label: "TVHB Diploması" },
      { value: "veteriner_lisans", label: "Veteriner Lisans Belgesi" },
      { value: "klinik_izin", label: "Klinik Açma İzni" },
    ],
    description: "Türk Veteriner Hekimleri Birliği (TVHB) üyesi veteriner hekimler için doğrulama",
    requirements: [
      "TVHB üyelik belgesi veya diploması",
      "Veteriner lisans belgesi",
      "Aktif klinik veya muayenehane belgesi (varsa)"
    ]
  },
  {
    value: "transporter",
    label: "Hayvan Nakliyecisi",
    icon: Truck,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    documents: [
      { value: "tasima_ruhsati", label: "Taşıma Ruhsatı" },
      { value: "arac_ruhsati", label: "Araç Ruhsatı" },
      { value: "yetki_belgesi", label: "Yetki Belgesi (K tipi)" },
    ],
    description: "Hayvan taşıma yetkisi olan nakliyeciler için doğrulama",
    requirements: [
      "Hayvan taşıma ruhsatı",
      "K tipi yetki belgesi",
      "Araç ruhsatı ve uygunluk belgesi"
    ]
  },
  {
    value: "b2b_seller",
    label: "B2B Yem/Mama Satıcısı",
    icon: Package,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-800",
    documents: [
      { value: "vergi_levhasi", label: "Vergi Levhası" },
      { value: "kalite_sertifikasi", label: "Kalite Sertifikası (ISO/TSE)" },
      { value: "tarim_izni", label: "Tarım Bakanlığı İzni" },
    ],
    description: "Toptan yem ve mama satışı yapan işletmeler için doğrulama",
    requirements: [
      "Vergi levhası veya ticaret sicil belgesi",
      "Kalite belgesi (ISO/TSE veya eşdeğeri)",
      "Tarım Bakanlığı onaylı ürün belgesi"
    ]
  },
  {
    value: "dairy_seller",
    label: "Toptan Süt/Süt Ürünleri Satıcısı",
    icon: Milk,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-800",
    documents: [
      { value: "gida_sicil_belgesi", label: "Gıda Sicil Belgesi" },
      { value: "isyeri_acma_izni", label: "İşyeri Açma ve Çalışma Ruhsatı" },
      { value: "gida_guvenlik_sertifikasi", label: "Gıda Güvenliği Sertifikası" },
    ],
    description: "Süt ve süt ürünleri toptan satışı yapan üreticiler ve işletmeciler için doğrulama",
    requirements: [
      "Gıda Sicil Belgesi",
      "İşyeri Açma ve Çalışma Ruhsatı",
      "Gıda güvenliği belgesi (HACCP/ISO 22000)"
    ]
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
      <CheckCircle className="w-3 h-3 mr-1" /> Onaylandı
    </Badge>
  );
  if (status === "rejected") return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="w-3 h-3 mr-1" /> Reddedildi
    </Badge>
  );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
      <Clock className="w-3 h-3 mr-1" /> İnceleniyor
    </Badge>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric"
  });
}

export default function DogrulamaPage() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState({
    documentType: "",
    documentNumber: "",
    issuingAuthority: "",
    notes: "",
  });

  const { data: verifications = [], isLoading } = useQuery<VerificationRequest[]>({
    queryKey: ["/api/verify/status"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: object) => {
      return apiRequest("POST", "/api/verify/request", data);
    },
    onSuccess: () => {
      toast({ title: "Talep Gönderildi", description: "Doğrulama talebiniz incelemeye alındı. En kısa sürede sonuçlandırılacaktır." });
      queryClient.invalidateQueries({ queryKey: ["/api/verify/status"] });
      setSelectedType("");
      setFormData({ documentType: "", documentNumber: "", issuingAuthority: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error?.message || "Talep gönderilemedi.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!selectedType || !formData.documentType) {
      toast({ title: "Eksik Bilgi", description: "Lütfen meslek türü ve belge türü seçin.", variant: "destructive" });
      return;
    }
    submitMutation.mutate({
      professionalType: selectedType,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      issuingAuthority: formData.issuingAuthority,
      notes: formData.notes,
    });
  };

  const selectedTypeInfo = PROFESSIONAL_TYPES.find(t => t.value === selectedType);
  const pendingTypes = new Set(verifications.filter(v => v.status === "pending" || v.status === "approved").map(v => v.professional_type));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Mesleki Doğrulama
        </h1>
        <p className="text-muted-foreground mt-1">
          Profesyonel kimliğinizi doğrulayın, güven rozeti kazanın ve daha fazla müşteriye ulaşın
        </p>
      </div>

      {/* Benefits info */}
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Doğrulanmış profiller</strong> arama sonuçlarında öne çıkar, "Doğrulanmış" rozeti görüntüler
          ve müşteri güvenini artırır. Onay süresi genellikle 1-3 iş günüdür.
        </AlertDescription>
      </Alert>

      {/* Existing verifications */}
      {!isLoading && verifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Doğrulama Taleplerim</h2>
          {verifications.map((v) => {
            const typeInfo = PROFESSIONAL_TYPES.find(t => t.value === v.professional_type);
            const Icon = typeInfo?.icon || Shield;
            return (
              <Card key={v.id} className={`border ${typeInfo?.border || ""}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeInfo?.bg || "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${typeInfo?.color || ""}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{typeInfo?.label || v.professional_type}</span>
                          <StatusBadge status={v.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Belge: {v.document_type} {v.document_number && `· ${v.document_number}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Başvuru: {formatDate(v.created_at)}
                        </p>
                        {v.admin_notes && (
                          <p className={`text-sm mt-2 ${v.status === "rejected" ? "text-red-600" : "text-muted-foreground"}`}>
                            Admin notu: {v.admin_notes}
                          </p>
                        )}
                        {v.status === "approved" && v.reviewed_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Onaylandı: {formatDate(v.reviewed_at)}
                            {v.reviewer_first_name && ` · ${v.reviewer_first_name} ${v.reviewer_last_name}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator />

      {/* New verification form */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Yeni Doğrulama Talebi</h2>
        
        {/* Type selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {PROFESSIONAL_TYPES.map((type) => {
            const Icon = type.icon;
            const alreadyHas = pendingTypes.has(type.value);
            return (
              <button
                key={type.value}
                onClick={() => !alreadyHas && setSelectedType(type.value)}
                disabled={alreadyHas}
                className={`
                  text-left p-4 rounded-lg border-2 transition-all
                  ${selectedType === type.value 
                    ? `${type.border} ${type.bg} border-current` 
                    : "border-border hover:border-primary/50"
                  }
                  ${alreadyHas ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                data-testid={`select-type-${type.value}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  <span className="font-medium">{type.label}</span>
                  {alreadyHas && (
                    <Badge variant="outline" className="text-xs ml-auto">Başvuruldu</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>

        {/* Form */}
        {selectedTypeInfo && (
          <Card className={`border ${selectedTypeInfo.border}`}>
            <CardHeader className={`pb-4 ${selectedTypeInfo.bg} rounded-t-lg`}>
              <CardTitle className="text-base flex items-center gap-2">
                <selectedTypeInfo.icon className={`w-5 h-5 ${selectedTypeInfo.color}`} />
                {selectedTypeInfo.label} Doğrulama Belgesi
              </CardTitle>
              <CardDescription>
                Aşağıdaki belgelerden birini sunmanız gerekmektedir
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Requirements */}
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Gerekli belgeler:</strong>
                  <ul className="mt-1 space-y-1">
                    {selectedTypeInfo.requirements.map((req, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Belge Türü <span className="text-red-500">*</span></Label>
                  <Select value={formData.documentType} onValueChange={(v) => setFormData({ ...formData, documentType: v })}>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="Belge türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTypeInfo.documents.map(doc => (
                        <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Belge Numarası</Label>
                  <Input
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    placeholder="Belge/sicil numarası"
                    data-testid="input-document-number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Veren Kurum</Label>
                <Input
                  value={formData.issuingAuthority}
                  onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                  placeholder="Örn: TVHB İstanbul Bölge Birliği"
                  data-testid="input-issuing-authority"
                />
              </div>

              <div className="space-y-2">
                <Label>Ek Açıklama</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Belge ile ilgili ek bilgi veya açıklamalar..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  Belge bilgilerinizin doğruluğundan sorumlusunuzdur. Yanlış veya sahte bilgi
                  sunulması hesabınızın askıya alınmasına neden olabilir.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !formData.documentType}
                className="w-full"
                data-testid="button-submit-verification"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? "Gönderiliyor..." : "Doğrulama Talebi Gönder"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
