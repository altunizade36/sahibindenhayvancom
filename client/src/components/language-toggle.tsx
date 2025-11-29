import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "tr", name: "Turkce", flag: "TR" },
  { code: "en", name: "English", flag: "EN" },
];

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  
  const currentLang = languages.find((l) => l.code === language) || languages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-language-toggle">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? "bg-accent" : ""}
            data-testid={`button-language-${lang.code}`}
          >
            <span className="mr-2 font-mono text-xs">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
