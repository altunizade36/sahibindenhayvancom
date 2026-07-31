import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Store, 
  ShoppingCart, 
  MapPin, 
  Phone,
  Truck,
  CheckCircle,
  Eye,
  Search,
  Filter,
  Plus,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import type { Listing } from "@shared/schema";

// Yellow diagonal stripe component for example listings
function ExampleListingBadge() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      data-testid="example-listing-overlay"
    >
      <div 
        className="absolute -right-8 top-4 rotate-45 bg-yellow-500 text-black text-[10px] font-bold py-0.5 px-8 shadow-md"
        style={{ transform: 'rotate(45deg)', transformOrigin: 'center' }}
      >
        ÖRNEK İLAN
      </div>
    </div>
  );
}

type B2BListing = {
  id: string;
  seller_id: string;
  store_id: string | null;
  title: string;
  description: string | null;
  category: string;
  brand: string | null;
  unit: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: string;
  bulk_discounts: any[];
  available_stock: number | null;
  images: string[];
  specifications: Record<string, any>;
  delivery_options: any[];
  status: string;
  view_count: number;
  order_count: number;
  first_name: string;
  last_name: string;
  seller_city: string;
  store_name: string | null;
  store_logo: string | null;
  store_verified: string | null;
};

const CATEGORIES = [
  "Tümü",
  "Büyükbaş Yemi",
  "Küçükbaş Yemi",
  "Kanatlı Yemi",
  "Balık Yemi",
  "Kuru Ot/Saman",
  "Silaj",
  "Kepek/Küspe",
  "Vitamin/Mineral",
  "Tarım Ürünleri",
];

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(numPrice);
}

function B2BListingCard({ listing }: { listing: B2BListing }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [quantity, setQuantity] = useState(listing.min_quantity);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  
  const orderMutation = useMutation({
    mutationFn: async (data: { listingId: string; quantity: number; deliveryAddress: string; deliveryCity: string }) => {
      return apiRequest('/api/b2b/orders', 'POST', data);
    },
    onSuccess: () => {
      toast({ title: "Sipariş Oluşturuldu", description: "Siparişiniz satıcıya iletildi." });
      setShowOrderDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/b2b/my-orders'] });
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
      listingId: listing.id,
      quantity,
      deliveryAddress,
      deliveryCity,
    });
  };
  
  const calculatedPrice = parseFloat(listing.price_per_unit) * quantity;
  
  const isExample = listing.seller_id?.startsWith('demo-');
  
  return (
    <Card className="hover-elevate relative overflow-hidden" data-testid={`b2b-listing-${listing.id}`}>
      {isExample && <ExampleListingBadge />}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">{listing.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{listing.category}</Badge>
              {isExample && (
                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">Örnek İlan</Badge>
              )}
            </CardDescription>
          </div>
          {listing.store_verified && (
            <Badge className="bg-green-100 text-green-800 shrink-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Onaylı
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-primary">{formatPrice(listing.price_per_unit)}</span>
          <span className="text-sm text-muted-foreground">/ {listing.unit}</span>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Min. sipariş: {listing.min_quantity} {listing.unit}</span>
          </div>
          {listing.available_stock && (
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              <span>Stok: {listing.available_stock} {listing.unit}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{listing.seller_city}</span>
          </div>
        </div>
        
        {listing.store_name && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {listing.store_logo ? (
              <img src={listing.store_logo} alt={listing.store_name} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{listing.store_name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{listing.view_count} görüntülenme</span>
          <span>•</span>
          <span>{listing.order_count} sipariş</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid={`button-order-${listing.id}`}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sipariş Ver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sipariş Oluştur</DialogTitle>
              <DialogDescription>{listing.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Miktar ({listing.unit})</Label>
                <Input 
                  type="number" 
                  min={listing.min_quantity}
                  max={listing.max_quantity || undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || listing.min_quantity)}
                  data-testid="input-quantity"
                />
                <p className="text-sm text-muted-foreground">
                  Min: {listing.min_quantity} {listing.max_quantity && `- Max: ${listing.max_quantity}`}
                </p>
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
                disabled={orderMutation.isPending || quantity < listing.min_quantity || !deliveryCity}
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

export default function B2BMarketplacePage() {
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("");
  
  const { data: listings = [], isLoading } = useQuery<B2BListing[]>({
    queryKey: ['/api/b2b/listings', category, city],
  });

  // Fetch B2B/feed listings from listings table (includes example listings)
  const { data: b2bListingsResponse } = useQuery<{ data: (Listing & { isExampleListing?: boolean })[] }>({
    queryKey: ["/api/listings", { categoryId: "cat-besi-yemi" }],
  });
  const b2bListings = b2bListingsResponse?.data || [];
  
  const filteredListings = listings.filter(l => {
    if (category && category !== "Tümü" && !l.category.toLowerCase().includes(category.toLowerCase())) return false;
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                B2B Yem/Mama Pazaryeri
              </h1>
              <p className="text-muted-foreground">
                Toptan yem, mama ve tarım ürünleri pazaryeri
              </p>
            </div>
          </div>
          <Link href="/ilan-ver?category=yem-mama-tarim">
            <Button className="gap-2" data-testid="button-add-b2b-listing">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Toptan İlan Ver</span>
              <span className="sm:hidden">İlan Ver</span>
            </Button>
          </Link>
        </div>
        
        {/* Info alert about example listings */}
        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm">
            Sarı şeritli ilanlar örnek içeriktir. Toptan satıcı olarak ürün sunmak için <strong>"Toptan İlan Ver"</strong> butonuna tıklayarak kendi ilanınızı oluşturabilirsiniz.
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz ürün bulunmuyor.</p>
            <p className="text-sm text-muted-foreground mt-2">Yeni ürünler eklendiğinde burada görünecek.</p>
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
          {filteredListings.map(listing => (
            <B2BListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      
      {/* Display B2B listings from main listings table */}
      {b2bListings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Yem & Yiyecek İlanları</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {b2bListings.map((listing) => (
              <Link key={listing.id} href={`/ilan/${listing.id}`}>
                <Card 
                  className="hover-elevate overflow-visible relative cursor-pointer"
                  data-testid={`card-b2b-listing-${listing.id}`}
                >
                  {listing.isExampleListing && <ExampleListingBadge />}
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img 
                      src={listing.images?.[0] || '/placeholder-image.jpg'} 
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <CardTitle className="text-base line-clamp-2 mb-2">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.district}, {listing.city}</span>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {typeof listing.price === 'number' || typeof listing.price === 'string' 
                        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(listing.price))
                        : 'Fiyat Belirtilmemiş'}
                    </div>
                    {listing.isExampleListing && (
                      <Badge variant="outline" className="mt-2 text-xs text-yellow-600 border-yellow-400">
                        Örnek İlan
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Toptan Alıcı mısınız?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            B2B pazaryerimiz üzerinden onaylı satıcılardan toptan alım yapabilir, 
            miktar indirimleri ile tasarruf edebilirsiniz.
          </p>
          <p className="mt-2">
            Ürün satmak için mağaza hesabı oluşturmanız gerekmektedir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
