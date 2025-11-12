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
                           location.startsWith('/blog') ||
                           location.startsWith('/profil') ||
                           location.startsWith('/panel') ||
                           location.startsWith('/ayarlar') ||
                           location.startsWith('/favoriler') ||
                           location.startsWith('/mesajlar') ||
                           location.startsWith('/veterinerler') ||
                           location.startsWith('/tasima');
  
  return isNoSidebarRoute ? <NoSidebarLayout /> : (
    <SidebarProvider 
      style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
      defaultOpen={true}
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
