import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Meeting } from "@shared/schema";
import { Calendar, MapPin, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  rescheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function SchedulePage() {
  const { t } = useI18n();

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const upcoming = meetings?.filter((m) => m.status === "scheduled" && new Date(m.scheduledDate) >= new Date()) || [];
  const past = meetings?.filter((m) => m.status !== "scheduled" || new Date(m.scheduledDate) < new Date()) || [];

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: t("statusScheduled"),
      completed: t("statusCompleted"),
      cancelled: t("statusCancelled"),
    };
    return statusMap[status] || status;
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-schedule-title">{t("scheduleTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">View your upcoming and past meetings.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="font-semibold">{t("upcoming")}</h2>
            {upcoming.length > 0 ? (
              upcoming.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(m.scheduledDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(m.scheduledDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            {m.duration ? ` (${m.duration} min)` : ""}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {m.location}
                          </span>
                        </div>
                        {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                      </div>
                    </div>
                    <Badge variant="secondary" className={statusColors[m.status] || ""}>
                      {translateStatus(m.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("noUpcomingMeetings")}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">{t("past")}</h2>
              {past.map((m) => (
                <Card key={m.id} className="opacity-60">
                  <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(m.scheduledDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {m.location}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={statusColors[m.status] || ""}>
                      {translateStatus(m.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
