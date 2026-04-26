import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileSignature, CheckCircle, Clock, User, Package, Printer, Download } from "lucide-react";
import { useState } from "react";
import type { Request } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

interface SnapshotFees {
  sellerAmount: number;
  resellerAmount: number;
  platformAmount: number;
  sellerPct?: number;
  resellerPct?: number;
  platformPct?: number;
}

interface AgreementDetail {
  id: number;
  requestId: number;
  sellerId: string;
  reusseId: string;
  status: string;
  itemCount: number;
  totalValue: string;
  itemsSnapshot: string;
  feeBreakdown: string | null;
  generatedAt: string;
  seller: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  reusse: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  request: Request | null;
  signatures: Array<{
    id: number;
    agreementId: number;
    userId: string;
    role: string;
    signedAt: string;
    userName: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  seller_signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  reseller_signed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  fully_signed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const statusLabels: Record<string, string> = {
  pending: "Unsigned",
  seller_signed: "Seller Signed",
  reseller_signed: "Reseller Signed",
  fully_signed: "Fully Signed",
};

function userName(u: { firstName: string | null; lastName: string | null; email: string | null } | null): string {
  if (!u) return "Unknown";
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return name || u.email || "Unknown";
}

function downloadAgreementPdf(agreement: AgreementDetail): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 18;

  const fmt = (n: number) => `€${n.toFixed(2)}`;

  const items = JSON.parse(agreement.itemsSnapshot) as Array<{
    id: number;
    title: string;
    approvedPrice: number;
    fees: SnapshotFees;
  }>;

  const totalValue = parseFloat(agreement.totalValue);
  const totalFees = items.reduce(
    (acc, item) => ({
      seller: acc.seller + item.fees.sellerAmount,
      reseller: acc.reseller + item.fees.resellerAmount,
      platform: acc.platform + item.fees.platformAmount,
    }),
    { seller: 0, reseller: 0, platform: 0 }
  );

  const sellerSig = agreement.signatures.find((s) => s.userId === agreement.sellerId);
  const reusseSig = agreement.signatures.find((s) => s.userId === agreement.reusseId);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Agreement #${agreement.id}`, margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`For Request #${agreement.requestId}  ·  Status: ${statusLabels[agreement.status] || agreement.status}`, margin, y);
  y += 5;
  doc.text(`Generated on: ${new Date(agreement.generatedAt).toLocaleString("fr-FR")}`, margin, y);
  y += 10;
  doc.setTextColor(0);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Parties", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Seller: ${userName(agreement.seller)}${agreement.seller?.email ? `  <${agreement.seller.email}>` : ""}`, margin, y);
  y += 5;
  doc.text(`Reseller: ${userName(agreement.reusse)}${agreement.reusse?.email ? `  <${agreement.reusse.email}>` : ""}`, margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Item List & Fee Breakdown", margin, y);
  y += 4;

  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;
  function ensureSpace(needed: number): number {
    if (y + needed > pageHeight - bottomMargin) {
      doc.addPage();
      return 18;
    }
    return y;
  }

  const pctStr = (v: number | undefined) => (v != null ? ` (${v}%)` : "");

  const tableBody = items.map((item) => [
    item.title,
    fmt(item.approvedPrice),
    `${fmt(item.fees.sellerAmount)}${pctStr(item.fees.sellerPct)}`,
    `${fmt(item.fees.resellerAmount)}${pctStr(item.fees.resellerPct)}`,
    `${fmt(item.fees.platformAmount)}${pctStr(item.fees.platformPct)}`,
  ]);

  tableBody.push([
    `Totals (${agreement.itemCount} items)`,
    fmt(totalValue),
    fmt(totalFees.seller),
    fmt(totalFees.reseller),
    fmt(totalFees.platform),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Item", "Price", "Seller", "Reseller", "Platform"]],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60, 60, 60] },
    foot: [],
    didParseCell: (data) => {
      if (data.row.index === tableBody.length - 1 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  const splits = Array.from(
    new Map(
      items
        .filter((it) => it.fees.sellerPct != null && it.fees.resellerPct != null && it.fees.platformPct != null)
        .map((it) => [`${it.fees.sellerPct}-${it.fees.resellerPct}-${it.fees.platformPct}`, it.fees] as [string, SnapshotFees])
    ).values()
  );
  if (splits.length > 0) {
    y = ensureSpace(5 + splits.length * 5 + 3);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("Fee splits applied in this agreement:", margin, y);
    y += 5;
    splits.forEach((f) => {
      doc.text(`Seller ${f.sellerPct ?? "?"}% / Reseller ${f.resellerPct ?? "?"}% / Platform ${f.platformPct ?? "?"}%`, margin + 4, y);
      y += 5;
    });
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    y += 3;
  }

  y = ensureSpace(30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Signature Records", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (sellerSig) {
    doc.text(`Seller — ${userName(agreement.seller)}: Signed on ${new Date(sellerSig.signedAt).toLocaleString("fr-FR")}`, margin, y);
  } else {
    doc.text(`Seller — ${userName(agreement.seller)}: Awaiting signature`, margin, y);
  }
  y += 5;
  if (reusseSig) {
    doc.text(`Reseller — ${userName(agreement.reusse)}: Signed on ${new Date(reusseSig.signedAt).toLocaleString("fr-FR")}`, margin, y);
  } else {
    doc.text(`Reseller — ${userName(agreement.reusse)}: Awaiting signature`, margin, y);
  }
  y += 10;

  if (agreement.status === "fully_signed") {
    y = ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("This agreement is fully signed and binding.", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
  }

  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    `Agreement #${agreement.id} · Request #${agreement.requestId} · Generated ${new Date(agreement.generatedAt).toLocaleString("fr-FR")}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  doc.save(`agreement-${agreement.id}.pdf`);
}

export default function AgreementDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);

  const { data: agreement, isLoading } = useQuery<AgreementDetail>({
    queryKey: ["/api/agreements", params.id],
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/agreements/${params.id}/sign`, { agreed: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements", params.id] });
      toast({ title: "Agreement Signed", description: "Your signature has been recorded." });
      setAgreed(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to sign", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Agreement not found.</p></CardContent></Card>
      </div>
    );
  }

  const items = JSON.parse(agreement.itemsSnapshot) as Array<{
    id: number;
    title: string;
    approvedPrice: number;
    fees: SnapshotFees;
  }>;

  const totalValue = parseFloat(agreement.totalValue);
  const totalFees = items.reduce(
    (acc, item) => ({
      seller: acc.seller + item.fees.sellerAmount,
      reseller: acc.reseller + item.fees.resellerAmount,
      platform: acc.platform + item.fees.platformAmount,
    }),
    { seller: 0, reseller: 0, platform: 0 }
  );

  const sellerSig = agreement.signatures.find((s) => s.userId === agreement.sellerId);
  const reusseSig = agreement.signatures.find((s) => s.userId === agreement.reusseId);
  const mySignature = agreement.signatures.find((s) => s.userId === user?.id);
  const canSign = (user?.id === agreement.sellerId || user?.id === agreement.reusseId) && !mySignature;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/requests/${agreement.requestId}`)} data-testid="button-back-agreement">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Agreement #{agreement.id}
          </h1>
          <p className="text-sm text-muted-foreground">For Request #{agreement.requestId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[agreement.status] || ""}>{statusLabels[agreement.status] || agreement.status}</Badge>
          {agreement.status === "fully_signed" && (
            <Button variant="outline" size="sm" onClick={() => downloadAgreementPdf(agreement)} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-agreement">
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parties</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Seller</p>
              <p className="font-medium text-sm" data-testid="text-seller-name">{userName(agreement.seller)}</p>
              {agreement.seller?.email && <p className="text-xs text-muted-foreground">{agreement.seller.email}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-[hsl(var(--success)/0.1)] flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reseller</p>
              <p className="font-medium text-sm" data-testid="text-reseller-name">{userName(agreement.reusse)}</p>
              {agreement.reusse?.email && <p className="text-xs text-muted-foreground">{agreement.reusse.email}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Item List & Fee Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Item</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Seller</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Reseller</th>
                  <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Platform</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0" data-testid={`row-agreement-item-${item.id}`}>
                    <td className="py-2 pr-4">{item.title}</td>
                    <td className="text-right py-2 px-2">€{item.approvedPrice.toFixed(2)}</td>
                    <td className="text-right py-2 px-2 text-emerald-700 dark:text-emerald-400">
                      €{item.fees.sellerAmount.toFixed(2)}
                      <span className="text-xs text-muted-foreground ml-1">({item.fees.sellerPct}%)</span>
                    </td>
                    <td className="text-right py-2 px-2 text-blue-700 dark:text-blue-400">
                      €{item.fees.resellerAmount.toFixed(2)}
                      <span className="text-xs text-muted-foreground ml-1">({item.fees.resellerPct}%)</span>
                    </td>
                    <td className="text-right py-2 pl-2 text-muted-foreground">
                      €{item.fees.platformAmount.toFixed(2)}
                      {item.fees.platformPct != null && (
                        <span className="text-xs ml-1">({item.fees.platformPct}%)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t-2">
                  <td className="pt-3 pr-4">Totals ({agreement.itemCount} items)</td>
                  <td className="text-right pt-3 px-2">€{totalValue.toFixed(2)}</td>
                  <td className="text-right pt-3 px-2 text-emerald-700 dark:text-emerald-400">€{totalFees.seller.toFixed(2)}</td>
                  <td className="text-right pt-3 px-2 text-blue-700 dark:text-blue-400">€{totalFees.reseller.toFixed(2)}</td>
                  <td className="text-right pt-3 pl-2 text-muted-foreground">€{totalFees.platform.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {(() => {
            const splits = Array.from(
              new Map(
                items
                  .filter((it) => it.fees.sellerPct != null && it.fees.resellerPct != null && it.fees.platformPct != null)
                  .map((it) => [`${it.fees.sellerPct}-${it.fees.resellerPct}-${it.fees.platformPct}`, it.fees] as [string, SnapshotFees])
              ).values()
            );
            if (splits.length === 0) return null;
            return (
              <div className="mt-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground" data-testid="div-fee-tiers-note">
                <p className="font-medium mb-1">Fee splits applied in this agreement:</p>
                {splits.map((f, i) => (
                  <p key={i}>Seller {f.sellerPct}% / Reseller {f.resellerPct}% / Platform {f.platformPct}%</p>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signature Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border" data-testid="status-seller-signature">
              {sellerSig ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">Seller — {userName(agreement.seller)}</p>
                {sellerSig ? (
                  <p className="text-xs text-muted-foreground">
                    Signed on {new Date(sellerSig.signedAt).toLocaleString("fr-FR")}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Awaiting signature</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border" data-testid="status-reseller-signature">
              {reusseSig ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">Reseller — {userName(agreement.reusse)}</p>
                {reusseSig ? (
                  <p className="text-xs text-muted-foreground">
                    Signed on {new Date(reusseSig.signedAt).toLocaleString("fr-FR")}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Awaiting signature</p>
                )}
              </div>
            </div>
          </div>

          {agreement.status === "fully_signed" && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                This agreement is fully signed and binding.
              </p>
            </div>
          )}

          {canSign && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Sign This Agreement</p>
                <p className="text-sm text-muted-foreground">
                  By signing, you confirm that you have read and understood all terms of this agreement, including the itemized fee breakdown above.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree-checkbox"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(!!v)}
                    data-testid="checkbox-agree"
                  />
                  <label htmlFor="agree-checkbox" className="text-sm cursor-pointer leading-snug">
                    I have read and agree to the terms of this agreement, including the itemized fee breakdown.
                  </label>
                </div>
                <Button
                  onClick={() => signMutation.mutate()}
                  disabled={!agreed || signMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-sign-agreement"
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  {signMutation.isPending ? "Signing..." : "Sign Agreement"}
                </Button>
              </div>
            </>
          )}

          {mySignature && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-2" data-testid="status-already-signed">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                You signed this agreement on {new Date(mySignature.signedAt).toLocaleString("fr-FR")}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center py-2">
        Generated on {new Date(agreement.generatedAt).toLocaleString("fr-FR")} · Agreement #{agreement.id} · Request #{agreement.requestId}
      </div>
    </div>
  );
}
