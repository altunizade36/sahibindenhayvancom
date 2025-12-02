import { useQuery } from "@tanstack/react-query";
import { useCompare } from "@/contexts/compare-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GitCompare, 
  X, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Heart,
  CheckCircle,
  XCircle,
  Tag,
  Package,
  Shield,
  Scissors,
  FileText
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Listing } from "@shared/schema";
import { CHARACTER_TRAITS, HEALTH_STATUS_OPTIONS, AGE_CATEGORIES, GENDER_OPTIONS } from "@shared/listing-options";

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const [, navigate] = useLocation();

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings/compare", compareItems],
    queryFn: async () => {
      if (compareItems.length === 0) return [];
      const params = new URLSearchParams();
      compareItems.forEach(id => params.append('id', id));
      const response = await fetch(`/api/listings/compare?${params}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: compareItems.length > 0,
  });

  const getGenderLabel = (gender: string | null | undefined) => {
    if (!gender) return "-";
    const option = GENDER_OPTIONS.find(g => g.value === gender);
    return option?.label || gender;
  };

  const getAgeCategoryLabel = (ageCategory: string | null | undefined) => {
    if (!ageCategory) return "-";
    const option = AGE_CATEGORIES.find(a => a.value === ageCategory);
    return option?.label || ageCategory;
  };

  const getHealthStatusLabel = (healthStatus: string | null | undefined) => {
    if (!healthStatus) return "-";
    const option = HEALTH_STATUS_OPTIONS.find(h => h.value === healthStatus);
    return option?.label || healthStatus;
  };

  const getTraitLabels = (traits: string[] | null | undefined) => {
    if (!traits || traits.length === 0) return "-";
    return traits.map(t => {
      const trait = CHARACTER_TRAITS.find(ct => ct.value === t);
      return trait?.label || t;
    }).join(", ");
  };

  const compareRows = [
    { 
      label: "Fiyat", 
      icon: Tag,
      render: (listing: Listing) => (
        <span className="text-lg font-bold text-primary">
          {Number(listing.price).toLocaleString("tr-TR")} ₺
        </span>
      )
    },
    { 
      label: "Konum", 
      icon: MapPin,
      render: (listing: Listing) => `${listing.city}${listing.district ? `, ${listing.district}` : ''}`
    },
    { 
      label: "Irk/Tür", 
      icon: Package,
      render: (listing: Listing) => listing.breed || "-"
    },
    { 
      label: "Cinsiyet", 
      icon: Package,
      render: (listing: Listing) => getGenderLabel(listing.gender)
    },
    { 
      label: "Yaş", 
      icon: Calendar,
      render: (listing: Listing) => listing.age || getAgeCategoryLabel(listing.ageCategory)
    },
    { 
      label: "Sağlık Durumu", 
      icon: Shield,
      render: (listing: Listing) => getHealthStatusLabel(listing.healthStatus)
    },
    { 
      label: "Aşılı", 
      icon: Shield,
      render: (listing: Listing) => listing.vaccinated ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-muted-foreground" />
      )
    },
    { 
      label: "Kısırlaştırılmış", 
      icon: Scissors,
      render: (listing: Listing) => listing.neutered ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-muted-foreground" />
      )
    },
    { 
      label: "Soy Ağacı", 
      icon: FileText,
      render: (listing: Listing) => listing.pedigree ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-muted-foreground" />
      )
    },
    { 
      label: "Karakter", 
      icon: Heart,
      render: (listing: Listing) => getTraitLabels(listing.characterTraits)
    },
    { 
      label: "İlan Tarihi", 
      icon: Calendar,
      render: (listing: Listing) => format(new Date(listing.createdAt), "dd MMM yyyy", { locale: tr })
    },
    { 
      label: "Görüntülenme", 
      icon: Package,
      render: (listing: Listing) => listing.views?.toLocaleString("tr-TR") || "0"
    },
  ];

  if (compareItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompare className="w-12 h-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">Karşılaştırma Listesi Boş</h1>
            <p className="text-muted-foreground mb-4 text-center">
              İlanları karşılaştırmak için ilan kartlarındaki "Karşılaştır" butonunu kullanın
            </p>
            <Link href="/ilanlar">
              <Button data-testid="button-browse-listings-compare">İlanlara Göz At</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (compareItems.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompare className="w-12 h-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">En Az 2 İlan Gerekli</h1>
            <p className="text-muted-foreground mb-4 text-center">
              Karşılaştırma yapmak için en az 2 ilan seçmelisiniz
            </p>
            <Link href="/ilanlar">
              <Button data-testid="button-add-more-listings">Daha Fazla İlan Ekle</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary" />
            İlan Karşılaştırma
          </h1>
          <p className="text-sm text-muted-foreground">
            {listings.length} ilan karşılaştırılıyor
          </p>
        </div>
        <Button
          variant="outline"
          onClick={clearCompare}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          data-testid="button-clear-comparison"
        >
          Karşılaştırmayı Temizle
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${compareItems.length}, 1fr)` }}>
          {[...Array(10)].map((_, i) => (
            <>
              <Skeleton key={`label-${i}`} className="h-12" />
              {compareItems.map((_, j) => (
                <Skeleton key={`cell-${i}-${j}`} className="h-12" />
              ))}
            </>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-testid="table-compare">
            <thead>
              <tr>
                <th className="p-4 text-left bg-muted/50 rounded-tl-lg min-w-[180px]">Özellik</th>
                {listings.map((listing) => (
                  <th 
                    key={listing.id} 
                    className="p-4 text-center bg-muted/50 min-w-[220px] relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6"
                      onClick={() => removeFromCompare(listing.id)}
                      data-testid={`button-remove-${listing.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Link href={`/ilan/${listing.id}`}>
                      <div className="group cursor-pointer">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-32 h-32 mx-auto rounded-lg object-cover mb-2 group-hover:ring-2 ring-primary transition-shadow"
                          />
                        ) : (
                          <div className="w-32 h-32 mx-auto rounded-lg bg-muted flex items-center justify-center mb-2">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="font-medium text-sm truncate group-hover:text-primary">
                          {listing.title}
                        </p>
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row, index) => (
                <tr 
                  key={row.label} 
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <row.icon className="w-4 h-4 text-muted-foreground" />
                      {row.label}
                    </div>
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="p-4 text-center">
                      {typeof row.render(listing) === 'string' ? (
                        <span className="text-sm">{row.render(listing)}</span>
                      ) : (
                        <div className="flex justify-center">{row.render(listing)}</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Link href="/ilanlar">
          <Button variant="outline" data-testid="button-continue-browsing">
            Alışverişe Devam Et
          </Button>
        </Link>
      </div>
    </div>
  );
}
