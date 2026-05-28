import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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

export default function MarchangsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");

  const { data: marchands, isLoading } = useQuery<any[]>({
    queryKey: ["/api/marchands"],
  });

  const filtered = (marchands || [])
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const name = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (m.city || "").toLowerCase().includes(q) ||
        (m.department || "").toLowerCase().includes(q)
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
        <h1 className="text-2xl font-bold" data-testid="text-marchands-title">{t("discoverMarchands")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("featuresSubtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("marchandSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-marchand-search"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-marchand-sort">
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
          <p data-testid="text-no-marchands">{t("noMarchangsFound")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((marchand) => (
            <Card
              key={marchand.userId}
              className="hover:shadow-md transition-shadow"
              data-testid={`card-marchand-${marchand.userId}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={marchand.profileImageUrl || ""} />
                    <AvatarFallback className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] text-sm font-semibold">
                      {getInitials(marchand.firstName, marchand.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" data-testid={`text-marchand-name-${marchand.userId}`}>
                      {marchand.firstName || marchand.email?.split("@")[0] || "Marchand"}
                      {marchand.lastName ? ` ${marchand.lastName}` : ""}
                    </p>
                    {marchand.department && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {marchand.city ? `${marchand.city}, ` : ""}{marchand.department}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={marchand.avgRating} />
                  <span className="text-xs text-muted-foreground" data-testid={`text-marchand-rating-${marchand.userId}`}>
                    {marchand.avgRating > 0 ? marchand.avgRating.toFixed(1) : "—"}
                    {marchand.reviewCount > 0 && ` (${marchand.reviewCount} ${t("reviews")})`}
                  </span>
                </div>

                {marchand.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{marchand.bio}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                    {marchand.completedRequests} {t("completedRequests").toLowerCase()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {marchand.soldItems} {t("soldItems").toLowerCase()}
                  </span>
                </div>

                <Link href={`/marchands/${marchand.userId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-marchand-${marchand.userId}`}
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
