import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
  icon?: string;
}

interface CategoryGridProps {
  categories: Category[];
}

const iconMap: Record<string, LucideIcon | any> = {
  PawPrint,
  Tractor,
  Bird,
  Fish,
  Horse: GiHorseHead,
  Honeycomb: GiHoneycomb,
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((category) => {
        const Icon = category.icon ? iconMap[category.icon] : PawPrint;
        
        return (
          <Link key={category.id} href={`/kategori/${category.slug}`}>
            <Card className="hover-elevate active-elevate-2 cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                {Icon && <Icon className="w-12 h-12 mb-3 text-primary" />}
                <h3 className="font-semibold" data-testid={`text-category-${category.slug}`}>
                  {category.name}
                </h3>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
