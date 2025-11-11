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
            <Route path="/ilan-ver" component={CreateListing} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

// Routes without sidebar (auth pages)
function AuthLayout() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/giris" component={Login} />
        <Route path="/kayit" component={Register} />
      </Switch>
    </>
  );
}

function Router() {
  const [location] = useLocation();
  const isAuthRoute = location.startsWith('/giris') || location.startsWith('/kayit');
  
  return isAuthRoute ? <AuthLayout /> : (
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
