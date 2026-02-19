import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Request, Item, Profile } from "@shared/schema";
import { Package, Shirt, TrendingUp, Clock, Plus, ArrowRight, ShoppingBag } from "lucide-react";

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string; trend?: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold" data-testid={`text-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
          {trend && <p className="text-xs text-[hsl(var(--success))]">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  matched: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const serviceTypeLabels: Record<string, string> = {
  classic: "Classic",
  express: "Express",
  sos_dressing: "SOS Dressing",
};

export default function SellerDashboard() {
  const { user } = useAuth();

  const { data: requests, isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const activeRequests = requests?.filter((r) => !["completed", "cancelled"].includes(r.status)) || [];
  const totalItems = items?.length || 0;
  const soldItems = items?.filter((i) => i.status === "sold") || [];
  const totalEarnings = soldItems.reduce((sum, i) => sum + (parseFloat(i.salePrice || "0") * 0.8), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's an overview of your resale activity.</p>
        </div>
        <Link href="/requests/new">
          <Button className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-new-request-top">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {requestsLoading || itemsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard icon={Package} label="Active Requests" value={String(activeRequests.length)} color="bg-primary/10 text-primary" />
            <StatCard icon={Shirt} label="Total Items" value={String(totalItems)} color="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]" />
            <StatCard icon={ShoppingBag} label="Items Sold" value={String(soldItems.length)} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
            <StatCard icon={TrendingUp} label="Earnings" value={`${totalEarnings.toFixed(0)} EUR`} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-lg">Recent Requests</h2>
            <Link href="/requests">
              <Button variant="ghost" size="sm" data-testid="link-view-all-requests">
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12" /></CardContent></Card>
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.slice(0, 5).map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" data-testid={`text-request-title-${req.id}`}>
                            {serviceTypeLabels[req.serviceType] || req.serviceType} - {req.itemCount} items
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString("fr-FR") : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={statusColors[req.status] || ""} data-testid={`badge-status-${req.id}`}>
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No requests yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first request to get started.</p>
                <Link href="/requests/new">
                  <Button size="sm" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-first-request">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Item Status</h2>
          {itemsLoading ? (
            <Card><CardContent className="p-4"><Skeleton className="h-32" /></CardContent></Card>
          ) : items && items.length > 0 ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                {[
                  { label: "Pending Approval", count: items.filter((i) => i.status === "pending_approval").length, color: "bg-amber-500" },
                  { label: "Approved", count: items.filter((i) => i.status === "approved").length, color: "bg-blue-500" },
                  { label: "Listed", count: items.filter((i) => i.status === "listed").length, color: "bg-purple-500" },
                  { label: "Sold", count: items.filter((i) => i.status === "sold").length, color: "bg-emerald-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${s.color}`} />
                      <span className="text-sm">{s.label}</span>
                    </div>
                    <span className="text-sm font-medium">{s.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Shirt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No items yet</p>
              </CardContent>
            </Card>
          )}

          <h2 className="font-semibold text-lg mt-6">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/requests/new">
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-new-request">
                <Plus className="h-4 w-4 mr-2" /> New Request
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-messages">
                <Clock className="h-4 w-4 mr-2" /> View Messages
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
