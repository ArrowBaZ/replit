import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  ClipboardList,
  Users,
  Shield,
  Plus,
  Calendar,
  Shirt,
} from "lucide-react";

const sellerItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Requests", url: "/requests", icon: ClipboardList },
  { title: "My Items", url: "/items", icon: Shirt },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Profile", url: "/profile", icon: User },
];

const reusseItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Available Requests", url: "/available", icon: Package },
  { title: "My Assignments", url: "/requests", icon: ClipboardList },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Profile", url: "/profile", icon: User },
];

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Applications", url: "/admin/applications", icon: Shield },
  { title: "All Requests", url: "/requests", icon: ClipboardList },
  { title: "Messages", url: "/messages", icon: MessageSquare },
];

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "U";
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const role = profile?.role || "seller";
  const menuItems = role === "admin" ? adminItems : role === "reusse" ? reusseItems : sellerItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" data-testid="link-logo">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--success))] text-white font-bold text-sm">
              R
            </div>
            <span className="text-lg font-bold tracking-tight">Reusses</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {role === "seller" && (
          <div className="px-3 mb-2">
            <Link href="/requests/new">
              <Button className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-new-request">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{role === "admin" ? "Administration" : role === "reusse" ? "Reusse" : "Seller"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url || (item.url !== "/dashboard" && location.startsWith(item.url))}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-sidebar-username">
              {user?.firstName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {role === "reusse" ? "Reusse" : role === "admin" ? "Admin" : "Seller"}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
