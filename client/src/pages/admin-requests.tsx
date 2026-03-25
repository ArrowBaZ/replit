import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, MapPin, Flag, MessageSquare, XCircle, AlertTriangle, Clock, ChevronRight, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  matched: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  flagged: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-400",
};

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "?";
}

function timeAgo(dateStr: string | Date | null): string {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function AdminRequestsPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showFlagModal, setShowFlagModal] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [showMessageModal, setShowMessageModal] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageChecks, setMessageChecks] = useState<Record<string, boolean>>({});
  const [showRejectModal, setShowRejectModal] = useState<{ id: number; hasReusse: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/requests", statusFilter !== "all" ? statusFilter : undefined],
    queryFn: async () => {
      const url = statusFilter !== "all" ? `/api/admin/requests?status=${statusFilter}` : "/api/admin/requests";
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    if (!requests) return [];
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(r =>
      r.seller?.firstName?.toLowerCase().includes(q) ||
      r.seller?.lastName?.toLowerCase().includes(q) ||
      r.seller?.email?.toLowerCase().includes(q) ||
      r.meetingLocation?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      pending: t("statusPending"),
      matched: t("statusMatched"),
      scheduled: t("statusScheduled"),
      in_progress: t("statusInProgress"),
      completed: t("statusCompleted"),
      cancelled: t("statusCancelled"),
      flagged: t("flaggedStatus"),
    };
    return map[status] || status.replace(/_/g, " ");
  };

  const serviceTypeLabels: Record<string, string> = {
    classic: t("classic"),
    express: t("express"),
    sos_dressing: t("sosDressing"),
  };

  const flagRequest = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/requests/${id}/flag`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      setShowFlagModal(null);
      setFlagReason("");
      toast({ title: t("requestFlagged") });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ id, message }: { id: number; message: string }) => {
      const res = await apiRequest("POST", `/api/admin/requests/${id}/message`, { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      setShowMessageModal(null);
      setMessageText("");
      setMessageChecks({});
      toast({ title: t("adminMessageSent") });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/requests/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      setShowRejectModal(null);
      setRejectReason("");
      toast({ title: t("requestRejected") });
    },
  });

  const buildMessage = () => {
    const parts: string[] = [];
    if (messageChecks.addPhotos) parts.push(t("addPhotos"));
    if (messageChecks.clarifyCondition) parts.push(t("clarifyCondition"));
    if (messageChecks.addBrand) parts.push(t("addBrand"));
    if (messageChecks.addDescription) parts.push(t("addDescription"));
    if (messageText.trim()) parts.push(messageText.trim());
    return parts.join("\n• ");
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-admin-requests-title">{t("adminRequestsTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("adminRequestsSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="pl-9"
            data-testid="input-admin-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="pending">{t("statusPending")}</SelectItem>
            <SelectItem value="matched">{t("statusMatched")}</SelectItem>
            <SelectItem value="scheduled">{t("statusScheduled")}</SelectItem>
            <SelectItem value="in_progress">{t("statusInProgress")}</SelectItem>
            <SelectItem value="completed">{t("statusCompleted")}</SelectItem>
            <SelectItem value="cancelled">{t("statusCancelled")}</SelectItem>
            <SelectItem value="flagged">{t("flaggedStatus")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
        ))
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("noRequests")}</p>
          </CardContent>
        </Card>
      ) : (
        filtered.map((request: any) => (
          <Card key={request.id} className={request.status === "flagged" ? "border-amber-400 dark:border-amber-600" : ""}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={request.seller?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(request.seller?.firstName, request.seller?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-seller-name-${request.id}`}>
                      {request.seller?.firstName || request.seller?.lastName
                        ? `${request.seller?.firstName || ""} ${request.seller?.lastName || ""}`.trim()
                        : request.seller?.email || "—"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {request.seller?.city && (
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{request.seller.city}</span>
                      )}
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{timeAgo(request.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={statusColors[request.status] || ""}>
                    {translateStatus(request.status)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {serviceTypeLabels[request.serviceType] || request.serviceType}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {request.itemCount} {request.itemCount === 1 ? "item" : "items"}
                </span>
                {request.estimatedValue && (
                  <span>{request.estimatedValue} EUR est.</span>
                )}
                {request.meetingLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {request.meetingLocation}
                  </span>
                )}
                {request.reusseId && (
                  <span className="text-blue-600 dark:text-blue-400">Reseller assigned</span>
                )}
              </div>

              {request.notes && (
                <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1 line-clamp-2">{request.notes}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  onClick={() => { setShowFlagModal(request.id); setFlagReason(""); }}
                  disabled={request.status === "flagged" || request.status === "cancelled" || request.status === "completed"}
                  data-testid={`button-flag-${request.id}`}
                >
                  <Flag className="h-3.5 w-3.5 mr-1" /> {t("flagRequest")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => { setShowMessageModal(request.id); setMessageText(""); setMessageChecks({}); }}
                  data-testid={`button-message-${request.id}`}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> {t("messageRequest")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => { setShowRejectModal({ id: request.id, hasReusse: !!request.reusseId }); setRejectReason(""); }}
                  disabled={request.status === "cancelled" || request.status === "completed"}
                  data-testid={`button-reject-${request.id}`}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> {t("rejectRequest")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => setLocation(`/requests/${request.id}`)}
                  data-testid={`button-view-${request.id}`}
                >
                  {t("viewDetail")} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showFlagModal !== null} onOpenChange={(open) => { if (!open) setShowFlagModal(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Flag className="h-4 w-4 text-amber-500" />{t("flagRequest")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("flagReason")}</Label>
              <Textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder={t("flagReasonPlaceholder")}
                className="resize-none"
                rows={3}
                data-testid="input-flag-reason"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => showFlagModal !== null && flagRequest.mutate({ id: showFlagModal, reason: flagReason })}
                disabled={flagRequest.isPending}
                data-testid="button-confirm-flag"
              >
                {t("flagRequest")}
              </Button>
              <Button variant="ghost" onClick={() => setShowFlagModal(null)}>{t("back")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageModal !== null} onOpenChange={(open) => { if (!open) setShowMessageModal(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" />{t("messageTemplate")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              {[
                { key: "addPhotos", label: t("addPhotos") },
                { key: "clarifyCondition", label: t("clarifyCondition") },
                { key: "addBrand", label: t("addBrand") },
                { key: "addDescription", label: t("addDescription") },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={!!messageChecks[key]}
                    onCheckedChange={(checked) => setMessageChecks(prev => ({ ...prev, [key]: !!checked }))}
                    data-testid={`checkbox-${key}`}
                  />
                  <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("messageTemplatePlaceholder")}</Label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t("messageTemplatePlaceholder")}
                className="resize-none"
                rows={3}
                data-testid="input-message-text"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => showMessageModal !== null && sendMessage.mutate({ id: showMessageModal, message: buildMessage() })}
                disabled={sendMessage.isPending || (!Object.values(messageChecks).some(Boolean) && !messageText.trim())}
                data-testid="button-send-message"
              >
                {t("adminSendMessage")}
              </Button>
              <Button variant="ghost" onClick={() => setShowMessageModal(null)}>{t("back")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal !== null} onOpenChange={(open) => { if (!open) setShowRejectModal(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" />{t("confirmReject")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {showRejectModal?.hasReusse && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">{t("rejectWarning")}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label>{t("rejectReason")}</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("rejectReasonPlaceholder")}
                className="resize-none"
                rows={3}
                data-testid="input-reject-reason"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => showRejectModal && rejectRequest.mutate({ id: showRejectModal.id, reason: rejectReason })}
                disabled={rejectRequest.isPending}
                data-testid="button-confirm-reject"
              >
                {t("rejectRequest")}
              </Button>
              <Button variant="ghost" onClick={() => setShowRejectModal(null)}>{t("back")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
