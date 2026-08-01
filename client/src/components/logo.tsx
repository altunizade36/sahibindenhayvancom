import { cn } from "@/lib/utils";

/**
 * Marka işareti — yalnızca yazı.
 *
 * Daha önce metnin yanında bir pati ikonu vardı; markanın kendisi
 * "sahibindenhayvan" adı olduğu için ikon kaldırıldı. Böylece üst barda
 * yer de kazanılıyor.
 */

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  /** Dar alanlarda yalnızca kısaltma gösterir ("sh") */
  iconOnly?: boolean;
}

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
} as const;

/** İsim iki renkli yazılır: "sahibinden" koyu, "hayvan" marka rengi */
function Wordmark({ size }: { size: keyof typeof textSizeClasses }) {
  return (
    <span
      className={cn("font-bold tracking-tight leading-none whitespace-nowrap", textSizeClasses[size])}
      data-testid="logo-text"
    >
      <span className="text-foreground">sahibinden</span>
      <span className="text-primary">hayvan</span>
    </span>
  );
}

export function Logo({ className, size = "md", showText = true, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <div className={cn("flex items-center justify-center", className)} data-testid="logo-icon">
        <span className={cn("font-bold tracking-tight text-primary", textSizeClasses[size])}>
          sh
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)} data-testid="logo">
      {showText && <Wordmark size={size} />}
    </div>
  );
}

/** Giriş/kayıt gibi sayfalarda kullanılan büyük, alt başlıklı biçim */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)} data-testid="logo-full">
      <span className="text-xl sm:text-2xl font-bold tracking-tight leading-none">
        <span className="text-foreground">sahibinden</span>
        <span className="text-primary">hayvan</span>
      </span>
      <span className="text-[10px] sm:text-xs text-muted-foreground">
        Türkiye'nin Hayvan Pazarı
      </span>
    </div>
  );
}
