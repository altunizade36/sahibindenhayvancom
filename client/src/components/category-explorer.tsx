/**
 * Ana sayfa kategori keşif şeridi.
 *
 * Ana sayfada kategori keşfi hiç yoktu; ziyaretçi ne tür hayvanlar olduğunu
 * görmek için arama yapmak veya menüyü kurcalamak zorundaydı. Bu bölüm 17 kök
 * kategoriyi ikonlu kartlarla, tek bakışta gösterir — sahibinden/Trendyol'daki
 * kategori girişi gibi. Mobilde de rahat (2 sütundan başlar).
 */
import { Link } from "wouter";
import {
  PawPrint, Tractor, Fish, Bird, Turtle, Squirrel, Wheat, Rabbit,
  ShoppingBag, Stethoscope, FileText, Store, Home, Truck, Factory, Building,
  Hexagon, Shapes, type LucideIcon,
} from "lucide-react";

type Kategori = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  parentId?: string | null;
  depth?: number | null;
};

// DB'deki icon adı → lucide bileşeni. Honeycomb bazı sürümlerde yok; Hexagon'a
// düşürülür. Bilinmeyen bir ad Shapes ile gösterilir (boş kalmaz).
const IKONLAR: Record<string, LucideIcon> = {
  PawPrint, Tractor, Fish, Bird, Turtle, Squirrel, Wheat,
  ShoppingBag, Stethoscope, FileText, Store, Home, Truck, Factory, Building,
  // lucide'de Horse ve Honeycomb yok — en yakın karşılıklara düşürülür.
  Horse: Rabbit,
  Honeycomb: Hexagon,
};

export function CategoryExplorer({ categories }: { categories: Kategori[] }) {
  const kokler = categories.filter((c) => !c.parentId || c.depth === 0);
  if (kokler.length === 0) return null;

  return (
    <section className="mb-4" aria-label="Kategoriler">
      <h2 className="text-lg md:text-xl font-bold mb-3">Kategoriler</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
        {kokler.map((kat) => {
          const Ikon = (kat.icon && IKONLAR[kat.icon]) || Shapes;
          return (
            <Link
              key={kat.id}
              href={`/kategori/${kat.slug}`}
              className="group flex items-center gap-2.5 rounded-lg border bg-card p-3 hover-elevate transition-colors min-h-11"
              data-testid={`category-explore-${kat.slug}`}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary group-hover:bg-primary/15">
                <Ikon className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium leading-tight line-clamp-2">{kat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
