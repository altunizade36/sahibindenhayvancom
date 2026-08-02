import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HizmetKaydi } from "@/components/services/hizmet-kaydi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Weight, 
  Search, 
  Plus,
  ArrowRight,
  Package,
  Clock,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

type TransportRequest = {
  id: string;
  user_id: string;
  animal_type: string;
  animal_count: number;
  animal_weight: string;
  origin_city: string;
  origin_district: string;
  origin_address: string;
  destination_city: string;
  destination_district: string;
  destination_address: string;
  preferred_date: string;
  flexible_date: boolean;
  special_requirements: string;
  status: string;
  estimated_distance: number;
  created_at: string;
  first_name: string;
  last_name: string;
  user_city: string;
};

const ANIMAL_TYPES = [
  "Büyükbaş",
  "Küçükbaş",
  "Kanatlı",
  "At",
  "Arı Kovanı",
  "Diğer",
];

const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Konya", "Antalya", "Adana",
  "Gaziantep", "Şanlıurfa", "Diyarbakır", "Kayseri", "Mersin", "Samsun",
  "Trabzon", "Erzurum", "Balıkesir", "Manisa", "Denizli", "Aydın", "Van"
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function TransportRequestCard({ request }: { request: TransportRequest }) {
  const isExample = request.user_id?.startsWith('demo-');
  return (
    <Card className="hover-elevate relative overflow-hidden" data-testid={`card-transport-${request.id}`}>
      {isExample && <ExampleListingBadge />}
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
              {request.status === 'pending' ? 'Teklif Bekliyor' : request.status}
            </Badge>
            {isExample && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">Örnek</Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDate(request.created_at)}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-medium">{request.animal_count} {request.animal_type}</span>
            <span className="text-sm text-muted-foreground">
              ({parseFloat(request.animal_weight).toLocaleString('tr-TR')} kg)
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>{request.origin_district}, {request.origin_city}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <MapPin className="w-4 h-4 text-red-600" />
            <span>{request.destination_district}, {request.destination_city}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(request.preferred_date)}</span>
              {request.flexible_date && <Badge variant="outline" className="text-xs">Esnek</Badge>}
            </div>
            {request.estimated_distance > 0 && (
              <div className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                <span>~{request.estimated_distance} km</span>
              </div>
            )}
          </div>
          
          {request.special_requirements && (
            <p className="text-sm text-muted-foreground border-t pt-2">
              {request.special_requirements}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1" data-testid={`button-quote-${request.id}`}>
            Teklif Ver
          </Button>
          <Button size="sm" variant="outline">
            Detay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateRequestForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    animalType: "",
    animalCount: 1,
    animalWeight: 0,
    originCity: "",
    originDistrict: "",
    originAddress: "",
    destinationCity: "",
    destinationDistrict: "",
    destinationAddress: "",
    preferredDate: "",
    flexibleDate: false,
    specialRequirements: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/transport/requests', data);
    },
    onSuccess: () => {
      toast({ title: "Talep Oluşturuldu", description: "Nakliye talebiniz yayınlandı." });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/transport/requests'] });
    },
    onError: () => {
      toast({ title: "Hata", description: "Talep oluşturulamadı.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hayvan Türü</Label>
          <Select value={formData.animalType} onValueChange={(v) => setFormData({...formData, animalType: v})}>
            <SelectTrigger data-testid="select-animal-type">
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              {ANIMAL_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Hayvan Sayısı</Label>
          <Input 
            type="number" 
            value={formData.animalCount}
            onChange={(e) => setFormData({...formData, animalCount: parseInt(e.target.value) || 1})}
            data-testid="input-animal-count"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Toplam Ağırlık (kg)</Label>
        <Input 
          type="number" 
          value={formData.animalWeight}
          onChange={(e) => setFormData({...formData, animalWeight: parseInt(e.target.value) || 0})}
          data-testid="input-animal-weight"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Yükleme Şehri</Label>
          <Select value={formData.originCity} onValueChange={(v) => setFormData({...formData, originCity: v})}>
            <SelectTrigger data-testid="select-origin-city">
              <SelectValue placeholder="Şehir Seçin" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Teslimat Şehri</Label>
          <Select value={formData.destinationCity} onValueChange={(v) => setFormData({...formData, destinationCity: v})}>
            <SelectTrigger data-testid="select-destination-city">
              <SelectValue placeholder="Şehir Seçin" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Tercih Edilen Tarih</Label>
        <Input 
          type="date" 
          value={formData.preferredDate}
          onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
          data-testid="input-preferred-date"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Özel Gereksinimler</Label>
        <Textarea 
          placeholder="Klimalı araç, sabah yükleme, vb..."
          value={formData.specialRequirements}
          onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
          data-testid="input-requirements"
        />
      </div>
      
      <Button 
        className="w-full" 
        onClick={() => createMutation.mutate(formData)}
        disabled={createMutation.isPending}
        data-testid="button-submit-request"
      >
        {createMutation.isPending ? "Oluşturuluyor..." : "Talep Oluştur"}
      </Button>
    </div>
  );
}

export default function TransportServices() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: requests, isLoading } = useQuery<TransportRequest[]>({
    queryKey: ["/api/transport/requests"],
  });

  // Fetch transport listings from listings table (includes example listings)
  const { data: transportListingsResponse } = useQuery<{ data: (Listing & { isExampleListing?: boolean })[] }>({
    queryKey: ["/api/listings", { categoryId: "cat-araclar-nakliye" }],
  });
  const transportListings = transportListingsResponse?.data || [];

  const filteredRequests = requests?.filter((req) =>
    searchQuery === "" ||
    req.origin_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.destination_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.animal_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-10 w-full max-w-md mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">
                  Hayvan Nakliye Hizmetleri
                </h1>
                <p className="text-muted-foreground">
                  Uber tarzı nakliye eşleştirme sistemi
                </p>
              </div>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-request">
                  <Plus className="w-4 h-4 mr-2" />
                  Nakliye Talebi Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Yeni Nakliye Talebi</DialogTitle>
                  <DialogDescription>
                    Hayvanlarınızı güvenle taşıtmak için talep oluşturun
                  </DialogDescription>
                </DialogHeader>
                <CreateRequestForm onClose={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Info alert about example listings and services */}
          <Alert className="mt-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm"> Hayvanınızı taşıtmak istiyorsanız <strong>"Nakliye Talebi Oluştur"</strong> ile talebinizi yayınlayın, nakliyeciler size teklif versin. Kendiniz taşımacılık hizmeti vermek istiyorsanız sayfanın altındaki <strong>"Nakliye hizmetinizi listeleyin"</strong> bölümünü kullanın.
            </AlertDescription>
          </Alert>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Şehir veya hayvan türü ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!filteredRequests || filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nakliye Talebi Bulunamadı</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Arama kriterlerinize uygun talep bulunamadı"
                  : "Henüz aktif nakliye talebi bulunmuyor"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                İlk Talebi Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <TransportRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}

        {/* Display transport listings from main listings table */}
        {transportListings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Nakliye İlanları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transportListings.map((listing) => (
                <Link key={listing.id} href={`/ilan/${listing.id}`}>
                  <Card 
                    className="hover-elevate overflow-visible relative cursor-pointer"
                    data-testid={`card-transport-listing-${listing.id}`}
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
          <CardContent className="py-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Talep Oluştur</h3>
                <p className="text-sm text-muted-foreground">
                  Nereden nereye, ne zaman taşınacağını belirtin
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Teklif Alın</h3>
                <p className="text-sm text-muted-foreground">
                  Nakliyecilerden fiyat teklifleri alın
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Güvenle Taşıyın</h3>
                <p className="text-sm text-muted-foreground">
                  En uygun teklifi seçin ve taşıma işlemini başlatın
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <HizmetKaydi tur="nakliye" />
      </div>
    </div>
  );
}
