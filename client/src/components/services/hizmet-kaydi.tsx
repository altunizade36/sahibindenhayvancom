/**
 * "Hizmet vermek istiyorum" kartı — veteriner klinikleri ve nakliyeciler için.
 *
 * Bu bölümde bir kopukluk vardı: klinik veya nakliye kaydı açmak `vet` /
 * `transporter` rolü istiyor, o rolü veren tek yol meslek doğrulaması, ama
 * sayfalarda ne doğrulamaya yönlendiren bir bağlantı ne de kayıt formu vardı.
 * Veteriner sayfasındaki "Veteriner Kaydı Oluştur" düğmesi ilan verme
 * sihirbazına gidiyordu; oradan klinik kaydı oluşmuyor. Sonuç: hizmet
 * listeleri baştan beri boştu.
 *
 * Kart kullanıcının durumuna göre üç şeyden birini gösterir:
 *   - oturum yok        → giriş / kayıt
 *   - rol yok           → doğrulama başvurusunun durumu + başvuru bağlantısı
 *   - rol var           → hizmet kaydı formu
 */
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, ShieldCheck, Clock, LogIn, FileCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { redirectQuery } from "@/lib/redirect";

type HizmetTuru = "veteriner" | "nakliye";

type Alan = {
  ad: string;
  etiket: string;
  ipucu?: string;
  tur?: "metin" | "sayi" | "onay";
  zorunlu?: boolean;
};

const TANIMLAR: Record<HizmetTuru, {
  baslik: string;
  aciklama: string;
  rol: string;
  meslekTuru: string;
  meslekAdi: string;
  uc: string;
  sorguAnahtari: string;
  alanlar: Alan[];
}> = {
  veteriner: {
    baslik: "Kliniğinizi listeleyin",
    aciklama: "Veteriner hekim doğrulamanız onaylandıktan sonra kliniğinizi bu sayfada yayınlayabilirsiniz.",
    rol: "vet",
    meslekTuru: "veterinarian",
    meslekAdi: "Veteriner hekim",
    uc: "/api/vet-services",
    sorguAnahtari: "/api/vet-services",
    alanlar: [
      { ad: "clinicName", etiket: "Klinik adı", zorunlu: true },
      { ad: "city", etiket: "İl", zorunlu: true },
      { ad: "district", etiket: "İlçe", zorunlu: true },
      { ad: "address", etiket: "Adres", zorunlu: true },
      { ad: "phone", etiket: "Telefon", zorunlu: true },
      { ad: "email", etiket: "E-posta" },
      { ad: "workingHours", etiket: "Çalışma saatleri", ipucu: "Örn: Hafta içi 09:00–19:00, Cumartesi 10:00–16:00" },
      { ad: "specializations", etiket: "Uzmanlık alanları", ipucu: "Virgülle ayırın: cerrahi, dahiliye, egzotik hayvanlar" },
      { ad: "services", etiket: "Sunulan hizmetler", ipucu: "Virgülle ayırın: aşı, ameliyat, laboratuvar" },
      { ad: "emergencyService", etiket: "7/24 acil hizmet veriyorum", tur: "onay" },
    ],
  },
  nakliye: {
    baslik: "Nakliye hizmetinizi listeleyin",
    aciklama: "Taşımacı doğrulamanız onaylandıktan sonra hizmetinizi bu sayfada yayınlayabilirsiniz.",
    rol: "transporter",
    meslekTuru: "transporter",
    meslekAdi: "Taşımacı",
    uc: "/api/transport-services",
    sorguAnahtari: "/api/transport-services",
    alanlar: [
      { ad: "companyName", etiket: "Firma adı", zorunlu: true },
      { ad: "phone", etiket: "Telefon", zorunlu: true },
      { ad: "serviceAreas", etiket: "Hizmet verdiğiniz iller", ipucu: "Virgülle ayırın: İstanbul, Bursa, İzmir", zorunlu: true },
      { ad: "vehicleTypes", etiket: "Araç tipleri", ipucu: "Virgülle ayırın: kamyon, minibüs, tır" },
      { ad: "animalTypes", etiket: "Taşıdığınız hayvanlar", ipucu: "Virgülle ayırın: büyükbaş, küçükbaş, kanatlı" },
      { ad: "pricePerKm", etiket: "Km başına ücret (₺)", tur: "sayi" },
      { ad: "minPrice", etiket: "En düşük ücret (₺)", tur: "sayi" },
      { ad: "insurance", etiket: "Taşıma sigortası sunuyorum", tur: "onay" },
    ],
  },
};

/** Virgülle ayrılmış metni diziye çevirir; boş parçalar atılır. */
function listeyeCevir(deger: string): string[] {
  return deger.split(",").map((p) => p.trim()).filter(Boolean);
}

const DIZI_ALANLARI = new Set(["specializations", "services", "serviceAreas", "vehicleTypes", "animalTypes"]);

