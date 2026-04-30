import { useQuery } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Item, Profile } from "@shared/schema";
import { Shirt, Search, Filter, Tag, Users, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { ItemStatusBadge } from "@/components/item-status-badge";

const itemStatusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  listed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sold: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  unsold: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  returned: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  donated: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

function ResellerGroupHeader({
  group,
}: {
  group: { reusseId: string; requestId: number | null; items: Item[]; totalMin: number; totalMax: number };
}) {
  const { t } = useI18n();
  const { data: contact } = useQuery<{ firstName?: string; lastName?: string } | null>({
    queryKey: ["/api/requests", String(group.requestId), "contact"],
    enabled: group.requestId !== null,
  });
  const resellerName = contact?.firstName
    ? `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`.trim()
    : null;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          {resellerName
            ? `${resellerName} — ${t("statusPendingApproval")}`
            : t("statusPendingApproval")}
          {" "}— {group.items.length} {t("items")}
        </span>
        {(group.totalMin > 0 || group.totalMax > 0) && (
          <span className="text-xs text-amber-600 dark:text-amber-400" data-testid={`text-group-total-${group.reusseId}`}>
            {group.totalMin > 0 && group.totalMax > 0
              ? `(${group.totalMin.toFixed(0)}–${group.totalMax.toFixed(0)} EUR total)`
              : group.totalMin > 0
              ? `(from ${group.totalMin.toFixed(0)} EUR)`
              : `(up to ${group.totalMax.toFixed(0)} EUR)`}
          </span>
        )}
      </div>
      {group.requestId && (
        <Link href={`/requests/${group.requestId}`}>
          <a className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid={`link-review-request-${group.requestId}`}>
            {t("viewDetail")} #{group.requestId}
            <ChevronRight className="h-3 w-3" />
          </a>
        </Link>
      )}
    </div>
  );
}

function ItemCard({ item, categoryLabels }: { item: Item; categoryLabels: Record<string, string> }) {
  const { t } = useI18n();
  return (
    <Card data-testid={`card-item-${item.id}`}>
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
                <Badge variant="outline" className="text-xs px-1.5 py-0" data-testid={`badge-category-${item.id}`}>
                  {categoryLabels[item.category] || item.category}
                </Badge>
                {item.condition && <span className="text-xs text-muted-foreground capitalize">{item.condition?.replace(/_/g, " ")}</span>}
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
          <ItemStatusBadge
            status={item.status}
            isNegotiating={item.sellerCounterOffer ?? false}
            testId={`badge-item-status-${item.id}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ItemsListPage() {
  const { t } = useI18n();
  const searchParams = useSearch();
  const initialSearch = new URLSearchParams(searchParams).get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
    all_fashion: t("catAllFashion"),
    clothing: t("catClothing"),
    watches_jewelry: t("catWatchesJewelry"),
    accessories_bags: t("catAccessoriesBags"),
    furniture: t("catFurniture"),
    home_appliances: t("catHomeAppliances"),
    decoration: t("catDecoration"),
    home_linen: t("catHomeLinen"),
    electronics: t("catElectronics"),
    computers: t("catComputers"),
    phones_wearables: t("catPhonesWearables"),
    books: t("catBooks"),
    wines: t("catWines"),
    musical_instruments: t("catMusicalInstruments"),
    games_toys: t("catGamesToys"),
    bicycles: t("catBicycles"),
  };

  const usedCategories = useMemo(() => {
    if (!items) return [];
    const seen: Record<string, boolean> = {};
    const cats: string[] = [];
    for (const item of items) {
      if (item.category && !seen[item.category]) {
        seen[item.category] = true;
        cats.push(item.category);
      }
    }
    return cats;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const matchesSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, search, statusFilter, categoryFilter]);

  const isSeller = profile?.role === "seller";

  const { groupedPending, otherItems } = useMemo(() => {
    if (!isSeller) return { groupedPending: [], otherItems: filteredItems };
    const pending = filteredItems.filter((i) => i.status === "pending_approval" && i.reusseId);
    const other = filteredItems.filter((i) => i.status !== "pending_approval" || !i.reusseId);
    const byReseller: Record<string, { reusseId: string; requestId: number | null; items: Item[]; totalMin: number; totalMax: number }> = {};
    for (const item of pending) {
      const key = item.reusseId!;
      if (!byReseller[key]) {
        byReseller[key] = { reusseId: key, requestId: item.requestId ?? null, items: [], totalMin: 0, totalMax: 0 };
      }
      byReseller[key].items.push(item);
      if (item.minPrice) byReseller[key].totalMin += parseFloat(item.minPrice);
      if (item.maxPrice) byReseller[key].totalMax += parseFloat(item.maxPrice);
    }
    return { groupedPending: Object.values(byReseller), otherItems: other };
  }, [filteredItems, isSeller]);

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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {usedCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{categoryLabels[cat] || cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="space-y-6">
          {isSeller && groupedPending.length > 0 && (
            <div className="space-y-4">
              {groupedPending.map((group) => (
                <div key={group.reusseId} className="space-y-2" data-testid={`group-reseller-${group.reusseId}`}>
                  <ResellerGroupHeader group={group} />
                  <div className="space-y-2 pl-2 border-l-2 border-amber-200 dark:border-amber-800">
                    {group.items.map((item) => (
                      <ItemCard key={item.id} item={item} categoryLabels={categoryLabels} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {otherItems.length > 0 && (
            <div className="space-y-3">
              {isSeller && groupedPending.length > 0 && otherItems.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("allStatuses")}</p>
              )}
              {otherItems.map((item) => (
                <ItemCard key={item.id} item={item} categoryLabels={categoryLabels} />
              ))}
            </div>
          )}
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
