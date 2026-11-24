import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LedgerEntry {
  key: string;
  kind: "stripe" | "manual";
  createdAt: string | null;
  status: string;
  amount: string;
  currency: string;
  payerUserId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  sellerName: string | null;
  marchantName: string | null;
  itemTitles: string[];
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface OwedPayout {
  id: number;
  paymentId: number;
  transactionId: number;
  userId: string;
  role: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  bankAccountHolder: string | null;
  bankIban: string | null;
  bankBic: string | null;
  itemTitle: string | null;
}

export default function AdminTransactionsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const search = useSearch();
  const initialUser = new URLSearchParams(search).get("userId") || "all";
  const [userId, setUserId] = useState(initialUser);

  const { data: users } = useQuery<AdminUser[]>({ queryKey: ["/api/admin/users"] });
  const { data: entries, isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/admin/transactions", userId],
    queryFn: async () => {
      const query = userId !== "all" ? `?userId=${encodeURIComponent(userId)}` : "";
      const res = await fetch(`/api/admin/transactions${query}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: owedPayouts, isLoading: owedLoading } = useQuery<OwedPayout[]>({
    queryKey: ["/api/admin/payouts", "owed"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payouts?status=owed", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const [transferRefs, setTransferRefs] = useState<Record<number, string>>({});

  const markPaid = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/payouts/${id}/paid`, {
        transferReference: transferRefs[id] || "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({ title: t("payoutMarkedPaid") });
    },
    onError: (error: Error) => {
      toast({ title: t("payoutMarkPaidFailed"), description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("transactions")}</h1>
          <p className="text-sm text-muted-foreground">{t("transactionsSubtitle")}</p>
        </div>
        <div className="w-64">
          <p className="text-xs text-muted-foreground mb-1">{t("filterByUser")}</p>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger data-testid="select-user-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || user.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card data-testid="card-owed-payouts">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("owedPayouts")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("owedPayoutsDesc")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {owedLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !owedPayouts || owedPayouts.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-owed-payouts">{t("noOwedPayouts")}</p>
          ) : (
            owedPayouts.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3"
                data-testid={`owed-payout-${row.id}`}
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium">{row.itemTitle || `Payment #${row.paymentId}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(row.role === "marchand" ? "reseller" : "seller")}: {row.recipientName || row.recipientEmail || row.userId}
                    {row.createdAt ? ` · ${new Date(row.createdAt).toLocaleString()}` : ""}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground" data-testid={`owed-payout-iban-${row.id}`}>
                    {t("bankAccountHolder")}: {row.bankAccountHolder || "—"} · {t("bankIban")}: {row.bankIban || "—"} · {t("bankBic")}: {row.bankBic || "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-semibold">€{row.amount}</p>
                  <Input
                    className="w-56"
                    placeholder={t("transferReferencePlaceholder")}
                    value={transferRefs[row.id] || ""}
                    onChange={(e) => setTransferRefs((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    data-testid={`input-transfer-ref-${row.id}`}
                  />
                  <Button
                    size="sm"
                    disabled={markPaid.isPending || !(transferRefs[row.id] || "").trim()}
                    onClick={() => markPaid.mutate(row.id)}
                    data-testid={`button-mark-paid-${row.id}`}
                  >
                    {t("markPayoutPaid")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !entries || entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("noTransactions")}</CardContent>
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.key} data-testid={`txn-${entry.key}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{entry.itemTitles.join(", ") || t("manualSale")}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">€{entry.amount}</p>
                  <Badge variant="secondary">{entry.status}</Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>{t("payer")}: {entry.payerName || entry.payerEmail || "—"}</span>
                <span>{t("seller")}: {entry.sellerName || "—"}</span>
                <span>{t("reseller")}: {entry.marchantName || "—"}</span>
                <span>{entry.kind === "stripe" ? "Stripe" : t("manualSale")}</span>
              </div>
              {entry.stripePaymentIntentId && (
                <p className="text-xs font-mono text-muted-foreground">{entry.stripePaymentIntentId}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
