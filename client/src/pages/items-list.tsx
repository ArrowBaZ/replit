import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Item, Profile } from "@shared/schema";
import { Shirt, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const itemStatusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  listed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sold: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  unsold: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  returned: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  donated: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

export default function ItemsListPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending_approval: t("statusPendingApproval"),
      approved: t("statusApproved"),
      listed: t("statusListed"),
      sold: t("statusSold"),
    };
    return statusMap[status] || status.replace(/_/g, " ");
  };

  const categoryLabels: Record<string, string> = {
    tops: t("catTops"),
    bottoms: t("catBottoms"),
    dresses: t("catDresses"),
    outerwear: t("catOuterwear"),
    shoes: t("catShoes"),
    accessories: t("catAccessories"),
    clothing: t("catTops"),
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const matchesSearch = !search || 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-items-title">{t("myItemsTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("itemsWillAppear")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchItems")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-items"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="pending_approval">{t("statusPendingApproval")}</SelectItem>
            <SelectItem value="approved">{t("statusApproved")}</SelectItem>
            <SelectItem value="listed">{t("statusListed")}</SelectItem>
            <SelectItem value="sold">{t("statusSold")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {item.photos && item.photos.length > 0 ? (
                      <div className="h-14 w-14 rounded-md overflow-hidden shrink-0 border">
                        <img src={item.photos[0]} alt={item.title} className="h-full w-full object-cover" data-testid={`img-item-${item.id}`} />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Shirt className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium" data-testid={`text-item-name-${item.id}`}>{item.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                        {item.size && <span className="text-xs text-muted-foreground">{t("size")} {item.size}</span>}
                        <span className="text-xs text-muted-foreground">{categoryLabels[item.category] || item.category}</span>
                        <span className="text-xs text-muted-foreground capitalize">{item.condition?.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {item.minPrice && item.maxPrice && (
                          <span className="text-xs text-muted-foreground">{item.minPrice} - {item.maxPrice} EUR</span>
                        )}
                        {item.salePrice && (
                          <span className="text-xs font-medium text-[hsl(var(--success))]">{t("statusSold")}: {item.salePrice} EUR</span>
                        )}
                      </div>
                      {item.photos && item.photos.length > 1 && (
                        <div className="flex gap-1 mt-1.5">
                          {item.photos.slice(1, 4).map((photo: string, idx: number) => (
                            <div key={idx} className="h-8 w-8 rounded overflow-hidden border">
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {item.photos.length > 4 && (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{item.photos.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`shrink-0 ${itemStatusColors[item.status] || ""}`}>
                    {translateStatus(item.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shirt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">{items && items.length > 0 ? t("noMatchingItems") : t("noItemsYet")}</p>
            <p className="text-xs text-muted-foreground">
              {t("itemsWillAppear")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
