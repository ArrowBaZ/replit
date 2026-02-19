import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Request, Item, Profile } from "@shared/schema";
import { Package, Shirt, TrendingUp, Calendar, ArrowRight, MapPin, Clock } from "lucide-react";

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

export default function ReusseDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const { data: myRequests, isLoading: myRequestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const { data: availableRequests, isLoading: availableLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests/available"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const activeAssignments = myRequests?.filter((r) => !["completed", "cancelled"].includes(r.status)) || [];
  const soldItems = items?.filter((i) => i.status === "sold") || [];
  const totalEarnings = soldItems.reduce((sum, i) => sum + (parseFloat(i.salePrice || "0") * 0.2), 0);

  if (profile?.status === "pending") {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2" data-testid="text-pending-title">Application Under Review</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your Reusse application is being reviewed by our team. We'll notify you once it's approved. This usually takes 1-2 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-reusse-dashboard-title">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your assignments and find new sellers.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {myRequestsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                  <p className="text-xl font-bold">{activeAssignments.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] flex items-center justify-center shrink-0">
                  <Shirt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items Listed</p>
                  <p className="text-xl font-bold">{items?.filter((i) => i.status === "listed").length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items Sold</p>
                  <p className="text-xl font-bold">{soldItems.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission Earned</p>
                  <p className="text-xl font-bold">{totalEarnings.toFixed(0)} EUR</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-lg">Available Requests</h2>
            <Link href="/available">
              <Button variant="ghost" size="sm" data-testid="link-view-all-available">
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {availableLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
              ))}
            </div>
          ) : availableRequests && availableRequests.length > 0 ? (
            <div className="space-y-3">
              {availableRequests.slice(0, 5).map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-md bg-[hsl(var(--success)/0.1)] flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-[hsl(var(--success))]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {serviceTypeLabels[req.serviceType]} - {req.itemCount} items
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {req.meetingLocation && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {req.meetingLocation}
                                </span>
                              )}
                              {req.estimatedValue && (
                                <span className="text-xs text-muted-foreground">
                                  Est. {req.estimatedValue} EUR
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={statusColors[req.status] || ""}>
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">No available requests</p>
                <p className="text-xs text-muted-foreground">Check back soon for new seller requests in your area.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">My Assignments</h2>
          {myRequestsLoading ? (
            <Card><CardContent className="p-4"><Skeleton className="h-32" /></CardContent></Card>
          ) : activeAssignments.length > 0 ? (
            <div className="space-y-3">
              {activeAssignments.slice(0, 4).map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{serviceTypeLabels[req.serviceType]} #{req.id}</p>
                        <p className="text-xs text-muted-foreground">{req.itemCount} items</p>
                      </div>
                      <Badge variant="secondary" className={`shrink-0 ${statusColors[req.status] || ""}`}>
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No active assignments</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
