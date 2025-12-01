import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, TrendingDown, TrendingUp, Minus } from "lucide-react";

const offerSchema = z.object({
  amount: z.string().min(1, "Teklif tutarı gerekli"),
  message: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface MakeOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  sellerId: string;
}

export function MakeOfferModal({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  listingPrice,
  sellerId: _sellerId,
}: MakeOfferModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [offerAmount, setOfferAmount] = useState("");
  
  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      amount: "",
      message: "",
    },
  });
  
  const createOfferMutation = useMutation({
    mutationFn: async (data: OfferFormData) => {
      return apiRequest("POST", "/api/offers", {
        listingId,
        amount: parseFloat(data.amount),
        message: data.message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Teklif gönderildi",
        description: "Teklifiniz satıcıya iletildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", listingId, "offers"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Teklif gönderilemedi",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: OfferFormData) => {
    createOfferMutation.mutate(data);
  };
  
  const price = parseFloat(listingPrice);
  const offer = parseFloat(offerAmount) || 0;
  const difference = offer - price;
  const percentDiff = price > 0 ? ((difference / price) * 100).toFixed(1) : 0;
  
  const suggestedOffers = [
    { label: "%10 düşük", value: (price * 0.9).toFixed(0) },
    { label: "%5 düşük", value: (price * 0.95).toFixed(0) },
    { label: "Liste fiyatı", value: price.toFixed(0) },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teklif Ver</DialogTitle>
          <DialogDescription>
            {listingTitle} için teklifinizi girin
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Liste Fiyatı</Label>
            <div className="text-2xl font-bold text-primary">
              {parseFloat(listingPrice).toLocaleString("tr-TR")} TL
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Teklif Tutarı (TL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Teklifinizi girin"
              {...form.register("amount")}
              onChange={(e) => {
                form.setValue("amount", e.target.value);
                setOfferAmount(e.target.value);
              }}
              data-testid="input-offer-amount"
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
            
            {offer > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {difference < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : difference > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
                <span className={difference < 0 ? "text-green-600" : difference > 0 ? "text-red-600" : "text-gray-600"}>
                  {difference < 0 ? "" : "+"}{difference.toLocaleString("tr-TR")} TL ({percentDiff}%)
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {suggestedOffers.map((suggestion) => (
              <Button
                key={suggestion.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("amount", suggestion.value);
                  setOfferAmount(suggestion.value);
                }}
                data-testid={`button-suggestion-${suggestion.label}`}
              >
                {suggestion.label}: {parseInt(suggestion.value).toLocaleString("tr-TR")} TL
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj (Opsiyonel)</Label>
            <Textarea
              id="message"
              placeholder="Satıcıya bir mesaj ekleyin..."
              {...form.register("message")}
              data-testid="input-offer-message"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-offer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={createOfferMutation.isPending}
              data-testid="button-submit-offer"
            >
              {createOfferMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Teklif Gönder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
