import { cn } from "@/lib/utils";

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
        <svg
          viewBox="0 0 100 100"
          className={cn(iconSizeClasses[size], "text-primary")}
          fill="currentColor"
        >
          <path d="M50 8C45 8 40 12 38 18C36 24 36 32 38 38C28 36 20 38 16 44C12 50 12 58 16 64C14 62 10 62 8 66C6 70 8 76 14 80C10 82 8 86 10 90C12 94 18 96 24 94C20 96 20 100 24 102C28 104 34 102 38 98C34 102 34 108 38 110C42 112 48 110 52 104C52 110 54 114 60 114C66 114 70 108 70 100C74 106 80 108 86 104C92 100 92 92 88 86C94 88 98 86 100 80C102 74 98 68 92 66C98 64 100 58 98 52C96 46 90 44 84 46C88 40 88 32 84 26C80 20 72 18 64 22C68 14 66 8 60 6C54 4 48 8 50 8Z" />
          <circle cx="35" cy="50" r="6" fill="white" />
          <circle cx="65" cy="50" r="6" fill="white" />
          <circle cx="35" cy="50" r="3" fill="currentColor" />
          <circle cx="65" cy="50" r="3" fill="currentColor" />
          <ellipse cx="50" cy="68" rx="8" ry="5" fill="#FF6B6B" />
          <path d="M42 75 Q50 82 58 75" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", sizeClasses[size], className)} data-testid="logo">
      <svg
        viewBox="0 0 100 100"
        className={cn(iconSizeClasses[size], "text-primary shrink-0")}
        fill="currentColor"
      >
        <path d="M85 25C82 18 75 15 68 18C65 12 58 10 52 14C46 10 39 12 36 18C29 15 22 18 19 25C15 32 18 42 25 48L25 75C25 82 30 88 38 90L50 93L62 90C70 88 75 82 75 75L75 48C82 42 85 32 85 25Z" />
        <circle cx="38" cy="45" r="7" fill="white" />
        <circle cx="62" cy="45" r="7" fill="white" />
        <circle cx="38" cy="45" r="4" fill="currentColor" />
        <circle cx="62" cy="45" r="4" fill="currentColor" />
        <ellipse cx="50" cy="62" rx="8" ry="5" fill="#FFB6C1" />
        <path d="M42 70 Q50 78 58 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M26 28 Q22 18 30 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M74 28 Q78 18 70 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
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
    <div className={cn("flex items-center gap-3", className)} data-testid="logo-full">
      <div className="relative">
        <svg
          viewBox="0 0 120 120"
          className="w-14 h-14 text-primary"
          fill="currentColor"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="55" fill="url(#logoGradient)" opacity="0.1" />
          <g transform="translate(10, 10)">
            <path d="M85 25C82 18 75 15 68 18C65 12 58 10 52 14C46 10 39 12 36 18C29 15 22 18 19 25C15 32 18 42 25 48L25 75C25 82 30 88 38 90L50 93L62 90C70 88 75 82 75 75L75 48C82 42 85 32 85 25Z" fill="url(#logoGradient)" />
            <circle cx="38" cy="45" r="7" fill="white" />
            <circle cx="62" cy="45" r="7" fill="white" />
            <circle cx="38" cy="45" r="4" fill="hsl(var(--primary))" />
            <circle cx="62" cy="45" r="4" fill="hsl(var(--primary))" />
            <ellipse cx="50" cy="62" rx="8" ry="5" fill="#FFB6C1" />
            <path d="M42 70 Q50 78 58 70" stroke="#555" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M26 28 Q22 18 30 15" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M74 28 Q78 18 70 15" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight leading-none">
          <span className="text-foreground">sahibinden</span>
          <span className="text-primary">hayvan</span>
        </span>
        <span className="text-xs text-muted-foreground">Türkiye'nin Hayvan Pazarı</span>
      </div>
    </div>
  );
}
