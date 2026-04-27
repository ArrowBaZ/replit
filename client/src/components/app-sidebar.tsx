import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import type { Profile, Notification, ItemDocument } from "@shared/schema";
import sellzyLogo from "@assets/sellzy_logo_bold_green_1771510604189.png";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  User,
  LogOut,
  ClipboardList,
  Users,
  Shield,
  Plus,
  Calendar,
  Shirt,
  Star,
  Bell,
  FileText,
  Check,
  FolderOpen,
  Percent,
} from "lucide-react";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "U";
}

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "document_request") return <FileText className="h-4 w-4 text-blue-500" />;
  if (type === "new_document") return <FileText className="h-4 w-4 text-green-500" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
}

function toastAllowed(prefs: Record<string, boolean> | null | undefined, key: string): boolean {
  if (!prefs || prefs[key] === undefined) return true;
  return prefs[key];
}

function NotificationBell({ userId, notifPrefs }: { userId: string; notifPrefs?: Record<string, boolean> | null }) {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60000,
  });

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  useEffect(() => {
    if (!userId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "document_request" ||
          data.type === "new_document" ||
          data.type === "new_notification" ||
          data.type === "agreement_ready"
        ) {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
        if (data.type === "agreement_ready" && data.agreementId && toastAllowed(notifPrefs, "toast_agreement_ready")) {
          toast({
            title: t("notifPrefAgreementReady"),
            description: t("notifPrefAgreementReadyDesc"),
            action: (
              <ToastAction
                altText="View and sign the agreement"
                onClick={() => navigate(`/agreements/${data.agreementId}`)}
                data-testid="toast-link-agreement"
              >
                View &amp; Sign
              </ToastAction>
            ),
          });
        }
        if (data.type === "document_request" && data.itemTitle && toastAllowed(notifPrefs, "toast_document_request")) {
          toast({
            title: t("notifDocRequest"),
            description: data.itemTitle,
            action: data.itemId ? (
              <ToastAction
                altText="Go to request"
                onClick={() => navigate(data.requestId ? `/requests/${data.requestId}` : `/items`)}
                data-testid="toast-link-doc-request"
              >
                {t("toastViewItem")}
              </ToastAction>
            ) : undefined,
          });
        }
        if (data.type === "counter_offer" && data.itemTitle && toastAllowed(notifPrefs, "toast_counter_offer")) {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          toast({
            title: t("toastCounterOffer"),
            description: `${data.itemTitle}${data.minPrice || data.maxPrice ? ` · ${data.minPrice ?? ""}${data.maxPrice ? ` – ${data.maxPrice}` : ""} EUR` : ""}`,
            action: data.requestId ? (
              <ToastAction
                altText="Go to request"
                onClick={() => navigate(`/requests/${data.requestId}`)}
                data-testid="toast-link-counter-offer"
              >
                {t("toastViewItem")}
              </ToastAction>
            ) : undefined,
          });
        }
        if (data.type === "price_revised" && data.itemTitle && toastAllowed(notifPrefs, "toast_price_revised")) {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          toast({
            title: t("toastPriceRevised"),
            description: `${data.itemTitle}${data.minPrice || data.maxPrice ? ` · ${data.minPrice ?? ""}${data.maxPrice ? ` – ${data.maxPrice}` : ""} EUR` : ""}`,
            action: data.requestId ? (
              <ToastAction
                altText="Go to request"
                onClick={() => navigate(`/requests/${data.requestId}`)}
                data-testid="toast-link-price-revised"
              >
                {t("toastViewItem")}
              </ToastAction>
            ) : undefined,
          });
        }
      } catch {}
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { ws.close(); };
  }, [userId, toast, navigate, notifPrefs, t]);

  const handleNotifClick = (notif: Notification) => {
    if (!notif.isRead) markRead.mutate(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="right"
        className="w-80 p-0"
        data-testid="panel-notifications"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">{t("notifications")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => markAllRead.mutate()}
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3 mr-1" />
              {t("markAllRead")}
            </Button>
          )}
        </div>
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm" data-testid="text-no-notifications">
            <Bell className="h-8 w-8 mb-2 opacity-30" />
            {t("noNotifications")}
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {notifs.slice(0, 15).map((notif) => (
              <button
                key={notif.id}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors ${!notif.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                onClick={() => handleNotifClick(notif)}
                data-testid={`notif-item-${notif.id}`}
              >
                <div className="mt-0.5 shrink-0">
                  <NotificationIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{notif.createdAt ? timeAgo(notif.createdAt) : ""}</span>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" data-testid={`notif-unread-dot-${notif.id}`} />
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { t } = useI18n();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const role = profile?.role || "seller";

  const { data: documents = [] } = useQuery<ItemDocument[]>({
    queryKey: ["/api/documents"],
    enabled: !!user && profile?.role === "seller",
  });

  const documentCount = documents.length;

  const sellerItems = [
    { title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("myRequests"), url: "/requests", icon: ClipboardList },
    { title: t("myItems"), url: "/items", icon: Shirt },
    { title: "My Documents", url: "/documents", icon: FolderOpen, badge: documentCount > 0 ? documentCount : null },
    { title: t("discoverResellers"), url: "/resellers", icon: Star },
    { title: t("messages"), url: "/messages", icon: MessageSquare },
    { title: "Fee Structure", url: "/fee-structure", icon: Percent },
    { title: t("profile"), url: "/profile", icon: User },
  ];

  const reusseItems = [
    { title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("availableRequests"), url: "/available", icon: Package },
    { title: t("myAssignments"), url: "/requests", icon: ClipboardList },
    { title: t("schedule"), url: "/schedule", icon: Calendar },
    { title: t("messages"), url: "/messages", icon: MessageSquare },
    { title: "Fee Structure", url: "/fee-structure", icon: Percent },
    { title: t("profile"), url: "/profile", icon: User },
  ];

  const adminItems = [
    { title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("users"), url: "/admin/users", icon: Users },
    { title: t("applications"), url: "/admin/applications", icon: Shield },
    { title: t("adminRequests"), url: "/admin/requests", icon: ClipboardList },
    { title: "Fee Tiers", url: "/admin/fee-tiers", icon: Percent },
    { title: t("messages"), url: "/messages", icon: MessageSquare },
  ];

  const menuItems = role === "admin" ? adminItems : role === "reusse" ? reusseItems : sellerItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" data-testid="link-logo">
          <div className="flex items-center gap-2">
            <img src={sellzyLogo} alt="Sellzy" className="h-8" />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {role === "seller" && (
          <div className="px-3 mb-2">
            <Link href="/requests/new">
              <Button className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-new-request">
                <Plus className="h-4 w-4 mr-2" />
                {t("newRequest")}
              </Button>
            </Link>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{role === "admin" ? t("administration") : role === "reusse" ? t("reusse") : t("seller")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild data-active={location === item.url || (item.url !== "/dashboard" && location.startsWith(item.url))}>
                    <Link href={item.url} data-testid={`link-nav-${item.url.replace(/\//g, "-").slice(1)}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {"badge" in item && item.badge !== null && item.badge !== undefined && (
                        <span
                          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground px-1"
                          data-testid="badge-document-count"
                        >
                          {(item.badge as number) > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 px-2 py-2">
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
              {role === "reusse" ? t("reusse") : role === "admin" ? "Admin" : t("seller")}
            </p>
          </div>
          {user?.id && <NotificationBell userId={user.id} notifPrefs={profile?.notificationPrefs} />}
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
