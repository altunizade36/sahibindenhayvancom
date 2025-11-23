import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

interface SearchBarProps {
  onSearch?: (query: string, category?: string) => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export function SearchBar({ onSearch, categories = [] }: SearchBarProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch(query, category === "all" ? undefined : category);
    } else {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (category && category !== "all") params.set("category", category);
      setLocation(`/ilanlar?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-4xl">
      <div className="flex-1 flex flex-col sm:flex-row gap-2">
        <Input
          type="search"
          placeholder="Hayvan ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 h-11"
          data-testid="input-search"
        />
        {categories.length > 0 && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48 h-11" data-testid="select-category">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button type="submit" className="h-11" data-testid="button-search">
        <Search className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Ara</span>
      </Button>
    </form>
  );
}
