import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Package, CheckCircle, Search } from "lucide-react";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const stars = [1, 2, 3, 4, 5];
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  return (
    <div className="flex gap-0.5">
      {stars.map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "R";
}

export default function ResellersPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");

  const { data: resellers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/resellers"],
  });

  const filtered = (resellers || [])
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (r.city || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "rating") return b.avgRating - a.avgRating;
      if (sort === "completed") return b.completedRequests - a.completedRequests;
      return 0;
    });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-resellers-title">{t("discoverResellers")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("featuresSubtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("resellerSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-reseller-search"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-reseller-sort">
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">{t("sortRating")}</SelectItem>
            <SelectItem value="completed">{t("sortCompleted")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p data-testid="text-no-resellers">{t("noResellersFound")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((reseller) => (
            <Card
              key={reseller.userId}
              className="hover:shadow-md transition-shadow"
              data-testid={`card-reseller-${reseller.userId}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={reseller.profileImageUrl || ""} />
                    <AvatarFallback className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] text-sm font-semibold">
                      {getInitials(reseller.firstName, reseller.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" data-testid={`text-reseller-name-${reseller.userId}`}>
                      {reseller.firstName || reseller.email?.split("@")[0] || "Reseller"}
                      {reseller.lastName ? ` ${reseller.lastName}` : ""}
                    </p>
                    {reseller.department && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {reseller.city ? `${reseller.city}, ` : ""}{reseller.department}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={reseller.avgRating} />
                  <span className="text-xs text-muted-foreground" data-testid={`text-reseller-rating-${reseller.userId}`}>
                    {reseller.avgRating > 0 ? reseller.avgRating.toFixed(1) : "—"}
                    {reseller.reviewCount > 0 && ` (${reseller.reviewCount} ${t("reviews")})`}
                  </span>
                </div>

                {reseller.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{reseller.bio}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                    {reseller.completedRequests} {t("completedRequests").toLowerCase()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {reseller.soldItems} {t("soldItems").toLowerCase()}
                  </span>
                </div>

                <Link href={`/resellers/${reseller.userId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-reseller-${reseller.userId}`}
                  >
                    {t("viewProfile")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
