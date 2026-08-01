import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Home, PawPrint, ArrowLeft, Store, Newspaper, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo-head";

/** Kullanıcıyı çıkmazda bırakmamak için sık gidilen bölümler */
const shortcuts = [
  { href: "/ilanlar", label: "Tüm İlanlar", icon: PawPrint },
  { href: "/magazalar", label: "Mağazalar", icon: Store },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/yardim", label: "Yardım Merkezi", icon: LifeBuoy },
];

export default function NotFound() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/ilanlar?q=${encodeURIComponent(q)}` : "/ilanlar");
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      {/* Bulunamayan sayfalar arama sonuçlarına girmemeli */}
      <SEOHead
        title="Sayfa Bulunamadı (404) | sahibindenhayvan.com"
        description="Aradığınız sayfa bulunamadı. İlanlara göz atabilir veya arama yapabilirsiniz."
        noIndex
      />

      <p className="text-7xl font-bold tracking-tight text-primary/20 md:text-8xl">404</p>

      <h1 className="mt-2 text-2xl font-bold md:text-3xl" data-testid="text-404-title">
        Aradığınız sayfayı bulamadık
      </h1>

      <p className="mt-3 max-w-md text-muted-foreground">
        Bağlantı taşınmış, silinmiş veya adres yanlış yazılmış olabilir.
        Aşağıdan arama yapabilir ya da bölümlere göz atabilirsiniz.
      </p>

      <form onSubmit={onSearch} className="mt-6 flex w-full max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hayvan, ırk veya şehir arayın"
            className="pl-9"
            aria-label="Site içinde ara"
            data-testid="input-404-search"
          />
        </div>
        <Button type="submit" data-testid="button-404-search">
          Ara
        </Button>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button variant="outline" size="sm" className="gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri dön
        </Button>
        <Link href="/">
          <Button className="gap-2" data-testid="button-404-home">
            <Home className="h-4 w-4" />
            Ana sayfa
          </Button>
        </Link>
      </div>
    </div>
  );
}
