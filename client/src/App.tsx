import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CreateListing from "@/pages/create-listing";
import BlogList from "@/pages/blog-list";
import BlogDetail from "@/pages/blog-detail";
import ListingList from "@/pages/listing-list";
import ListingDetail from "@/pages/listing-detail";
import Profile from "@/pages/profile";
import Messages from "@/pages/messages";
import VetServices from "@/pages/vet-services";
import TransportServices from "@/pages/transport-services";
import AuctionList from "@/pages/auction-list";
import AuctionDetail from "@/pages/auction-detail";
import AuctionCreate from "@/pages/auction-create";
import LiveStreamList from "@/pages/live-stream-list";
import LiveStreamWatch from "@/pages/live-stream-watch";
import LiveStreamCreate from "@/pages/live-stream-create";
import CategoryDetail from "@/pages/category-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminModeration from "@/pages/admin-moderation";
import AdminBlog from "@/pages/admin-blog";
import VerifyEmail from "@/pages/verify-email";
import StoresList from "@/pages/stores-list";
import StoreDetail from "@/pages/store-detail";
import MyStore from "@/pages/my-store";

// Routes that should have the sidebar layout
function SidebarLayout() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/ilanlar" component={ListingList} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

// Routes without sidebar (auth pages + create listing + blog)
function NoSidebarLayout() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/giris" component={Login} />
          <Route path="/kayit" component={Register} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/ilan-ver" component={CreateListing} />
          <Route path="/ilan/:id" component={ListingDetail} />
          <Route path="/profil" component={Profile} />
          <Route path="/panel" component={Profile} />
          <Route path="/ayarlar" component={Profile} />
          <Route path="/favoriler" component={Profile} />
          <Route path="/mesajlar" component={Messages} />
          <Route path="/veterinerler" component={VetServices} />
          <Route path="/tasima" component={TransportServices} />
          <Route path="/blog" component={BlogList} />
          <Route path="/blog/:slug" component={BlogDetail} />
          <Route path="/magazalar" component={StoresList} />
          <Route path="/magaza/:slug" component={StoreDetail} />
          <Route path="/panel/magazam" component={MyStore} />
          <Route path="/acik-artirmalar" component={AuctionList} />
          <Route path="/acik-artirma/:id" component={AuctionDetail} />
          <Route path="/acik-artirma-olustur" component={AuctionCreate} />
          <Route path="/canli-yayinlar" component={LiveStreamList} />
          <Route path="/canli-yayin/:id" component={LiveStreamWatch} />
          <Route path="/yayin-baslat" component={LiveStreamCreate} />
          <Route path="/kategori/:slug" component={CategoryDetail} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/moderasyon" component={AdminModeration} />
          <Route path="/admin/blog" component={AdminBlog} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isNoSidebarRoute = location.startsWith('/giris') || 
                           location.startsWith('/kayit') || 
                           location.startsWith('/ilan-ver') ||
                           location.startsWith('/ilan/') ||
                           location.startsWith('/blog') ||
                           location.startsWith('/magaza') ||
                           location.startsWith('/profil') ||
                           location.startsWith('/panel') ||
                           location.startsWith('/ayarlar') ||
                           location.startsWith('/favoriler') ||
                           location.startsWith('/mesajlar') ||
                           location.startsWith('/veterinerler') ||
                           location.startsWith('/tasima') ||
                           location.startsWith('/acik-artirma') ||
                           location.startsWith('/canli-yayin') ||
                           location.startsWith('/yayin-baslat') ||
                           location.startsWith('/kategori/') ||
                           location.startsWith('/admin');
  
  // Mobilde sidebar kapalı, desktop'ta açık olsun
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return isNoSidebarRoute ? <NoSidebarLayout /> : (
    <SidebarProvider 
      style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
      defaultOpen={!isMobile}
    >
      <SidebarLayout />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
