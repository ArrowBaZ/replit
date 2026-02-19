import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item, Profile } from "@shared/schema";
import { Shirt } from "lucide-react";

const itemStatusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  listed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sold: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  unsold: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  returned: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  donated: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

const categoryLabels: Record<string, string> = {
  clothing: "Clothing",
  shoes: "Shoes",
  accessories: "Accessories",
};

export default function ItemsListPage() {
  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-items-title">My Items</h1>
        <p className="text-sm text-muted-foreground mt-1">Track the status of your clothing items.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Shirt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" data-testid={`text-item-name-${item.id}`}>{item.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                        {item.size && <span className="text-xs text-muted-foreground">Size {item.size}</span>}
                        <span className="text-xs text-muted-foreground">{categoryLabels[item.category] || item.category}</span>
                        <span className="text-xs text-muted-foreground capitalize">{item.condition}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {item.minPrice && item.maxPrice && (
                          <span className="text-xs text-muted-foreground">Range: {item.minPrice} - {item.maxPrice} EUR</span>
                        )}
                        {item.salePrice && (
                          <span className="text-xs font-medium text-[hsl(var(--success))]">Sold: {item.salePrice} EUR</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`shrink-0 ${itemStatusColors[item.status] || ""}`}>
                    {item.status.replace(/_/g, " ")}
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
            <p className="text-sm font-medium mb-1">No items yet</p>
            <p className="text-xs text-muted-foreground">
              Items will appear here once a Reusse adds them to your requests.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
