import { useState, useEffect, createContext, useContext } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, Settings, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_PREFERENCES_KEY = "cookie_preferences";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: true,
};

interface CookieConsentContextType {
  preferences: CookiePreferences;
  openSettings: () => void;
  hasConsent: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setHasConsent(true);
    }
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: true,
    };
    saveConsent(necessaryOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowSettings(false);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setHasConsent(true);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const contextValue: CookieConsentContextType = {
    preferences,
    openSettings,
    hasConsent,
  };

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5 duration-300">
          <Card className="mx-auto max-w-4xl p-4 md:p-6 shadow-lg border-2">
            <div className="flex flex-col md:flex-row gap-4 md:items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-base md:text-lg" data-testid="cookie-banner-title">
                    Çerez Kullanımı Hakkında
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="cookie-banner-description">
                    sahibindenhayvan.com olarak, size en iyi deneyimi sunmak için çerezler kullanıyoruz. 
                    6698 sayılı KVKK ve ilgili mevzuat kapsamında, çerez tercihlerinizi yönetebilirsiniz.{" "}
                    <Link 
                      href="/cerez-politikasi" 
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      data-testid="link-cookie-policy"
                    >
                      Çerez Politikası
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAcceptNecessary}
                    data-testid="button-accept-necessary"
                  >
                    Sadece Gerekli Çerezler
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    data-testid="button-cookie-settings"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Ayarlar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    data-testid="button-accept-all"
                  >
                    Tümünü Kabul Et
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Çerez Tercihleri
            </DialogTitle>
            <DialogDescription>
              Hangi çerezlerin kullanılacağını buradan yönetebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium">Zorunlu Çerezler</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Web sitesinin düzgün çalışması için gereklidir. Bu çerezler devre dışı bırakılamaz.
                </p>
              </div>
              <Switch checked={true} disabled data-testid="switch-necessary-cookies" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium">İşlevsel Çerezler</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Tercihlerinizi hatırlamak ve kişiselleştirilmiş özellikler sunmak için kullanılır.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) => setPreferences({ ...preferences, functional: checked })}
                data-testid="switch-functional-cookies"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium">Analitik Çerezler</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Web sitesi trafiğini analiz etmek ve kullanıcı deneyimini iyileştirmek için kullanılır.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                data-testid="switch-analytics-cookies"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium">Pazarlama Çerezleri</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Size ilgili reklamlar göstermek ve pazarlama kampanyalarının etkinliğini ölçmek için kullanılır.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                data-testid="switch-marketing-cookies"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettings(false)} data-testid="button-cancel-preferences">
              İptal
            </Button>
            <Button onClick={handleSavePreferences} data-testid="button-save-preferences">
              Tercihleri Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CookieConsentContext.Provider>
  );
}

export function CookieSettingsButton() {
  const cookieConsent = useCookieConsent();
  
  if (!cookieConsent?.hasConsent) return null;
  
  return (
    <button
      onClick={cookieConsent.openSettings}
      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
      data-testid="button-manage-cookies"
    >
      Çerez Ayarları
    </button>
  );
}
