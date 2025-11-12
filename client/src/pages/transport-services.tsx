import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, MapPin, Phone, Mail, Search, Star } from "lucide-react";

type TransportService = {
  id: string;
  transporterId: string;
  transporter: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    city: string | null;
    district: string | null;
  };
  companyName: string;
  vehicleType: string;
  capacity: string;
  servicedCities: string[];
  description: string;
  pricing: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
};

export default function TransportServices() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: transportServices, isLoading } = useQuery<TransportService[]>({
    queryKey: ["/api/transport-services"],
  });

  const filteredServices = transportServices?.filter(
    (service) =>
      searchQuery === "" ||
      service.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.transporter.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.servicedCities.some((city) =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-10 w-full max-w-md mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
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
          <h1 className="text-3xl font-bold mb-2">Hayvan Taşıma Hizmetleri</h1>
          <p className="text-muted-foreground">
            Güvenilir taşıma hizmetleriyle hayvanınızı güvenle ulaştırın
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Firma, araç tipi veya şehir ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-transport"
            />
          </div>
        </div>

        {!filteredServices || filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Taşıma Servisi Bulunamadı</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Arama kriterlerinize uygun taşıma servisi bulunamadı"
                  : "Henüz kayıtlı taşıma servisi bulunmuyor"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="hover-elevate overflow-hidden"
                data-testid={`card-transport-${service.id}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={service.transporter.avatar || undefined} />
                      <AvatarFallback>
                        <Truck className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 truncate">
                        {service.companyName}
                      </CardTitle>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{service.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({service.reviewCount} değerlendirme)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{service.vehicleType}</Badge>
                    <Badge variant="outline">{service.capacity}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {service.description}
                  </p>

                  {service.servicedCities && service.servicedCities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Hizmet Verilen Şehirler</h4>
                      <div className="flex flex-wrap gap-1">
                        {service.servicedCities.slice(0, 4).map((city, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                        {service.servicedCities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.servicedCities.length - 4} daha
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-semibold mb-1">Fiyatlandırma</div>
                    <div className="text-sm text-muted-foreground">{service.pricing}</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {service.transporter.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{service.transporter.phone}</span>
                      </div>
                    )}
                    {service.transporter.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {service.transporter.city}
                          {service.transporter.district && `, ${service.transporter.district}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full" data-testid={`button-contact-transport-${service.id}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Teklif Al
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
