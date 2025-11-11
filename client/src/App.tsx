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
import LiveStreams from "@/pages/live-streams";
import CreateStream from "@/pages/create-stream";
import StreamControl from "@/pages/stream-control";
import StreamViewer from "@/pages/stream-viewer";

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
            <Route path="/ilanlar" component={Home} />
            <Route path="/canli-yayin" component={LiveStreams} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

// Routes without sidebar (auth pages + create listing)
function NoSidebarLayout() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/giris" component={Login} />
          <Route path="/kayit" component={Register} />
          <Route path="/ilan-ver" component={CreateListing} />
          <Route path="/yayin-baslat" component={CreateStream} />
          <Route path="/yayin/:id/kontrol" component={StreamControl} />
          <Route path="/yayin/:id" component={StreamViewer} />
          <Route path="/canli/:channelName" component={StreamViewer} />
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
                           location.startsWith('/yayin-baslat') ||
                           location.startsWith('/yayin/') ||
                           location.startsWith('/canli/');
  
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
