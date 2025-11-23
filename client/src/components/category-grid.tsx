import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PawPrint,
  Tractor,
  Bird,
  Fish,
  type LucideIcon,
} from "lucide-react";
import { GiHorseHead, GiHoneycomb } from "react-icons/gi";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface CategoryStats {
  categoryId: string;
  count: number;
}

interface CategoryGridProps {
  categories: Category[];
  stats?: CategoryStats[];
}

const iconMap: Record<string, LucideIcon | any> = {
  PawPrint,
  Tractor,
  Bird,
  Fish,
  Horse: GiHorseHead,
  Honeycomb: GiHoneycomb,
};

export function CategoryGrid({ categories, stats }: CategoryGridProps) {
  const getCategoryCount = (categoryId: string) => {
    const stat = stats?.find(s => s.categoryId === categoryId);
    return stat ? stat.count : 0;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const Icon = category.icon ? iconMap[category.icon] : PawPrint;
        const count = getCategoryCount(category.id);
        
        return (
          <Link key={category.id} href={`/kategori/${category.slug}`}>
            <Card className="hover-elevate active-elevate-2 cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                {Icon && <Icon className="w-12 h-12 mb-3 text-primary" />}
                <h3 className="font-semibold" data-testid={`text-category-${category.slug}`}>
                  {category.name}
                </h3>
                {stats && (
                  <Badge variant="secondary" className="mt-2" data-testid={`badge-count-${category.slug}`}>
                    {count} ilan
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
