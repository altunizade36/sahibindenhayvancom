import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Milk, 
  Store, 
  ShoppingCart, 
  MapPin, 
  CheckCircle,
  Award,
  Star,
  Search,
  Filter,
  Plus,
  Truck,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";

type WholesaleProduct = {
  id: string;
  seller_id: string;
  store_id: string | null;
  product_type: string;
  title: string;
  description: string | null;
  origin: string | null;
  unit: string;
  min_order: number;
  price_per_unit: string;
  bulk_pricing: any[];
  available_quantity: number | null;
  images: string[];
  certifications: any[];
  is_certified: boolean;
  delivery_zones: any[];
  status: string;
  order_count: number;
  rating: string;
  review_count: number;
  first_name: string;
  last_name: string;
  seller_city: string;
  store_name: string | null;
  store_logo: string | null;
};

const PRODUCT_TYPES = [
  "Tümü",
  "Çiğ Süt",
  "Pastörize Süt",
  "Yoğurt",
  "Peynir",
  "Tereyağı",
  "Kaymak",
  "Ayran",
  "Lor/Çökelek",
  "Süzme Yoğurt",
  "Keçi Sütü",
  "Koyun Sütü",
  "Manda Sütü",
];

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(numPrice);
}

function ProductCard({ product }: { product: WholesaleProduct }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [quantity, setQuantity] = useState(product.min_order);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  
  const orderMutation = useMutation({
    mutationFn: async (data: { productId: string; quantity: number; deliveryAddress: string; deliveryCity: string }) => {
      return apiRequest('/api/wholesale/orders', 'POST', data);
    },
    onSuccess: () => {
      toast({ title: "Sipariş Oluşturuldu", description: "Siparişiniz üreticiye iletildi." });
      setShowOrderDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/wholesale/my-orders'] });
    },
    onError: () => {
      toast({ title: "Hata", description: "Sipariş oluşturulamadı.", variant: "destructive" });
    },
  });
  
  const handleOrder = () => {
    if (!user) {
      toast({ title: "Giriş Gerekli", description: "Sipariş vermek için giriş yapmalısınız.", variant: "destructive" });
      return;
    }
    orderMutation.mutate({
      productId: product.id,
      quantity,
      deliveryAddress,
      deliveryCity,
    });
  };
  
  const calculatedPrice = parseFloat(product.price_per_unit) * quantity;
  const rating = product.rating ? parseFloat(product.rating) : 0;
  
  return (
    <Card className="hover-elevate" data-testid={`wholesale-product-${product.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">{product.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{product.product_type}</Badge>
              {product.origin && (
                <span className="text-xs text-muted-foreground">{product.origin}</span>
              )}
            </CardDescription>
          </div>
          {product.is_certified && (
            <Badge className="bg-amber-100 text-amber-800 shrink-0">
              <Award className="h-3 w-3 mr-1" />
              Sertifikalı
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-primary">{formatPrice(product.price_per_unit)}</span>
          <span className="text-sm text-muted-foreground">/ {product.unit}</span>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            <span>Min. sipariş: {product.min_order} {product.unit}</span>
          </div>
          {product.available_quantity && (
            <div className="flex items-center gap-1">
              <Milk className="h-3 w-3" />
              <span>Stok: {product.available_quantity} {product.unit}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{product.seller_city}</span>
          </div>
        </div>
        
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.review_count} değerlendirme)</span>
          </div>
        )}
        
        {product.store_name && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {product.store_logo ? (
              <img src={product.store_logo} alt={product.store_name} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{product.store_name}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid={`button-order-${product.id}`}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Toptan Al
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Toptan Sipariş</DialogTitle>
              <DialogDescription>{product.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Miktar ({product.unit})</Label>
                <Input 
                  type="number" 
                  min={product.min_order}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || product.min_order)}
                  data-testid="input-quantity"
                />
                <p className="text-sm text-muted-foreground">Minimum: {product.min_order} {product.unit}</p>
              </div>
              <div className="space-y-2">
                <Label>Teslimat Şehri</Label>
                <Input 
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="Şehir"
                  data-testid="input-delivery-city"
                />
              </div>
              <div className="space-y-2">
                <Label>Teslimat Adresi</Label>
                <Textarea 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Tam adres"
                  data-testid="input-delivery-address"
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Toplam Tutar:</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(calculatedPrice)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderDialog(false)}>İptal</Button>
              <Button 
                onClick={handleOrder}
                disabled={orderMutation.isPending || quantity < product.min_order || !deliveryCity || !deliveryAddress}
                data-testid="button-confirm-order"
              >
                {orderMutation.isPending ? "Gönderiliyor..." : "Siparişi Onayla"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

export default function WholesaleDairyPage() {
  const [productType, setProductType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [city, setCity] = useState("");
  
  const { data: products = [], isLoading } = useQuery<WholesaleProduct[]>({
    queryKey: ['/api/wholesale/products', productType !== "Tümü" ? productType : "", certifiedOnly ? "true" : "", city],
  });
  
  const filteredProducts = products.filter(p => {
    if (productType && productType !== "Tümü" && !p.product_type.toLowerCase().includes(productType.toLowerCase())) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (certifiedOnly && !p.is_certified) return false;
    return true;
  });
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Milk className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                Toptan Süt & Mandıra Pazaryeri
              </h1>
              <p className="text-muted-foreground">
                Üreticiden doğrudan toptan süt ve süt ürünleri
              </p>
            </div>
          </div>
          <Link href="/ilan-ver?category=sut-mandira">
            <Button className="gap-2" data-testid="button-add-dairy-listing">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Süt İlanı Ver</span>
              <span className="sm:hidden">İlan Ver</span>
            </Button>
          </Link>
        </div>
        
        {/* Info alert about example listings */}
        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm">
            Sarı şeritli ilanlar örnek içeriktir. Üretici olarak süt ve süt ürünleri satmak için <strong>"Süt İlanı Ver"</strong> butonuna tıklayarak kendi ilanınızı oluşturabilirsiniz.
          </AlertDescription>
        </Alert>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Ürün ara..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-product-type">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ürün Tipi" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Şehir" 
              className="w-full md:w-[150px]"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              data-testid="input-city-filter"
            />
            <Button 
              variant={certifiedOnly ? "default" : "outline"}
              onClick={() => setCertifiedOnly(!certifiedOnly)}
              className="shrink-0"
              data-testid="button-certified-filter"
            >
              <Award className="h-4 w-4 mr-2" />
              Sertifikalı
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Milk className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz ürün bulunmuyor.</p>
            <p className="text-sm text-muted-foreground mt-2">Üreticiler ürün eklediğinde burada görünecek.</p>
            <Link href="/panel">
              <Button className="mt-4" data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Sertifikalı Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Sertifikalı ürünler, gıda güvenliği standartlarına uygun üretim yapan 
              ve gerekli izin belgelerine sahip işletmelerin ürünleridir.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Toptan Teslimat
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Siparişleriniz soğuk zincir korunarak teslimat bölgelerine göre 
              1-3 iş günü içinde ulaştırılır.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
