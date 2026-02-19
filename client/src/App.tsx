import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@shared/schema";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import SellerDashboard from "@/pages/seller-dashboard";
import ReusseDashboard from "@/pages/reusse-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import CreateRequestPage from "@/pages/create-request";
import RequestDetailPage from "@/pages/request-detail";
import RequestsListPage from "@/pages/requests-list";
import MessagesPage from "@/pages/messages";
import ItemsListPage from "@/pages/items-list";
import ProfilePage from "@/pages/profile";
import SchedulePage from "@/pages/schedule";
import { Loader2 } from "lucide-react";

function DashboardRoute() {
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <OnboardingPage />;
  }

  if (profile.role === "admin") return <AdminDashboard />;
  if (profile.role === "reusse") return <ReusseDashboard />;
  return <SellerDashboard />;
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={DashboardRoute} />
      <Route path="/requests/new" component={CreateRequestPage} />
      <Route path="/requests/:id" component={RequestDetailPage} />
      <Route path="/requests" component={RequestsListPage} />
      <Route path="/available" component={RequestsListPage} />
      <Route path="/items" component={ItemsListPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/schedule" component={SchedulePage} />
      <Route path="/admin/users">{() => <AdminDashboard />}</Route>
      <Route path="/admin/applications">{() => <AdminDashboard />}</Route>
      <Route path="/">{() => <DashboardRoute />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-2 border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--success))] text-white font-bold mx-auto mb-4">
            R
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
