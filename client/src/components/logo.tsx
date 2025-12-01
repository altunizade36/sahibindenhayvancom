import { cn } from "@/lib/utils";
import { GiUnicorn } from "react-icons/gi";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  iconOnly?: boolean;
}

export function Logo({ className, size = "md", showText = true, iconOnly = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-14",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
    xl: "w-12 h-12",
  };

  if (iconOnly) {
    return (
      <div className={cn("flex items-center justify-center", className)} data-testid="logo-icon">
        <GiUnicorn className={cn(iconSizeClasses[size], "text-primary")} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", sizeClasses[size], className)} data-testid="logo">
      <GiUnicorn className={cn(iconSizeClasses[size], "text-primary shrink-0")} />
      {showText && (
        <span className={cn("font-bold tracking-tight", textSizeClasses[size])} data-testid="logo-text">
          <span className="text-foreground">sahibinden</span>
          <span className="text-primary">hayvan</span>
        </span>
      )}
    </div>
  );
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)} data-testid="logo-full">
      <div className="relative flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 shrink-0">
        <GiUnicorn className="w-6 h-6 sm:w-9 sm:h-9 text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-base sm:text-2xl font-bold tracking-tight leading-none">
          <span className="text-foreground">sahibinden</span>
          <span className="text-primary">hayvan</span>
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">Türkiye'nin Hayvan Pazarı</span>
      </div>
    </div>
  );
}
