import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { Transaction } from "@shared/schema";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

function CheckoutForm({ amount, onSuccess }: { amount: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/wallet`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Ödeme Başarısız",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ödeme Başarılı",
          description: `₺${amount} cüzdanınıza eklendi`,
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Hata",
        description: "Ödeme işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-payment">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full" data-testid="button-confirm-payment">
        {loading ? "İşleniyor..." : `₺${amount} Yükle`}
      </Button>
    </form>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: balanceData } = useQuery<{ balance: string }>({
    queryKey: ["/api/wallet/balance"],
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/transactions"],
    enabled: !!user,
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("/api/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Para yükleme işlemi başlatılamadı",
        variant: "destructive",
      });
    },
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Geçersiz Tutar",
        description: "Lütfen geçerli bir tutar girin",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(depositAmount);
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setDepositAmount("");
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Cüzdanınızı görüntülemek için giriş yapın</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Cüzdan
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <Card data-testid="card-balance">
          <CardHeader>
            <CardTitle>Bakiye</CardTitle>
            <CardDescription>Mevcut cüzdan bakiyeniz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary" data-testid="text-balance">
              ₺{parseFloat(balanceData?.balance || "0").toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Deposit Card */}
        <Card data-testid="card-deposit">
          <CardHeader>
            <CardTitle>Para Yükle</CardTitle>
            <CardDescription>Cüzdanınıza para ekleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!STRIPE_PUBLIC_KEY ? (
              <div className="text-center text-muted-foreground py-6">
                <p>Stripe ödeme sistemi henüz yapılandırılmamış.</p>
                <p className="text-sm mt-2">Lütfen yönetici ile iletişime geçin.</p>
              </div>
            ) : !clientSecret ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Tutar (₺)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="10"
                    max="10000"
                    placeholder="100.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    data-testid="input-deposit-amount"
                  />
                  <p className="text-xs text-muted-foreground">Minimum ₺10, maksimum ₺10,000</p>
                </div>
                <Button 
                  onClick={handleDeposit} 
                  disabled={depositMutation.isPending} 
                  className="w-full"
                  data-testid="button-deposit"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {depositMutation.isPending ? "Hazırlanıyor..." : "Ödeme Yap"}
                </Button>
              </>
            ) : (
              <Elements stripe={stripePromise!} options={{ clientSecret }}>
                <CheckoutForm amount={depositAmount} onSuccess={handlePaymentSuccess} />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card data-testid="card-transactions">
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
          <CardDescription>Son cüzdan işlemleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Henüz işlem yok
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === "deposit" || tx.type === "refund" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {tx.type === "deposit" && "Para Yükleme"}
                        {tx.type === "listing_fee" && "İlan Ücreti"}
                        {tx.type === "auction_fee" && "Açık Artırma Ücreti"}
                        {tx.type === "withdrawal" && "Para Çekme"}
                        {tx.type === "refund" && "İade"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={tx.type === "deposit" || tx.type === "refund" ? "text-green-600" : "text-red-600"}>
                        {tx.type === "deposit" || tx.type === "refund" ? "+" : "-"}₺{parseFloat(tx.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                        data-testid={`badge-status-${tx.status}`}
                      >
                        {tx.status === "completed" && "Tamamlandı"}
                        {tx.status === "pending" && "Beklemede"}
                        {tx.status === "failed" && "Başarısız"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
