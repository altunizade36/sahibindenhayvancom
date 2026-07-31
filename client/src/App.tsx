import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Navbar } from "@/components/navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SplashScreen, useSplashScreen } from "@/components/splash-screen";
import { CookieConsent } from "@/components/cookie-consent";
import { CompareProvider } from "@/contexts/compare-context";
import { CompareBar } from "@/components/compare-bar";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Critical pages - loaded immediately
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PhoneLogin from "@/pages/phone-login";
import EmailVerifyLink from "@/pages/email-verify-link";
import ListingList from "@/pages/listing-list";
import ListingDetail from "@/pages/listing-detail";
import CategoryDetail from "@/pages/category-detail";

// Lazy loaded pages - loaded on demand for better initial load time
const ForgotPassword = lazy(() => import("@/pages/sifremi-unuttum"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const CreateListing = lazy(() => import("@/pages/create-listing"));
const BlogList = lazy(() => import("@/pages/blog-list"));
const BlogDetail = lazy(() => import("@/pages/blog-detail"));
const Profile = lazy(() => import("@/pages/profile"));
const Messages = lazy(() => import("@/pages/messages"));
const VetServices = lazy(() => import("@/pages/vet-services"));
const TransportServices = lazy(() => import("@/pages/transport-services"));
const MarketPrices = lazy(() => import("@/pages/market-prices"));
const B2BMarketplace = lazy(() => import("@/pages/b2b-marketplace"));
const WholesaleDairy = lazy(() => import("@/pages/wholesale-dairy"));
const AuctionList = lazy(() => import("@/pages/auction-list"));
const AuctionDetail = lazy(() => import("@/pages/auction-detail"));
const AuctionCreate = lazy(() => import("@/pages/auction-create"));
const LiveStreamList = lazy(() => import("@/pages/live-stream-list"));
const LiveStreamWatch = lazy(() => import("@/pages/live-stream-watch"));
const LiveStreamCreate = lazy(() => import("@/pages/live-stream-create"));
const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminPinVerify = lazy(() => import("@/pages/admin/pin-verify"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminListings = lazy(() => import("@/pages/admin/listings"));
const AdminStores = lazy(() => import("@/pages/admin/stores"));
const AdminReports = lazy(() => import("@/pages/admin/reports"));
const AdminDocuments = lazy(() => import("@/pages/admin/documents"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminBlog = lazy(() => import("@/pages/admin/blog"));
const AdminNotifications = lazy(() => import("@/pages/admin/notifications"));
const AdminLogs = lazy(() => import("@/pages/admin/logs"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const StoresList = lazy(() => import("@/pages/stores-list"));
const StoreDetail = lazy(() => import("@/pages/store-detail"));
const MyStore = lazy(() => import("@/pages/my-store"));
const EditListing = lazy(() => import("@/pages/edit-listing"));
const EditProfile = lazy(() => import("@/pages/edit-profile"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const PanelDashboard = lazy(() => import("@/pages/panel/index"));
const PanelIlanlarim = lazy(() => import("@/pages/panel/ilanlarim"));
const PanelFavorilerim = lazy(() => import("@/pages/panel/favorilerim"));
const PanelAyarlar = lazy(() => import("@/pages/panel/ayarlar"));
const PanelAnalizler = lazy(() => import("@/pages/panel/analizler"));
const PanelSonGoruntuleneler = lazy(() => import("@/pages/panel/son-goruntuleneler"));
const PanelDogrulama = lazy(() => import("@/pages/panel/dogrulama"));
const AdminVerifications = lazy(() => import("@/pages/admin/verifications"));
const ComparePage = lazy(() => import("@/pages/compare"));
const KullanimKosullari = lazy(() => import("@/pages/legal/kullanim-kosullari"));
const GizlilikPolitikasi = lazy(() => import("@/pages/legal/gizlilik-politikasi"));
const CerezPolitikasi = lazy(() => import("@/pages/legal/cerez-politikasi"));
const IlanKurallari = lazy(() => import("@/pages/legal/ilan-kurallari"));
const KVKK = lazy(() => import("@/pages/legal/kvkk"));
const Yardim = lazy(() => import("@/pages/yardim"));
const Iletisim = lazy(() => import("@/pages/iletisim"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Suspense wrapper for lazy components
function LazyRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// Routes that should have the sidebar layout
function SidebarLayout() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Mobilde sidebar toggle butonu */}
          <div className="md:hidden sticky top-0 z-40 bg-background border-b p-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </div>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/ilanlar" component={ListingList} />
          <Route path="/arama" component={ListingList} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

// Routes without sidebar (auth pages + create listing + blog)
function NoSidebarLayout() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  
  return (
    <div className="flex flex-col h-screen w-full">
      {!isAdminRoute && <Navbar />}
      <main className={`flex-1 overflow-auto ${isAdminRoute ? 'p-0' : ''}`}>
        <Switch>
          <Route path="/giris" component={Login} />
          <Route path="/login" component={Login} />
          <Route path="/telefon-giris" component={PhoneLogin} />
          <Route path="/email-giris-dogrula" component={EmailVerifyLink} />
          <Route path="/kayit" component={Register} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password">{() => <LazyRoute component={ForgotPassword} />}</Route>
          <Route path="/sifremi-unuttum">{() => <LazyRoute component={ForgotPassword} />}</Route>
          <Route path="/reset-password">{() => <LazyRoute component={ResetPassword} />}</Route>
          <Route path="/verify-email">{() => <LazyRoute component={VerifyEmail} />}</Route>
          <Route path="/ilan-ver">{() => <LazyRoute component={CreateListing} />}</Route>
          <Route path="/ilan-duzenle/:id">{() => <LazyRoute component={EditListing} />}</Route>
          <Route path="/ilan/:id" component={ListingDetail} />
          <Route path="/profil">{() => <LazyRoute component={Profile} />}</Route>
          <Route path="/profil-duzenle">{() => <LazyRoute component={EditProfile} />}</Route>
          <Route path="/panel">{() => <LazyRoute component={PanelDashboard} />}</Route>
          <Route path="/panel/ilanlarim">{() => <LazyRoute component={PanelIlanlarim} />}</Route>
          <Route path="/panel/favorilerim">{() => <LazyRoute component={PanelFavorilerim} />}</Route>
          <Route path="/panel/ayarlar">{() => <LazyRoute component={PanelAyarlar} />}</Route>
          <Route path="/panel/analizler">{() => <LazyRoute component={PanelAnalizler} />}</Route>
          <Route path="/panel/son-goruntuleneler">{() => <LazyRoute component={PanelSonGoruntuleneler} />}</Route>
          <Route path="/panel/dogrulama">{() => <LazyRoute component={PanelDogrulama} />}</Route>
          <Route path="/ayarlar">{() => <LazyRoute component={PanelAyarlar} />}</Route>
          <Route path="/favoriler">{() => <LazyRoute component={PanelFavorilerim} />}</Route>
          <Route path="/bildirimler">{() => <LazyRoute component={NotificationsPage} />}</Route>
          <Route path="/mesajlar">{() => <LazyRoute component={Messages} />}</Route>
          <Route path="/veterinerler">{() => <LazyRoute component={VetServices} />}</Route>
          <Route path="/tasima">{() => <LazyRoute component={TransportServices} />}</Route>
          <Route path="/piyasa-fiyatlari">{() => <LazyRoute component={MarketPrices} />}</Route>
          <Route path="/b2b-yem">{() => <LazyRoute component={B2BMarketplace} />}</Route>
          <Route path="/toptan-sut">{() => <LazyRoute component={WholesaleDairy} />}</Route>
          <Route path="/blog">{() => <LazyRoute component={BlogList} />}</Route>
          <Route path="/blog/:slug">{() => <LazyRoute component={BlogDetail} />}</Route>
          <Route path="/magazalar">{() => <LazyRoute component={StoresList} />}</Route>
          <Route path="/magaza/:slug">{() => <LazyRoute component={StoreDetail} />}</Route>
          <Route path="/panel/magazam">{() => <LazyRoute component={MyStore} />}</Route>
          <Route path="/magazam">{() => <LazyRoute component={MyStore} />}</Route>
          <Route path="/acik-artirmalar">{() => <LazyRoute component={AuctionList} />}</Route>
          <Route path="/acik-artirma/:id">{() => <LazyRoute component={AuctionDetail} />}</Route>
          <Route path="/acik-artirma-olustur">{() => <LazyRoute component={AuctionCreate} />}</Route>
          <Route path="/canli-yayinlar">{() => <LazyRoute component={LiveStreamList} />}</Route>
          <Route path="/canli-yayin/:id">{() => <LazyRoute component={LiveStreamWatch} />}</Route>
          <Route path="/yayin-baslat">{() => <LazyRoute component={LiveStreamCreate} />}</Route>
          <Route path="/kategori/:slug" component={CategoryDetail} />
          <Route path="/karsilastir">{() => <LazyRoute component={ComparePage} />}</Route>
          <Route path="/admin/pin-dogrula">{() => <LazyRoute component={AdminPinVerify} />}</Route>
          <Route path="/admin">{() => <LazyRoute component={AdminDashboard} />}</Route>
          <Route path="/admin/kullanicilar">{() => <LazyRoute component={AdminUsers} />}</Route>
          <Route path="/admin/ilanlar">{() => <LazyRoute component={AdminListings} />}</Route>
          <Route path="/admin/magazalar">{() => <LazyRoute component={AdminStores} />}</Route>
          <Route path="/admin/sikayetler">{() => <LazyRoute component={AdminReports} />}</Route>
          <Route path="/admin/belgeler">{() => <LazyRoute component={AdminDocuments} />}</Route>
          <Route path="/admin/kategoriler">{() => <LazyRoute component={AdminCategories} />}</Route>
          <Route path="/admin/blog">{() => <LazyRoute component={AdminBlog} />}</Route>
          <Route path="/admin/bildirimler">{() => <LazyRoute component={AdminNotifications} />}</Route>
          <Route path="/admin/loglar">{() => <LazyRoute component={AdminLogs} />}</Route>
          <Route path="/admin/dogrulamalar">{() => <LazyRoute component={AdminVerifications} />}</Route>
          <Route path="/admin/ayarlar">{() => <LazyRoute component={AdminSettings} />}</Route>
          <Route path="/kullanim-kosullari">{() => <LazyRoute component={KullanimKosullari} />}</Route>
          <Route path="/gizlilik-politikasi">{() => <LazyRoute component={GizlilikPolitikasi} />}</Route>
          <Route path="/cerez-politikasi">{() => <LazyRoute component={CerezPolitikasi} />}</Route>
          <Route path="/ilan-kurallari">{() => <LazyRoute component={IlanKurallari} />}</Route>
          <Route path="/kvkk">{() => <LazyRoute component={KVKK} />}</Route>
          <Route path="/yardim">{() => <LazyRoute component={Yardim} />}</Route>
          <Route path="/iletisim">{() => <LazyRoute component={Iletisim} />}</Route>
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isNoSidebarRoute = location.startsWith('/giris') || 
                           location.startsWith('/login') || 
                           location.startsWith('/telefon-giris') || 
                           location.startsWith('/kayit') || 
                           location.startsWith('/register') || 
                           location.startsWith('/forgot-password') || 
                           location.startsWith('/sifremi-unuttum') || 
                           location.startsWith('/reset-password') || 
                           location.startsWith('/verify-email') || 
                           location.startsWith('/ilan-ver') ||
                           location.startsWith('/ilan-duzenle/') ||
                           location.startsWith('/ilan/') ||
                           location.startsWith('/blog') ||
                           location.startsWith('/magaza') ||
                           location.startsWith('/profil') ||
                           location.startsWith('/profil-duzenle') ||
                           location.startsWith('/panel') ||
                           location.startsWith('/ayarlar') ||
                           location.startsWith('/favoriler') ||
                           location.startsWith('/magazam') ||
                           location.startsWith('/bildirimler') ||
                           location.startsWith('/mesajlar') ||
                           location.startsWith('/veterinerler') ||
                           location.startsWith('/tasima') ||
                           location.startsWith('/piyasa-fiyatlari') ||
                           location.startsWith('/b2b-yem') ||
                           location.startsWith('/toptan-sut') ||
                           location.startsWith('/acik-artirma') ||
                           location.startsWith('/canli-yayin') ||
                           location.startsWith('/yayin-baslat') ||
                           location.startsWith('/kategori/') ||
                           location.startsWith('/karsilastir') ||
                           location.startsWith('/admin') ||
                           location.startsWith('/kullanim-kosullari') ||
                           location.startsWith('/gizlilik-politikasi') ||
                           location.startsWith('/cerez-politikasi') ||
                           location.startsWith('/ilan-kurallari') ||
                           location.startsWith('/kvkk') ||
                           location.startsWith('/yardim') ||
                           location.startsWith('/iletisim');
  
  // Mobilde sidebar kapalı, desktop'ta açık olsun
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return isNoSidebarRoute ? <NoSidebarLayout /> : (
    <SidebarProvider 
      style={{ 
        "--sidebar-width": "16rem",
        "--navbar-height": "3.5rem"
      } as React.CSSProperties}
      defaultOpen={!isMobile}
    >
      <SidebarLayout />
    </SidebarProvider>
  );
}

function App() {
  const { showSplash, hideSplash } = useSplashScreen();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <CompareProvider>
            <TooltipProvider>
              {showSplash && <SplashScreen onComplete={hideSplash} />}
              <Toaster />
              <Router />
              <CompareBar />
              <CookieConsent />
            </TooltipProvider>
          </CompareProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
