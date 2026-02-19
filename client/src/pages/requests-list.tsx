import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Request, Profile } from "@shared/schema";
import { Package, Plus, MapPin, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  matched: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function RequestsListPage() {
  const [location] = useLocation();
  const isAvailable = location === "/available";
  const { t } = useI18n();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const { data: requests, isLoading } = useQuery<Request[]>({
    queryKey: isAvailable ? ["/api/requests/available"] : ["/api/requests"],
  });

  const isSeller = profile?.role === "seller";
  const title = isAvailable ? t("availableRequests") : isSeller ? t("myRequests") : t("myAssignments");

  const serviceTypeLabels: Record<string, string> = {
    classic: t("classic"),
    express: t("express"),
    sos_dressing: t("sosDressing"),
  };

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t("statusPending"),
      matched: t("statusMatched"),
      scheduled: t("statusScheduled"),
      in_progress: t("statusInProgress"),
      completed: t("statusCompleted"),
      cancelled: t("statusCancelled"),
      pending_approval: t("statusPendingApproval"),
      approved: t("statusApproved"),
      listed: t("statusListed"),
      sold: t("statusSold"),
    };
    return statusMap[status] || status.replace(/_/g, " ");
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-requests-title">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAvailable ? t("requestsAvailableDesc") : isSeller ? t("requestsSellerDesc") : t("requestsReusseDesc")}
          </p>
        </div>
        {isSeller && (
          <Link href="/requests/new">
            <Button className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-new-request-list">
              <Plus className="h-4 w-4 mr-2" /> {t("newRequest")}
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} href={`/requests/${req.id}`}>
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {serviceTypeLabels[req.serviceType]} - {req.itemCount} {t("items")}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString("fr-FR") : ""}
                          </span>
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
                    <Badge variant="secondary" className={`shrink-0 ${statusColors[req.status] || ""}`}>
                      {translateStatus(req.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">
              {isAvailable ? t("noAvailableRequests") : t("noRequests")}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {isAvailable ? t("noAvailableRequestsMsg") : isSeller ? t("createFirstRequest") : t("acceptRequestToStart")}
            </p>
            {isSeller && (
              <Link href="/requests/new">
                <Button size="sm" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("createRequestBtn")}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
