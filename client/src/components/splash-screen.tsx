import { useState, useEffect } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const SPLASH_KEY = "sahibindenhayvan-onboarded";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    const autoClose = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoClose);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(SPLASH_KEY, "true");
    setTimeout(onComplete, 300);
  };

  const handleRegister = () => {
    localStorage.setItem(SPLASH_KEY, "true");
    window.location.href = "/kayit";
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex flex-col items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      data-testid="splash-screen"
    >
      <div className="text-center px-6 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative mb-6">
          <div className="mx-auto flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              sahibinden<span className="text-white/70">hayvan</span>
            </span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            %100 ÜCRETSİZ
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" data-testid="text-splash-title">
          Hoş Geldiniz!
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-2" data-testid="text-splash-subtitle">
          sahibinden<span className="text-yellow-300">hayvan</span>.com
        </p>

        <p className="text-white/70 mb-8 text-sm md:text-base">
          Türkiye'nin güvenilir hayvan ilanları platformu
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            size="lg"
            className="bg-white text-blue-700 hover:bg-white/90 font-semibold"
            onClick={handleClose}
            data-testid="button-enter-site"
          >
            Siteye Gir
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-white/50 text-white hover:bg-white/10 font-semibold"
            onClick={handleRegister}
            data-testid="button-register-now"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Hemen Üye Ol
          </Button>
        </div>

        <div className="w-48 h-1.5 mx-auto bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-white/50 text-xs mt-3">
          Otomatik devam ediliyor...
        </p>
      </div>

      <div className="absolute bottom-6 text-center">
        <p className="text-white/40 text-xs">
          Evcil hayvan, çiftlik hayvanı, kuş, balık ve daha fazlası
        </p>
      </div>
    </div>
  );
}

export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeenSplash = localStorage.getItem(SPLASH_KEY);
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const hideSplash = () => setShowSplash(false);

  return { showSplash, hideSplash };
}
