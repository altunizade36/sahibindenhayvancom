import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Beef,
  Bird,
  Egg,
  Milk,
  Wheat,
  Droplets,
  MapPin,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

type MarketPrice = {
  id: string;
  type: string;
  category: string;
  city: string;
  price: string;
  unit: string;
  min_price: string | null;
  max_price: string | null;
  change_percent: string | null;
  source: string | null;
  date: string;
};

const PRICE_TYPES = [
  { value: "buyukbas", label: "Büyükbaş", icon: Beef },
  { value: "kucukbas", label: "Küçükbaş", icon: Beef },
  { value: "kanatli", label: "Kanatlı", icon: Bird },
  { value: "yem", label: "Yem/Mama", icon: Wheat },
  { value: "sut", label: "Süt", icon: Milk },
  { value: "et", label: "Et", icon: Beef },
  { value: "bal", label: "Bal", icon: Droplets },
  { value: "yumurta", label: "Yumurta", icon: Egg },
];

const CITIES = [
  "Tüm Türkiye",
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Konya",
  "Antalya",
  "Adana",
  "Gaziantep",
  "Şanlıurfa",
  "Diyarbakır",
  "Kayseri",
  "Mersin",
  "Samsun",
  "Trabzon",
  "Erzurum",
  "Balıkesir",
  "Manisa",
  "Denizli",
  "Aydın",
];

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function PriceChange({ change }: { change: string | null }) {
  if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
  
  const changeNum = parseFloat(change);
  if (changeNum > 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+%{changeNum.toFixed(2)}</span>
      </div>
    );
  } else if (changeNum < 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">%{changeNum.toFixed(2)}</span>
      </div>
    );
  }
  
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function PriceCard({ price }: { price: MarketPrice }) {
  return (
    <Card className="hover-elevate" data-testid={`price-card-${price.id}`}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">{price.category}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span>{price.city}</span>
            </div>
          </div>
          <PriceChange change={price.change_percent} />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{formatPrice(price.price)}</span>
            <span className="text-sm text-muted-foreground">/ {price.unit}</span>
          </div>
          
          {(price.min_price || price.max_price) && (
            <div className="text-sm text-muted-foreground">
              Aralık: {price.min_price ? formatPrice(price.min_price) : '-'} - {price.max_price ? formatPrice(price.max_price) : '-'}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(price.date)}</span>
            </div>
            {price.source && (
              <Badge variant="outline" className="text-xs">{price.source}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriceGrid({ prices, isLoading }: { prices: MarketPrice[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (prices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bu kategori için henüz fiyat verisi bulunmuyor.</p>
          <p className="text-sm text-muted-foreground mt-2">Yakında güncel piyasa bilgileri eklenecek.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prices.map((price) => (
        <PriceCard key={price.id} price={price} />
      ))}
    </div>
  );
}

export default function MarketPricesPage() {
  const [selectedType, setSelectedType] = useState<string>("buyukbas");
  const [selectedCity, setSelectedCity] = useState<string>("");
  
  const { data: prices = [], isLoading, refetch, isFetching } = useQuery<MarketPrice[]>({
    queryKey: ['/api/market-prices', selectedType, selectedCity],
  });
  
  const filteredPrices = prices.filter(p => {
    if (selectedType && p.type !== selectedType) return false;
    if (selectedCity && selectedCity !== "Tüm Türkiye" && !p.city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    return true;
  });
  
  const TypeIcon = PRICE_TYPES.find(t => t.value === selectedType)?.icon || Beef;
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
              Canlı Piyasa Fiyatları
            </h1>
            <p className="text-muted-foreground">
              Güncel hayvan ve tarım ürünleri piyasa fiyatları
            </p>
          </div>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TypeIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Fiyat Filtrele</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px]" data-testid="select-city">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs value={selectedType} onValueChange={setSelectedType} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto gap-1">
          {PRICE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger 
                key={type.value} 
                value={type.value}
                className="flex flex-col gap-1 py-2 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid={`tab-${type.value}`}
              >
                <Icon className="h-4 w-4" />
                <span>{type.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {PRICE_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value}>
            <PriceGrid prices={filteredPrices} isLoading={isLoading} />
          </TabsContent>
        ))}
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Bilgilendirme</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Bu sayfada yer alan fiyatlar, Türkiye genelindeki hal ve pazarlardan derlenen ortalama değerlerdir.
          </p>
          <p>
            Fiyatlar piyasa koşullarına göre günlük değişiklik gösterebilir. Kesin fiyat bilgisi için satıcılarla iletişime geçmenizi öneririz.
          </p>
          <p className="text-xs">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
