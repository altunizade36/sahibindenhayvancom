import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Phone, Mail, Search, Clock, Shield, Stethoscope } from "lucide-react";

type VetService = {
  id: string;
  vetId: string;
  clinicName: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  specializations: string[];
  services: string[];
  workingHours: string;
  emergencyService: boolean;
  rating: string;
  totalReviews: number;
  verified: boolean;
  createdAt: string;
};

export default function VetServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const { data: vetServices, isLoading } = useQuery<VetService[]>({
    queryKey: ["/api/vet-services"],
  });

  const cities = [...new Set(vetServices?.map(v => v.city) || [])];

  const filteredServices = vetServices?.filter((service) => {
    const matchesSearch = searchQuery === "" ||
      service.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = selectedCity === "" || service.city === selectedCity;
    return matchesSearch && matchesCity;
  });

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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Veteriner Hizmetleri</h1>
              <p className="text-muted-foreground">
                Güvenilir veteriner klinikleri ve hekimler
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Klinik veya uzmanlık alanı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-vet"
                />
              </div>
              <select 
                className="border rounded-md px-3 py-2 bg-background text-foreground"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                data-testid="select-city"
              >
                <option value="">Tüm Şehirler</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {!filteredServices || filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Veteriner Bulunamadı</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Arama kriterlerinize uygun veteriner bulunamadı"
                  : "Henüz kayıtlı veteriner bulunmuyor"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="hover-elevate overflow-hidden"
                data-testid={`card-vet-${service.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 bg-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {service.clinicName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">
                          {service.clinicName}
                        </CardTitle>
                        {service.verified && (
                          <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{parseFloat(service.rating).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({service.totalReviews} değerlendirme)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{service.district}, {service.city}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{service.workingHours}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {service.specializations.slice(0, 3).map((spec, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {service.specializations.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.specializations.length - 3}
                      </Badge>
                    )}
                  </div>

                  {service.emergencyService && (
                    <Badge variant="destructive" className="text-xs">
                      7/24 Acil Hizmet
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.location.href = `tel:${service.phone}`}
                      data-testid={`button-call-${service.id}`}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Ara
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = `mailto:${service.email}`}
                      data-testid={`button-email-${service.id}`}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p>Veteriner olarak platformumuza katılmak ister misiniz?</p>
            <Button variant="link" className="mt-2">
              Veteriner Kaydı Oluştur
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
