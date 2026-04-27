import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Percent, Plus, Pencil, Trash2, History, Layers, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { FeeTier, Item } from "@shared/schema";

interface FeeTierChangelog {
  id: number;
  feeTierId: number | null;
  adminId: string;
  action: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedAt: string;
  tierLabel: string | null;
  adminName: string | null;
}

const tierFormSchema = z
  .object({
    label: z.string().min(1, "Label is required"),
    minPrice: z.string().min(1, "Min price is required"),
    maxPrice: z.string().optional(),
    sellerPercent: z.string().min(1, "Required"),
    resellerPercent: z.string().min(1, "Required"),
    platformPercent: z.string().min(1, "Required"),
    currencyNote: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const s = parseFloat(data.sellerPercent);
    const r = parseFloat(data.resellerPercent);
    const p = parseFloat(data.platformPercent);
    const total = s + r + p;
    if (Math.abs(total - 100) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must sum to 100% (currently ${total.toFixed(2)}%)`,
        path: ["platformPercent"],
      });
    }
  });

type TierFormValues = z.infer<typeof tierFormSchema>;

function TierForm({
  defaultValues,
  onSubmit,
  isPending,
  serverError,
  onClearError,
}: {
  defaultValues?: Partial<TierFormValues>;
  onSubmit: (v: TierFormValues) => void;
  isPending: boolean;
  serverError?: string | null;
  onClearError?: () => void;
}) {
  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierFormSchema),
    defaultValues: {
      label: "",
      minPrice: "",
      maxPrice: "",
      sellerPercent: "",
      resellerPercent: "",
      platformPercent: "",
      currencyNote: "EUR/CHF",
      ...defaultValues,
    },
  });

  const seller = parseFloat(form.watch("sellerPercent") || "0");
  const reseller = parseFloat(form.watch("resellerPercent") || "0");
  const platform = parseFloat(form.watch("platformPercent") || "0");
  const total = isNaN(seller + reseller + platform) ? 0 : seller + reseller + platform;
  const totalOk = Math.abs(total - 100) < 0.01;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Tier Label</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Entry (€60–€150)" {...field} data-testid="input-tier-label" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Price (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number" min="0" step="0.01" placeholder="0"
                    {...field}
                    onChange={(e) => { field.onChange(e); onClearError?.(); }}
                    data-testid="input-tier-min-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Price (€, blank = unlimited)</FormLabel>
                <FormControl>
                  <Input
                    type="number" min="0" step="0.01" placeholder="Unlimited"
                    {...field}
                    onChange={(e) => { field.onChange(e); onClearError?.(); }}
                    data-testid="input-tier-max-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Fee Split (must sum to 100%)</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalOk ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`} data-testid="text-total-pct">
              Total: {isNaN(total) ? "—" : total.toFixed(2)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="sellerPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seller %</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="50" {...field} data-testid="input-seller-percent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resellerPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reseller %</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="40" {...field} data-testid="input-reseller-percent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platformPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform %</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="10" {...field} data-testid="input-platform-percent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="currencyNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Note</FormLabel>
              <FormControl>
                <Input placeholder="EUR/CHF" {...field} data-testid="input-currency-note" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400"
            data-testid="error-overlap-inline"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500 dark:text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending} data-testid="button-save-tier">
            {isPending ? "Saving..." : "Save Tier"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface CoverageGap {
  from: number;
  to: number;
}

interface CoverageOverlap {
  tierA: string;
  tierB: string;
  from: number;
  to: number;
}

interface CoverageSummary {
  activeTierCount: number;
  coverageMin: number | null;
  coverageMax: number | null;
  hasUnlimitedMax: boolean;
  gaps: CoverageGap[];
  overlaps: CoverageOverlap[];
}

function computeCoverage(tiers: FeeTier[]): CoverageSummary {
  const activeTiers = tiers
    .filter((t) => t.isActive)
    .sort((a, b) => parseFloat(a.minPrice ?? "0") - parseFloat(b.minPrice ?? "0"));

  if (activeTiers.length === 0) {
    return { activeTierCount: 0, coverageMin: null, coverageMax: null, hasUnlimitedMax: false, gaps: [], overlaps: [] };
  }

  const coverageMin = parseFloat(activeTiers[0].minPrice ?? "0");
  const lastTier = activeTiers[activeTiers.length - 1];
  const hasUnlimitedMax = !lastTier.maxPrice;
  const coverageMax = hasUnlimitedMax ? null : parseFloat(lastTier.maxPrice!);

  const gaps: CoverageGap[] = [];
  const overlaps: CoverageOverlap[] = [];

  for (let i = 0; i < activeTiers.length - 1; i++) {
    const a = activeTiers[i];
    const aMin = parseFloat(a.minPrice ?? "0");
    const aMax = a.maxPrice ? parseFloat(a.maxPrice) : Infinity;

    for (let j = i + 1; j < activeTiers.length; j++) {
      const b = activeTiers[j];
      const bMin = parseFloat(b.minPrice ?? "0");
      const bMax = b.maxPrice ? parseFloat(b.maxPrice) : Infinity;

      const overlapFrom = Math.max(aMin, bMin);
      const overlapTo = Math.min(aMax, bMax);
      if (overlapTo >= overlapFrom) {
        overlaps.push({ tierA: a.label, tierB: b.label, from: overlapFrom, to: overlapTo });
      }
    }

    const currentMax = aMax === Infinity ? null : aMax;
    const nextMin = parseFloat(activeTiers[i + 1].minPrice ?? "0");
    if (currentMax !== null && nextMin > currentMax) {
      gaps.push({ from: currentMax, to: nextMin });
    }
  }

  return { activeTierCount: activeTiers.length, coverageMin, coverageMax, hasUnlimitedMax, gaps, overlaps };
}

function CoverageIndicator({ tiers, isLoading }: { tiers: FeeTier[]; isLoading: boolean }) {
  if (isLoading) return null;

  const { activeTierCount, coverageMin, coverageMax, hasUnlimitedMax, gaps, overlaps } = computeCoverage(tiers);

  if (activeTierCount === 0) {
    return (
      <div
        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 p-4"
        data-testid="coverage-indicator-no-tiers"
      >
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">No active fee tiers</p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5">
            All transactions will be blocked until at least one active fee tier is configured.
          </p>
        </div>
      </div>
    );
  }

  const fmt = (v: number) =>
    `€${v.toLocaleString("fr-CH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const hasFallback = !hasUnlimitedMax;
  const hasGaps = gaps.length > 0;
  const hasOverlaps = overlaps.length > 0;

  if (hasOverlaps) {
    return (
      <div
        className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 p-4"
        data-testid="coverage-indicator-overlaps"
      >
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-red-800 dark:text-red-300">
            Overlapping tiers detected — fee splits may be applied incorrectly
          </p>
          {overlaps.map((o, i) => (
            <p key={i} className="text-red-700 dark:text-red-400" data-testid={`coverage-overlap-${i}`}>
              "{o.tierA}" and "{o.tierB}" both cover {fmt(o.from)}–{o.to === Infinity ? "∞" : fmt(o.to)}.
              Edit one of these tiers to eliminate the overlap.
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (!hasFallback && !hasGaps) {
    return (
      <div
        className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20 p-4"
        data-testid="coverage-indicator-full"
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            Full coverage — {fmt(coverageMin!)} and above
          </p>
          <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
            All prices from {fmt(coverageMin!)} upward are covered by {activeTierCount} active{" "}
            {activeTierCount === 1 ? "tier" : "tiers"}. No fallback logic will be used.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 p-4"
      data-testid="coverage-indicator-partial"
    >
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div className="text-sm space-y-1">
        <p className="font-semibold text-amber-800 dark:text-amber-300">
          Partial coverage — {fmt(coverageMin!)}–{coverageMax !== null ? fmt(coverageMax) : "∞"}
        </p>
        {hasFallback && (
          <p className="text-amber-700 dark:text-amber-400" data-testid="coverage-fallback-warning">
            Prices above {fmt(coverageMax!)} are not covered — transactions at those prices will be
            blocked until a matching tier is added.
          </p>
        )}
        {hasGaps &&
          gaps.map((g, i) => (
            <p key={i} className="text-amber-700 dark:text-amber-400" data-testid={`coverage-gap-${i}`}>
              Gap detected: prices between {fmt(g.from)} and {fmt(g.to)} are not covered by any tier.
            </p>
          ))}
      </div>
    </div>
  );
}

function UncoveredItemsBanner({
  onAddTier,
}: {
  onAddTier: () => void;
}) {
  const [, navigate] = useLocation();
  const { data: uncoveredItems = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/admin/fee-tiers/uncovered-items"],
  });

  if (isLoading || uncoveredItems.length === 0) return null;

  const fmt = (v: string | number | null) => {
    if (!v) return "—";
    return `€${parseFloat(v as string).toLocaleString("fr-CH", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 p-4 space-y-3"
      data-testid="banner-uncovered-items"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            {uncoveredItems.length} item{uncoveredItems.length !== 1 ? "s" : ""} with approved prices not covered by any active tier
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
            These transactions will be blocked until a matching fee tier is added.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/40"
          onClick={onAddTier}
          data-testid="button-add-tier-from-banner"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Covering Tier
        </Button>
      </div>
      <div className="space-y-1.5 pl-8" data-testid="list-uncovered-items">
        {uncoveredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full text-left flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm bg-red-100/60 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
            onClick={() => navigate(`/items?search=${encodeURIComponent(item.title)}`)}
            data-testid={`button-uncovered-item-${item.id}`}
          >
            <span className="font-medium text-red-900 dark:text-red-200 truncate">
              {item.title}
            </span>
            <span className="shrink-0 text-xs font-semibold text-red-700 dark:text-red-300 tabular-nums">
              Approved: {fmt(item.approvedPrice)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminFeeTiersPage() {
  const { toast } = useToast();
  const [editTier, setEditTier] = useState<FeeTier | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [createServerError, setCreateServerError] = useState<string | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);

  const { data: tiers = [], isLoading } = useQuery<FeeTier[]>({
    queryKey: ["/api/admin/fee-tiers"],
  });

  const { data: changelog = [], isLoading: changelogLoading } = useQuery<FeeTierChangelog[]>({
    queryKey: ["/api/admin/fee-tiers/changelog"],
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-tiers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-tiers/changelog"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-tiers/uncovered-items"] });
  }

  function parseMutationError(e: any): { message: string; errorCode?: string } {
    const raw: string = e?.message ?? "";
    const jsonStart = raw.indexOf("{");
    if (jsonStart !== -1) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart));
        return { message: parsed.message ?? raw, errorCode: parsed.errorCode };
      } catch {
      }
    }
    return { message: raw };
  }

  const createMutation = useMutation({
    mutationFn: (data: TierFormValues) =>
      apiRequest("POST", "/api/admin/fee-tiers", data),
    onSuccess: () => {
      invalidateAll();
      setCreateOpen(false);
      setCreateServerError(null);
      toast({ title: "Fee tier created" });
    },
    onError: (e: any) => {
      const { message, errorCode } = parseMutationError(e);
      if (errorCode === "TIER_OVERLAP") {
        setCreateServerError(message);
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TierFormValues }) =>
      apiRequest("PATCH", `/api/admin/fee-tiers/${id}`, data),
    onSuccess: () => {
      invalidateAll();
      setEditTier(null);
      setEditServerError(null);
      toast({ title: "Fee tier updated" });
    },
    onError: (e: any) => {
      const { message, errorCode } = parseMutationError(e);
      if (errorCode === "TIER_OVERLAP") {
        setEditServerError(message);
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/fee-tiers/${id}`),
    onSuccess: () => {
      invalidateAll();
      setDeleteId(null);
      toast({ title: "Fee tier deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function formatPercent(v: string | number) {
    return `${parseFloat(v as string).toFixed(1)}%`;
  }

  function formatPrice(v: string | number | null) {
    if (!v) return "—";
    return `€${parseFloat(v as string).toLocaleString("fr-CH", { minimumFractionDigits: 2 })}`;
  }

  function getDefaultValues(tier: FeeTier): TierFormValues {
    return {
      label: tier.label,
      minPrice: tier.minPrice?.toString() || "",
      maxPrice: tier.maxPrice?.toString() || "",
      sellerPercent: tier.sellerPercent?.toString() || "",
      resellerPercent: tier.resellerPercent?.toString() || "",
      platformPercent: tier.platformPercent?.toString() || "",
      currencyNote: tier.currencyNote || "EUR/CHF",
    };
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
            <Percent className="h-5 w-5 text-[hsl(var(--success))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-fee-tiers">Fee Tiers</h1>
            <p className="text-sm text-muted-foreground">Configure tiered fee splits for transactions</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-add-tier">
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>
      </div>

      <CoverageIndicator tiers={tiers} isLoading={isLoading} />

      <UncoveredItemsBanner onAddTier={() => setCreateOpen(true)} />

      <Tabs defaultValue="tiers">
        <TabsList data-testid="tabs-fee-tiers">
          <TabsTrigger value="tiers" data-testid="tab-tiers">
            <Layers className="h-4 w-4 mr-2" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="changelog" data-testid="tab-changelog">
            <History className="h-4 w-4 mr-2" />
            Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : tiers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No fee tiers configured</p>
                <p className="text-sm mt-1">Add a tier to replace the hardcoded fee logic.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="list-fee-tiers">
              {tiers.map((tier) => (
                <Card key={tier.id} data-testid={`card-tier-${tier.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" data-testid={`text-tier-label-${tier.id}`}>{tier.label}</span>
                          <Badge variant={tier.isActive ? "default" : "secondary"} data-testid={`badge-tier-active-${tier.id}`}>
                            {tier.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {tier.currencyNote && (
                            <span className="text-xs text-muted-foreground">{tier.currencyNote}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Price range: {formatPrice(tier.minPrice)} – {tier.maxPrice ? formatPrice(tier.maxPrice) : "Unlimited"}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center" data-testid={`text-seller-pct-${tier.id}`}>
                          <p className="text-xs text-muted-foreground">Seller</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatPercent(tier.sellerPercent)}</p>
                        </div>
                        <div className="text-center" data-testid={`text-reseller-pct-${tier.id}`}>
                          <p className="text-xs text-muted-foreground">Reseller</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{formatPercent(tier.resellerPercent)}</p>
                        </div>
                        <div className="text-center" data-testid={`text-platform-pct-${tier.id}`}>
                          <p className="text-xs text-muted-foreground">Platform</p>
                          <p className="font-bold text-purple-600 dark:text-purple-400">{formatPercent(tier.platformPercent)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditTier(tier)}
                          data-testid={`button-edit-tier-${tier.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(tier.id)}
                          data-testid={`button-delete-tier-${tier.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="changelog" className="mt-4">
          {changelogLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : changelog.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No changes recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2" data-testid="list-changelog">
              {changelog.map((entry) => {
                const prev = entry.previousValues;
                const next = entry.newValues;
                const diffKeys = entry.action === "update" && prev && next
                  ? Object.keys({ ...prev, ...next }).filter(
                      (k) => !["id", "createdAt", "isActive"].includes(k) && String(prev![k]) !== String(next![k])
                    )
                  : [];
                return (
                  <Card key={entry.id} data-testid={`card-changelog-${entry.id}`}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge
                          variant={entry.action === "create" ? "default" : entry.action === "delete" ? "destructive" : "secondary"}
                          className="capitalize"
                          data-testid={`badge-action-${entry.id}`}
                        >
                          {entry.action}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {entry.tierLabel || `Tier #${entry.feeTierId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {entry.adminName || entry.adminId}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground" data-testid={`text-changelog-date-${entry.id}`}>
                          {new Date(entry.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {diffKeys.length > 0 && (
                        <div className="mt-2 space-y-1" data-testid={`diff-changelog-${entry.id}`}>
                          {diffKeys.map((k) => (
                            <div key={k} className="flex items-center gap-2 text-xs">
                              <span className="font-medium text-muted-foreground w-28 shrink-0">{k}:</span>
                              <span className="line-through text-red-500 dark:text-red-400">{String(prev![k] ?? "—")}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-emerald-600 dark:text-emerald-400">{String(next![k] ?? "—")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.action === "create" && next && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {["sellerPercent","resellerPercent","platformPercent"].map((k) => (
                            <span key={k} className="mr-3">{k}: <span className="font-medium text-foreground">{String(next[k] ?? "—")}%</span></span>
                          ))}
                          <span>range: {String(next.minPrice ?? "0")}–{String(next.maxPrice ?? "∞")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setCreateServerError(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Fee Tier</DialogTitle>
          </DialogHeader>
          <TierForm
            onSubmit={(v) => createMutation.mutate(v)}
            isPending={createMutation.isPending}
            serverError={createServerError}
            onClearError={() => setCreateServerError(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTier} onOpenChange={(open) => { if (!open) { setEditTier(null); setEditServerError(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Fee Tier</DialogTitle>
          </DialogHeader>
          {editTier && (
            <TierForm
              defaultValues={getDefaultValues(editTier)}
              onSubmit={(v) => updateMutation.mutate({ id: editTier.id, data: v })}
              isPending={updateMutation.isPending}
              serverError={editServerError}
              onClearError={() => setEditServerError(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Fee Tier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the fee tier so it is no longer applied to new transactions. Existing transactions that referenced it will retain their snapshot data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
