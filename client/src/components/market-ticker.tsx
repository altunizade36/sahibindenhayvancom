import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, DollarSign, Euro, Beef, Milk } from "lucide-react";
import { GiCow, GiSheep, GiChicken, GiWheat } from "react-icons/gi";
import { cn } from "@/lib/utils";

interface MarketPrice {
  id: string;
  name: string;
  nameShort: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
  icon: "cattle" | "sheep" | "chicken" | "beef" | "dairy" | "feed" | "usd" | "eur";
  category: "livestock" | "meat" | "dairy" | "currency" | "feed";
}

const marketData: MarketPrice[] = [
  { id: "buyukbas", name: "Büyükbaş (Canlı)", nameShort: "Büyükbaş", price: 300.38, unit: "₺/kg", change: 52.38, changePercent: 21.0, icon: "cattle", category: "livestock" },
  { id: "kucukbas", name: "Küçükbaş (Canlı)", nameShort: "Küçükbaş", price: 307.52, unit: "₺/kg", change: 63.52, changePercent: 25.9, icon: "sheep", category: "livestock" },
  { id: "tavuk-canli", name: "Tavuk (Canlı)", nameShort: "Tavuk", price: 92.50, unit: "₺/kg", change: 12.50, changePercent: 15.6, icon: "chicken", category: "livestock" },
  { id: "dana-karkas", name: "Dana Karkas", nameShort: "Dana", price: 425.00, unit: "₺/kg", change: 45.00, changePercent: 11.8, icon: "beef", category: "meat" },
  { id: "dana-kiyma", name: "Dana Kıyma", nameShort: "Kıyma", price: 675.00, unit: "₺/kg", change: 55.00, changePercent: 8.9, icon: "beef", category: "meat" },
  { id: "kuzu-karkas", name: "Kuzu Karkas", nameShort: "Kuzu", price: 525.00, unit: "₺/kg", change: 75.00, changePercent: 16.7, icon: "sheep", category: "meat" },
  { id: "tavuk-butun", name: "Bütün Tavuk", nameShort: "B.Tavuk", price: 92.50, unit: "₺/kg", change: 8.50, changePercent: 10.1, icon: "chicken", category: "meat" },
  { id: "cig-sut", name: "Çiğ Süt", nameShort: "Süt", price: 23.52, unit: "₺/lt", change: 0.42, changePercent: 1.8, icon: "dairy", category: "dairy" },
  { id: "tereyagi", name: "Tereyağı", nameShort: "Tereyağı", price: 435.00, unit: "₺/kg", change: 86.00, changePercent: 24.6, icon: "dairy", category: "dairy" },
  { id: "beyaz-peynir", name: "Beyaz Peynir", nameShort: "Peynir", price: 285.00, unit: "₺/kg", change: 31.50, changePercent: 12.4, icon: "dairy", category: "dairy" },
  { id: "arpa", name: "Arpa", nameShort: "Arpa", price: 12.50, unit: "₺/kg", change: 1.20, changePercent: 10.6, icon: "feed", category: "feed" },
  { id: "misir", name: "Mısır", nameShort: "Mısır", price: 13.80, unit: "₺/kg", change: 0.95, changePercent: 7.4, icon: "feed", category: "feed" },
  { id: "soya", name: "Soya Küspesi", nameShort: "Soya", price: 22.40, unit: "₺/kg", change: 2.10, changePercent: 10.3, icon: "feed", category: "feed" },
  { id: "usd-try", name: "USD/TRY", nameShort: "USD", price: 42.43, unit: "₺", change: 0.18, changePercent: 0.43, icon: "usd", category: "currency" },
  { id: "eur-try", name: "EUR/TRY", nameShort: "EUR", price: 49.66, unit: "₺", change: 0.24, changePercent: 0.49, icon: "eur", category: "currency" },
];

function PriceIcon({ icon, className }: { icon: MarketPrice["icon"]; className?: string }) {
  const iconClass = cn("w-4 h-4", className);
  
  switch (icon) {
    case "cattle":
      return <GiCow className={iconClass} />;
    case "sheep":
      return <GiSheep className={iconClass} />;
    case "chicken":
      return <GiChicken className={iconClass} />;
    case "beef":
      return <Beef className={iconClass} />;
    case "dairy":
      return <Milk className={iconClass} />;
    case "feed":
      return <GiWheat className={iconClass} />;
    case "usd":
      return <DollarSign className={iconClass} />;
    case "eur":
      return <Euro className={iconClass} />;
    default:
      return <TrendingUp className={iconClass} />;
  }
}

function ChangeIndicator({ change, changePercent }: { change: number; changePercent: number }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  if (isNeutral) {
    return (
      <span className="flex items-center gap-0.5 text-slate-400">
        <Minus className="w-3 h-3" />
        <span className="text-xs">0%</span>
      </span>
    );
  }
  
  return (
    <span className={cn(
      "flex items-center gap-0.5",
      isPositive ? "text-green-400" : "text-red-400"
    )}>
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span className="text-xs font-semibold">
        {isPositive ? "+" : ""}{changePercent.toFixed(1)}%
      </span>
    </span>
  );
}

function PriceItem({ item }: { item: MarketPrice }) {
  const getCategoryColor = (category: MarketPrice["category"]) => {
    switch (category) {
      case "livestock":
        return "text-amber-400";
      case "meat":
        return "text-red-400";
      case "dairy":
        return "text-cyan-400";
      case "feed":
        return "text-emerald-400";
      case "currency":
        return "text-violet-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div 
      className="inline-flex items-center gap-2 px-4 py-1 whitespace-nowrap"
      data-testid={`ticker-item-${item.id}`}
    >
      <PriceIcon icon={item.icon} className={getCategoryColor(item.category)} />
      <span className="text-sm font-medium text-slate-200">{item.nameShort}</span>
      <span className="text-sm font-bold text-white">
        {item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
      </span>
      <ChangeIndicator change={item.change} changePercent={item.changePercent} />
      <span className="text-slate-600 mx-2">|</span>
    </div>
  );
}

export function MarketTicker() {
  const [isPaused, setIsPaused] = useState(false);
  
  const duplicatedData = [...marketData, ...marketData, ...marketData];
  
  return (
    <div 
      className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="market-ticker"
    >
      <div className="relative flex items-center h-8">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-10" />
        
        <div 
          className={cn(
            "flex animate-ticker",
            isPaused && "animation-paused"
          )}
          style={{
            animationDuration: "60s",
          }}
        >
          {duplicatedData.map((item, index) => (
            <PriceItem key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MarketTickerCompact() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % marketData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const currentItem = marketData[currentIndex];
  
  const getCategoryColor = (category: MarketPrice["category"]) => {
    switch (category) {
      case "livestock": return "text-amber-400";
      case "meat": return "text-red-400";
      case "dairy": return "text-cyan-400";
      case "feed": return "text-emerald-400";
      case "currency": return "text-violet-400";
      default: return "text-blue-400";
    }
  };
  
  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded text-sm"
      data-testid="market-ticker-compact"
    >
      <PriceIcon icon={currentItem.icon} className={getCategoryColor(currentItem.category)} />
      <span className="font-medium text-slate-200">{currentItem.nameShort}</span>
      <span className="font-bold text-white">
        {currentItem.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="text-xs text-slate-400 ml-1">{currentItem.unit}</span>
      </span>
      <ChangeIndicator change={currentItem.change} changePercent={currentItem.changePercent} />
    </div>
  );
}
