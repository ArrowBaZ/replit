import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, MapPin, CheckCircle, Package, MessageSquare } from "lucide-react";
import type { Profile } from "@shared/schema";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          data-testid={`star-${s}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${s <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "R";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-3">
      <p className="text-xl font-bold" data-testid={`stat-${label}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function ResellerDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery<Profile>({ queryKey: ["/api/profile"] });
  const isSeller = profile?.role === "seller";

  const { data: reseller, isLoading: resellerLoading } = useQuery<any>({
    queryKey: ["/api/resellers", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/resellers/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ["/api/resellers", params.id, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/resellers/${params.id}/reviews`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: myRequests } = useQuery<any[]>({
    queryKey: ["/api/requests"],
    enabled: isSeller,
  });

  const completedWithThis = (myRequests || []).filter(
    (r: any) => r.reusseId === params.id && r.status === "completed"
  );
  const canReview = isSeller && completedWithThis.length > 0;

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(
    completedWithThis[0]?.id ?? null
  );
  const [rating, setRating] = useState(0);
  const [commRating, setCommRating] = useState(0);
  const [relRating, setRelRating] = useState(0);
  const [handlingRating, setHandlingRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) throw new Error("No request selected");
      const res = await apiRequest("POST", `/api/requests/${selectedRequest}/review`, {
        rating,
        comment: comment || undefined,
        communicationRating: commRating || undefined,
        reliabilityRating: relRating || undefined,
        handlingRating: handlingRating || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers", params.id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers", params.id] });
      setShowReviewForm(false);
      setRating(0);
      setCommRating(0);
      setRelRating(0);
      setHandlingRating(0);
      setComment("");
      toast({ title: t("reviewSubmitted") });
    },
  });

  if (resellerLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!reseller) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto text-center text-muted-foreground">
        <p>Reseller not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => setLocation("/resellers")} data-testid="button-back-resellers">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold" data-testid="text-reseller-profile-title">{t("resellerProfile")}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={reseller.profileImageUrl || ""} />
              <AvatarFallback className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] text-xl font-semibold">
                {getInitials(reseller.firstName, reseller.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold" data-testid="text-reseller-name">
                {reseller.firstName || reseller.email?.split("@")[0] || "Reseller"}
                {reseller.lastName ? ` ${reseller.lastName}` : ""}
              </h2>
              {(reseller.department || reseller.city) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {reseller.city ? `${reseller.city}, ` : ""}{reseller.department}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <StarDisplay rating={reseller.avgRating} size="md" />
                <span className="text-sm font-medium" data-testid="text-avg-rating">
                  {reseller.avgRating > 0 ? reseller.avgRating.toFixed(1) : "—"}
                </span>
                {reseller.reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground">({reseller.reviewCount} {t("reviews")})</span>
                )}
              </div>
              {reseller.bio ? (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{reseller.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground/50 mt-2 italic">{t("noBio")}</p>
              )}
              {reseller.experience && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  <span className="font-medium not-italic text-foreground">{t("resaleExperience")}: </span>
                  {reseller.experience}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">{t("resellerStats")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-t">
            <StatCard label={t("completedRequests")} value={reseller.completedRequests} />
            <StatCard label={t("soldItems")} value={reseller.soldItems} />
            <StatCard label={t("avgCommunication")} value={reseller.avgCommunication > 0 ? reseller.avgCommunication.toFixed(1) : "—"} />
            <StatCard label={t("avgReliability")} value={reseller.avgReliability > 0 ? reseller.avgReliability.toFixed(1) : "—"} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {t("reviewsSection")}
          </h3>
          {canReview && !showReviewForm && (
            <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)} data-testid="button-leave-review">
              {t("leaveReview")}
            </Button>
          )}
        </div>

        {showReviewForm && (
          <Card className="border-[hsl(var(--success))]/30">
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-medium">{t("leaveReview")}</p>

              {completedWithThis.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("request")}</Label>
                  <select
                    className="w-full text-sm border rounded-md p-2 bg-background"
                    value={selectedRequest ?? ""}
                    onChange={(e) => setSelectedRequest(Number(e.target.value))}
                    data-testid="select-review-request"
                  >
                    {completedWithThis.map((r: any) => (
                      <option key={r.id} value={r.id}>#{r.id} — {r.serviceType}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">{t("overallRating")} *</Label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("communication")}</Label>
                  <StarPicker value={commRating} onChange={setCommRating} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("reliability")}</Label>
                  <StarPicker value={relRating} onChange={setRelRating} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("itemHandling")}</Label>
                  <StarPicker value={handlingRating} onChange={setHandlingRating} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("reviewComment")}</Label>
                <Textarea
                  rows={3}
                  className="resize-none"
                  placeholder={t("reviewCommentPlaceholder")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  data-testid="input-review-comment"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
                  disabled={rating === 0 || submitReview.isPending}
                  onClick={() => submitReview.mutate()}
                  data-testid="button-submit-review"
                >
                  {t("submitReview")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReviewForm(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reviewsLoading ? (
          <Skeleton className="h-24" />
        ) : !reviews || reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-reviews">{t("noReviews")}</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <Card key={review.id} data-testid={`card-review-${review.id}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}
                  {(review.communicationRating || review.reliabilityRating || review.handlingRating) && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {review.communicationRating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {t("communication")}: <StarDisplay rating={review.communicationRating} />
                        </span>
                      )}
                      {review.reliabilityRating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {t("reliability")}: <StarDisplay rating={review.reliabilityRating} />
                        </span>
                      )}
                      {review.handlingRating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {t("itemHandling")}: <StarDisplay rating={review.handlingRating} />
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