export function HizmetKaydi({ tur }: { tur: HizmetTuru }) {
  const tanim = TANIMLAR[tur];
  const { user } = useAuth();
  const { toast } = useToast();
  const [acik, setAcik] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const rolVar = user?.role === tanim.rol || user?.role === "admin";

  // Doğrulama başvurusunun durumu, yalnızca rolü olmayan kullanıcı için.
  const { data: dogrulamalar = [] } = useQuery<any[]>({
    queryKey: ["/api/verify/status"],
    enabled: !!user && !rolVar,
  });

  const basvuru = Array.isArray(dogrulamalar)
    ? dogrulamalar.find((d) => d.professional_type === tanim.meslekTuru)
    : undefined;

  const kaydet = useMutation({
    mutationFn: async () => {
      const govde: Record<string, any> = {};
      for (const alan of tanim.alanlar) {
        const deger = form[alan.ad];
        if (deger === undefined || deger === "") continue;
        if (DIZI_ALANLARI.has(alan.ad)) govde[alan.ad] = listeyeCevir(String(deger));
        else govde[alan.ad] = deger;
      }
      return apiRequest("POST", tanim.uc, govde);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tanim.sorguAnahtari] });
      setAcik(false);
      setForm({});
      toast({ title: "Hizmetiniz yayınlandı", description: "Kaydınız bu sayfada listelenmeye başladı." });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Kaydedilemedi", description: e?.message || "Bir sorun oluştu." });
    },
  });

  const eksikZorunlu = tanim.alanlar
    .filter((a) => a.zorunlu)
    .some((a) => !String(form[a.ad] ?? "").trim());

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {tanim.baslik}
        </CardTitle>
        <CardDescription>{tanim.aciklama}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!user && (
          <>
            <p className="text-sm text-muted-foreground">
              {tanim.meslekAdi} olarak hizmet vermek için önce hesabınıza giriş yapın.
              Ardından belgelerinizi yükleyip doğrulama başvurusu yapabilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/giris${redirectQuery() || "?redirect=%2Fpanel%2Fdogrulama"}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş Yap
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/kayit?redirect=%2Fpanel%2Fdogrulama">Ücretsiz Kayıt Ol</Link>
              </Button>
            </div>
          </>
        )}

        {user && !rolVar && basvuru?.status === "pending" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{tanim.meslekAdi}</strong> doğrulama başvurunuz inceleniyor. Onaylandığında
              bildirim alacak ve hizmetinizi buradan yayınlayabileceksiniz.
            </AlertDescription>
          </Alert>
        )}

        {user && !rolVar && basvuru?.status !== "pending" && (
          <>
            <p className="text-sm text-muted-foreground">
              {basvuru?.status === "rejected"
                ? "Önceki doğrulama başvurunuz onaylanmadı. Belgelerinizi güncelleyip yeniden başvurabilirsiniz."
                : `${tanim.meslekAdi} olarak hizmet verebilmek için mesleki belgelerinizi doğrulatmanız gerekiyor. Bu, alıcıların güvenini korumak için zorunludur.`}
            </p>
            <Button asChild className="w-full sm:w-auto" data-testid={`button-verify-${tur}`}>
              <Link href="/panel/dogrulama">
                <FileCheck className="w-4 h-4 mr-2" />
                Doğrulama Başvurusu Yap
              </Link>
            </Button>
          </>
        )}

        {user && rolVar && (
          <>
            <p className="text-sm text-muted-foreground">
              Doğrulamanız tamam. Hizmet bilgilerinizi girin, kaydınız hemen yayına girsin.
            </p>
            <Button onClick={() => setAcik(true)} className="w-full sm:w-auto" data-testid={`button-create-${tur}`}>
              <Plus className="w-4 h-4 mr-2" />
              Hizmet Kaydı Oluştur
            </Button>
          </>
        )}
      </CardContent>

      <Dialog open={acik} onOpenChange={setAcik}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tanim.baslik}</DialogTitle>
            <DialogDescription>
              Zorunlu alanlar yıldızlıdır. Bilgileri sonradan güncelleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {tanim.alanlar.map((alan) =>
              alan.tur === "onay" ? (
                <div key={alan.ad} className="flex items-center gap-2">
                  <Checkbox
                    id={alan.ad}
                    checked={!!form[alan.ad]}
                    onCheckedChange={(v) => setForm((s) => ({ ...s, [alan.ad]: !!v }))}
                  />
                  <Label htmlFor={alan.ad} className="text-sm font-normal cursor-pointer">
                    {alan.etiket}
                  </Label>
                </div>
              ) : (
                <div key={alan.ad} className="space-y-1.5">
                  <Label htmlFor={alan.ad}>
                    {alan.etiket}
                    {alan.zorunlu && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    id={alan.ad}
                    type={alan.tur === "sayi" ? "number" : "text"}
                    inputMode={alan.tur === "sayi" ? "decimal" : undefined}
                    value={form[alan.ad] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [alan.ad]: e.target.value }))}
                    data-testid={`input-${alan.ad}`}
                  />
                  {alan.ipucu && <p className="text-xs text-muted-foreground">{alan.ipucu}</p>}
                </div>
              ),
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setAcik(false)} className="w-full sm:w-auto">
              Vazgeç
            </Button>
            <Button
              onClick={() => kaydet.mutate()}
              disabled={eksikZorunlu || kaydet.isPending}
              className="w-full sm:w-auto"
              data-testid="button-save-service"
            >
              {kaydet.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yayınla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
