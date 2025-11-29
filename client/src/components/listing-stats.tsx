import { Eye, Heart, Share2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ListingStatsProps {
  views: number;
  favoriteCount: number;
  shareCount?: number;
  compact?: boolean;
  showTrending?: boolean;
}

export function ListingStats({ 
  views, 
  favoriteCount, 
  shareCount = 0, 
  compact = false,
  showTrending = false 
}: ListingStatsProps) {
  const isTrending = views > 100 || favoriteCount > 10;
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1" data-testid="stat-views-compact">
              <Eye className="h-3 w-3" />
              {formatNumber(views)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{views} goruntulenme</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1" data-testid="stat-favorites-compact">
              <Heart className="h-3 w-3" />
              {formatNumber(favoriteCount)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{favoriteCount} kisi favoriledi</p>
          </TooltipContent>
        </Tooltip>
        
        {showTrending && isTrending && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trend
          </Badge>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-muted-foreground" data-testid="stat-views">
        <Eye className="h-4 w-4" />
        <span className="text-sm">{formatNumber(views)} goruntulenme</span>
      </div>
      
      <div className="flex items-center gap-2 text-muted-foreground" data-testid="stat-favorites">
        <Heart className="h-4 w-4" />
        <span className="text-sm">{formatNumber(favoriteCount)} favori</span>
      </div>
      
      {shareCount > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="stat-shares">
          <Share2 className="h-4 w-4" />
          <span className="text-sm">{formatNumber(shareCount)} paylasim</span>
        </div>
      )}
      
      {showTrending && isTrending && (
        <Badge variant="default" className="bg-orange-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          Trend Ilan
        </Badge>
      )}
    </div>
  );
}
