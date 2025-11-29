import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Shield, Star, Crown, Gem } from "lucide-react";

interface SellerLevelBadgeProps {
  level: string;
  score?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

const LEVEL_CONFIG: Record<string, {
  name: string;
  nameEn: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  bronze: {
    name: "Bronz Satici",
    nameEn: "Bronze Seller",
    icon: Award,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  silver: {
    name: "Gumus Satici",
    nameEn: "Silver Seller",
    icon: Shield,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  gold: {
    name: "Altin Satici",
    nameEn: "Gold Seller",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  platinum: {
    name: "Platin Satici",
    nameEn: "Platinum Seller",
    icon: Crown,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  diamond: {
    name: "Elmas Satici",
    nameEn: "Diamond Seller",
    icon: Gem,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
  },
};

export function SellerLevelBadge({ level, score, showScore = false, size = "md" }: SellerLevelBadgeProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={`${config.bgColor} ${config.borderColor} ${config.color} ${sizeClasses[size]} inline-flex items-center gap-1`}
          data-testid={`badge-seller-level-${level}`}
        >
          <Icon className={iconSizes[size]} />
          <span>{config.name}</span>
          {showScore && score !== undefined && (
            <span className="opacity-60">({score})</span>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-medium">{config.name}</p>
          {score !== undefined && <p className="text-muted-foreground">Skor: {score}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
