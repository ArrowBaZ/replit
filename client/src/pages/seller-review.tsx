import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Request, Item, Profile } from "@shared/schema";
import { ArrowLeft, Package, Shirt, CheckCircle, XCircle, Tag, Loader2, ChevronDown, ChevronUp, CheckCheck } from "lucide-react";
import { ItemStatusBadge } from "@/components/item-status-badge";
import { useState } from "react";

type PriceOffer = {
  id: number;
  itemId: number;
  proposedByUserId: string;
  proposedByRole: string;
  proposedByName: string;
  minPrice: string | null;
  maxPrice: string | null;
  action: string;
  createdAt: string;
};

function NegotiationHistorySummary({ itemId }: { itemId: number }) {
  const { data: history, isLoading } = useQuery<PriceOffer[]>({
    queryKey: [`/api/items/${itemId}/price-history`],
    retry: 1,
  });

  if (isLoading) return <span className="text-xs text-muted-foreground">Loading...</span>;
  if (!history || history.length === 0) return <span className="text-xs text-muted-foreground">No history</span>;

  const latest = history[history.length - 1];
  const actionLabel: Record<string, string> = {
    initial: "Initial offer",
    counter_offer: "Counter-offer",
    revision: "Revised",
    accepted: "Accepted",
  };

  return (
    <span className="text-xs text-muted-foreground">
      {history.length} event{history.length !== 1 ? "s" : ""} — last: {actionLabel[latest.action] || latest.action}
      {(latest.minPrice || latest.maxPrice) && (
        <> ({latest.minPrice && latest.maxPrice
          ? `${parseFloat(latest.minPrice).toFixed(0)} – ${parseFloat(latest.maxPrice).toFixed(0)} EUR`
          : latest.minPrice
          ? `min ${parseFloat(latest.minPrice).toFixed(0)} EUR`
          : `max ${parseFloat(latest.maxPrice!).toFixed(0)} EUR`})</>
      )}
    </span>
  );
}

interface ItemCardProps {
  item: Item;
  requestId: string;
  onApprove: (itemId: number, version: number) => void;
  onDecline: (itemId: number) => void;
  onCounterOffer: (itemId: number, version: number) => void;
  isApproving: boolean;
  isDeclining: boolean;
}

