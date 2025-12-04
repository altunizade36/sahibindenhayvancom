import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, DollarSign, Euro, Beef, Milk } from "lucide-react";
import { GiCow, GiSheep, GiChicken, GiWheat } from "react-icons/gi";
import { cn } from "@/lib/utils";

interface MarketPriceData {
  id: string;
  type: string;
  category: string;
  city: string;
  price: string;
  unit: string;
  min_price?: string;
  max_price?: string;
  change_percent?: string;
  source?: string;
  date: string;
}

interface TickerItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  changePercent: number;
  icon: "cattle" | "sheep" | "chicken" | "beef" | "dairy" | "feed" | "usd" | "eur" | "egg" | "honey";
  category: "livestock" | "meat" | "dairy" | "currency" | "feed" | "other";
}

const currencyRates: TickerItem[] = [
  { id: "usd-try", name: "USD", price: 42.43, unit: "₺", changePercent: 0.43, icon: "usd", category: "currency" },
  { id: "eur-try", name: "EUR", price: 49.66, unit: "₺", changePercent: 0.49, icon: "eur", category: "currency" },
];

function mapPriceToTicker(price: MarketPriceData): TickerItem {
  const getIcon = (type: string, category: string): TickerItem["icon"] => {
    if (type === "buyukbas") return "cattle";
    if (type === "kucukbas") return "sheep";
    if (type === "kanatli") return "chicken";
    if (type === "et") return "beef";
    if (type === "sut") return "dairy";
    if (type === "yem") return "feed";
    if (type === "yumurta") return "egg";
    if (type === "bal") return "honey";
    return "beef";
  };

  const getCategory = (type: string): TickerItem["category"] => {
    if (type === "buyukbas" || type === "kucukbas" || type === "kanatli") return "livestock";
    if (type === "et") return "meat";
    if (type === "sut") return "dairy";
    if (type === "yem") return "feed";
    return "other";
  };

  const shortName = price.category
    .replace("Canlı", "")
    .replace("(30'lu)", "")
    .replace("Organik ", "Org.")
    .trim();

  return {
    id: price.id,
    name: shortName,
    price: parseFloat(price.price),
    unit: price.unit,
    changePercent: price.change_percent ? parseFloat(price.change_percent) : 0,
    icon: getIcon(price.type, price.category),
    category: getCategory(price.type),
  };
}

function PriceIcon({ icon, className }: { icon: TickerItem["icon"]; className?: string }) {
  const iconClass = cn("w-4 h-4", className);
  
  switch (icon) {
    case "cattle":
      return <GiCow className={iconClass} />;
    case "sheep":
      return <GiSheep className={iconClass} />;
    case "chicken":
    case "egg":
      return <GiChicken className={iconClass} />;
    case "beef":
      return <Beef className={iconClass} />;
    case "dairy":
      return <Milk className={iconClass} />;
    case "feed":
    case "honey":
      return <GiWheat className={iconClass} />;
    case "usd":
      return <DollarSign className={iconClass} />;
    case "eur":
      return <Euro className={iconClass} />;
    default:
      return <TrendingUp className={iconClass} />;
  }
}

function ChangeIndicator({ changePercent }: { changePercent: number }) {
  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;
  
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

function PriceItem({ item }: { item: TickerItem }) {
  const getCategoryColor = (category: TickerItem["category"]) => {
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
        return "text-orange-400";
    }
  };

  return (
    <div 
      className="inline-flex items-center gap-2 px-4 py-1 whitespace-nowrap"
      data-testid={`ticker-item-${item.id}`}
    >
      <PriceIcon icon={item.icon} className={getCategoryColor(item.category)} />
      <span className="text-sm font-medium text-slate-200">{item.name}</span>
      <span className="text-sm font-bold text-white">
        {item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
      </span>
      <ChangeIndicator changePercent={item.changePercent} />
      <span className="text-slate-600 mx-2">|</span>
    </div>
  );
}

export function MarketTicker() {
  const [isPaused, setIsPaused] = useState(false);
  
  const { data: marketPrices = [] } = useQuery<MarketPriceData[]>({
    queryKey: ["/api/market-prices"],
    refetchInterval: 300000,
  });

  const tickerItems: TickerItem[] = [
    ...marketPrices.map(mapPriceToTicker),
    ...currencyRates,
  ];

  const duplicatedData = tickerItems.length > 0 
    ? [...tickerItems, ...tickerItems, ...tickerItems]
    : [];
  
  if (tickerItems.length === 0) {
    return (
      <div 
        className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 h-8"
        data-testid="market-ticker"
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-slate-500">Piyasa verileri yükleniyor...</span>
        </div>
      </div>
    );
  }
  
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
  
  const { data: marketPrices = [] } = useQuery<MarketPriceData[]>({
    queryKey: ["/api/market-prices"],
    refetchInterval: 300000,
  });

  const tickerItems: TickerItem[] = [
    ...marketPrices.map(mapPriceToTicker),
    ...currencyRates,
  ];
  
  useEffect(() => {
    if (tickerItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tickerItems.length]);
  
  if (tickerItems.length === 0) {
    return null;
  }
  
  const currentItem = tickerItems[currentIndex] || tickerItems[0];
  
  const getCategoryColor = (category: TickerItem["category"]) => {
    switch (category) {
      case "livestock": return "text-amber-400";
      case "meat": return "text-red-400";
      case "dairy": return "text-cyan-400";
      case "feed": return "text-emerald-400";
      case "currency": return "text-violet-400";
      default: return "text-orange-400";
    }
  };
  
  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded text-sm"
      data-testid="market-ticker-compact"
    >
      <PriceIcon icon={currentItem.icon} className={getCategoryColor(currentItem.category)} />
      <span className="font-medium text-slate-200">{currentItem.name}</span>
      <span className="font-bold text-white">
        {currentItem.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="text-xs text-slate-400 ml-1">{currentItem.unit}</span>
      </span>
      <ChangeIndicator changePercent={currentItem.changePercent} />
    </div>
  );
}
