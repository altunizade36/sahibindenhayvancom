import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Flag } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedType: "listing" | "user" | "store" | "message";
  reportedId: string;
  reportedTitle?: string;
}

const reportTypes = [
  { value: "spam", label: "Spam / İstenmeyen İçerik" },
  { value: "fraud", label: "Dolandırıcılık / Sahte" },
  { value: "inappropriate", label: "Uygunsuz İçerik" },
  { value: "fake_listing", label: "Sahte İlan" },
  { value: "harassment", label: "Taciz / Hakaret" },
  { value: "copyright", label: "Telif Hakkı İhlali" },
  { value: "other", label: "Diğer" },
];

const reportTypeLabels: Record<string, string> = {
  listing: "İlan",
  user: "Kullanıcı",
  store: "Mağaza",
  message: "Mesaj",
};

export function ReportDialog({
  open,
  onOpenChange,
  reportedType,
  reportedId,
  reportedTitle,
}: ReportDialogProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");
  const [reason, setReason] = useState("");

  const reportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/reports", {
        reportedType,
        reportedId,
        type: selectedType,
        reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Şikayet gönderildi",
        description: "Şikayetiniz incelenmek üzere gönderildi. Teşekkürler!",
      });
      onOpenChange(false);
      setSelectedType("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/reports/my"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Şikayet gönderilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedType) {
      toast({
        title: "Şikayet türü seçin",
        description: "Lütfen bir şikayet türü seçin.",
        variant: "destructive",
      });
      return;
    }
    if (!reason.trim()) {
      toast({
        title: "Açıklama gerekli",
        description: "Lütfen şikayetinizi açıklayın.",
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            {reportTypeLabels[reportedType]} Şikayet Et
          </DialogTitle>
          <DialogDescription>
            {reportedTitle
              ? `"${reportedTitle}" hakkında şikayet bildir`
              : "Bu içerik hakkında şikayet bildir"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Şikayet Türü</Label>
            <RadioGroup value={selectedType} onValueChange={setSelectedType}>
              {reportTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Açıklama</Label>
            <Textarea
              id="reason"
              placeholder="Şikayetinizi detaylı bir şekilde açıklayın..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              data-testid="input-report-reason"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-report"
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reportMutation.isPending || !selectedType || !reason.trim()}
            data-testid="button-submit-report"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Şikayeti Gönder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