function ItemReviewCard({ item, requestId, onApprove, onDecline, onCounterOffer, isApproving, isDeclining }: ItemCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Card data-testid={`card-review-item-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start gap-4">
          {item.photos && item.photos.length > 0 ? (
            <div className="h-20 w-20 rounded-md overflow-hidden border shrink-0">
              <img src={item.photos[0]} alt={item.title} className="h-full w-full object-cover" data-testid={`img-review-item-${item.id}`} />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Shirt className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold" data-testid={`text-review-item-title-${item.id}`}>{item.title}</p>
              <ItemStatusBadge
                status={item.status}
                isNegotiating={item.sellerCounterOffer ?? false}
                testId={`badge-review-status-${item.id}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
              {item.category && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {item.category.replace(/_/g, " ")}
                </Badge>
              )}
              {item.condition && (
                <span className="text-xs text-muted-foreground capitalize">{item.condition.replace(/_/g, " ")}</span>
              )}
            </div>

            {(item.minPrice || item.maxPrice) && (
              <p className="text-sm font-medium text-[hsl(var(--success))] mb-2" data-testid={`text-review-price-${item.id}`}>
                {item.minPrice && item.maxPrice
                  ? `${parseFloat(item.minPrice).toFixed(0)} – ${parseFloat(item.maxPrice).toFixed(0)} EUR`
                  : item.minPrice
                  ? `from ${parseFloat(item.minPrice).toFixed(0)} EUR`
                  : `up to ${parseFloat(item.maxPrice!).toFixed(0)} EUR`}
              </p>
            )}

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
              onClick={() => setShowHistory(!showHistory)}
              data-testid={`button-toggle-history-${item.id}`}
            >
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Negotiation history
            </button>

            {showHistory && (
              <div className="mb-3 pl-2 border-l-2 border-muted">
                <NegotiationHistorySummary itemId={item.id} />
              </div>
            )}

            {item.declineReason && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                Decline reason: {item.declineReason}
              </p>
            )}

            {item.status === "pending_approval" && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  size="sm"
                  className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success)/0.9)]"
                  onClick={() => onApprove(item.id, item.version ?? 1)}
                  disabled={isApproving || isDeclining}
                  data-testid={`button-approve-item-${item.id}`}
                >
                  {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCounterOffer(item.id, item.version ?? 1)}
                  disabled={isApproving || isDeclining}
                  data-testid={`button-counter-offer-item-${item.id}`}
                >
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  Counter-Offer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => onDecline(item.id)}
                  disabled={isApproving || isDeclining}
                  data-testid={`button-decline-item-${item.id}`}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellerReviewPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profile"] });

  const { data: request, isLoading: requestLoading } = useQuery<Request>({
    queryKey: ["/api/requests", params.id],
  });

  const { data: requestItems, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/requests", params.id, "items"],
  });

  const [showAcceptAllConfirm, setShowAcceptAllConfirm] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState<{ itemId: number; version: number } | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState<number | null>(null);
  const [counterMin, setCounterMin] = useState("");
  const [counterMax, setCounterMax] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  const pendingItems = requestItems?.filter((i) => i.status === "pending_approval") ?? [];
  const approvedItems = requestItems?.filter((i) => i.status === "approved") ?? [];
  const otherItems = requestItems?.filter((i) => !["pending_approval", "approved"].includes(i.status)) ?? [];

  const approveItem = useMutation({
    mutationFn: async ({ itemId, version }: { itemId: number; version: number }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/approve`, { version });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to accept item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      toast({ title: "Item accepted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to accept item", variant: "destructive" });
    },
  });

  const counterOfferItem = useMutation({
    mutationFn: async ({ itemId, version, minPrice, maxPrice }: { itemId: number; version: number; minPrice: string; maxPrice: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/counter-offer`, { version, minPrice, maxPrice });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send counter-offer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowCounterOffer(null);
      setCounterMin("");
      setCounterMax("");
      toast({ title: "Counter-offer sent" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to send counter-offer", variant: "destructive" });
    },
  });

  const declineItem = useMutation({
    mutationFn: async ({ itemId, reason }: { itemId: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/decline`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowDeclineDialog(null);
      setDeclineReason("");
      toast({ title: "Item rejected" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to reject item", variant: "destructive" });
    },
  });

  const acceptAll = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/requests/${params.id}/items/accept-all`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowAcceptAllConfirm(false);
      toast({ title: "All items accepted", description: `${data.accepted} item(s) have been approved.` });
    },
    onError: (err: any) => {
      setShowAcceptAllConfirm(false);
      toast({ title: "Error", description: err.message || "Failed to accept all items", variant: "destructive" });
    },
  });

  const isLoading = requestLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Request not found.</p></CardContent></Card>
      </div>
    );
  }

  if (profile?.role !== "seller") {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Only sellers can access this page.</p></CardContent></Card>
      </div>
    );
  }

  const serviceTypeLabels: Record<string, string> = {
    classic: "Classic",
    express: "Express",
    sos_dressing: "SOS Dressing",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/requests/${params.id}`)}
          data-testid="button-back-to-request"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold" data-testid="text-review-page-title">
            Review Items — {serviceTypeLabels[request.serviceType] ?? request.serviceType} #{request.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {requestItems?.length ?? 0} item{requestItems?.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {pendingItems.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""} awaiting your review
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Accept all pending items at once, or review them individually below.
            </p>
          </div>
          <Button
            className="bg-[hsl(var(--success))] text-white shrink-0"
            onClick={() => setShowAcceptAllConfirm(true)}
            disabled={acceptAll.isPending}
            data-testid="button-accept-all"
          >
            {acceptAll.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Accept All
          </Button>
        </div>
      )}

      {!requestItems || requestItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No items yet</p>
            <p className="text-xs text-muted-foreground">Items will appear here once the reseller adds them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3" data-testid="text-section-pending">
                Pending Review ({pendingItems.length})
              </h2>
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <ItemReviewCard
                    key={item.id}
                    item={item}
                    requestId={params.id}
                    onApprove={(id, version) => approveItem.mutate({ itemId: id, version })}
                    onDecline={(id) => { setShowDeclineDialog(id); setDeclineReason(""); }}
                    onCounterOffer={(id, version) => { setShowCounterOffer({ itemId: id, version }); setCounterMin(""); setCounterMax(""); }}
                    isApproving={approveItem.isPending}
                    isDeclining={declineItem.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {approvedItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3" data-testid="text-section-approved">
                Accepted ({approvedItems.length})
              </h2>
              <div className="space-y-3">
                {approvedItems.map((item) => (
                  <ItemReviewCard
                    key={item.id}
                    item={item}
                    requestId={params.id}
                    onApprove={(id, version) => approveItem.mutate({ itemId: id, version })}
                    onDecline={(id) => { setShowDeclineDialog(id); setDeclineReason(""); }}
                    onCounterOffer={(id, version) => { setShowCounterOffer({ itemId: id, version }); setCounterMin(""); setCounterMax(""); }}
                    isApproving={approveItem.isPending}
                    isDeclining={declineItem.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {otherItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3" data-testid="text-section-other">
                Other ({otherItems.length})
              </h2>
              <div className="space-y-3">
                {otherItems.map((item) => (
                  <ItemReviewCard
                    key={item.id}
                    item={item}
                    requestId={params.id}
                    onApprove={(id, version) => approveItem.mutate({ itemId: id, version })}
                    onDecline={(id) => { setShowDeclineDialog(id); setDeclineReason(""); }}
                    onCounterOffer={(id, version) => { setShowCounterOffer({ itemId: id, version }); setCounterMin(""); setCounterMax(""); }}
                    isApproving={approveItem.isPending}
                    isDeclining={declineItem.isPending}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AlertDialog open={showAcceptAllConfirm} onOpenChange={setShowAcceptAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept all pending items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will accept all {pendingItems.length} pending item{pendingItems.length !== 1 ? "s" : ""} at the proposed price ranges. The reseller will be notified. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-accept-all-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => acceptAll.mutate()}
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success)/0.9)]"
              data-testid="button-accept-all-confirm"
            >
              Accept All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showCounterOffer !== null} onOpenChange={(open) => { if (!open) { setShowCounterOffer(null); setCounterMin(""); setCounterMax(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Counter-Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Price (EUR)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={counterMin}
                  onChange={(e) => setCounterMin(e.target.value)}
                  data-testid="input-counter-min"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Price (EUR)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={counterMax}
                  onChange={(e) => setCounterMax(e.target.value)}
                  data-testid="input-counter-max"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCounterOffer(null); setCounterMin(""); setCounterMax(""); }} data-testid="button-counter-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showCounterOffer) {
                    counterOfferItem.mutate({ itemId: showCounterOffer.itemId, version: showCounterOffer.version, minPrice: counterMin, maxPrice: counterMax });
                  }
                }}
                disabled={counterOfferItem.isPending || (!counterMin && !counterMax)}
                className="bg-[hsl(var(--success))] text-white"
                data-testid="button-counter-submit"
              >
                {counterOfferItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Send Counter-Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeclineDialog !== null} onOpenChange={(open) => { if (!open) { setShowDeclineDialog(null); setDeclineReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Reason for rejection</Label>
              <Textarea
                placeholder="Please provide a reason..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                data-testid="input-decline-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowDeclineDialog(null); setDeclineReason(""); }} data-testid="button-decline-cancel">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (showDeclineDialog && declineReason.trim()) {
                    declineItem.mutate({ itemId: showDeclineDialog, reason: declineReason });
                  }
                }}
                disabled={declineItem.isPending || !declineReason.trim()}
                data-testid="button-decline-submit"
              >
                {declineItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Reject Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
