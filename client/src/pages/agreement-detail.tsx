import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { ArrowLeft, FileSignature, CheckCircle, Clock, User, Package, Printer, Download, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { type AgreementDetail, type SnapshotFees, statusLabels, userName, downloadAgreementPdf } from "@/lib/agreement-pdf";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  seller_signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  reseller_signed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  fully_signed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function AgreementDetailPage() {
  const { t } = useTranslation();
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
      toast({ title: t("agreementSigned"), description: t("signatureRecorded") });
      setAgreed(false);
    },
    onError: (err: any) => {
      toast({ title: t("error"), description: err.message || t("failedSign"), variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/agreements/${params.id}/send-pdf`, {});
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: t("emailSent"), description: data.message || t("agreementSummaryEmail") });
    },
    onError: (err: any) => {
      toast({ title: t("error"), description: err.message || t("failedSendEmail"), variant: "destructive" });
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
        <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">{t("agreementNotFound")}</p></CardContent></Card>
      </div>
    );
  }

  let items: Array<{
    id: number;
    title: string;
    approvedPrice: number;
    hasInsurance?: boolean;
    insuranceCost?: number;
    unsoldAction?: string;
    fees: SnapshotFees;
  }>;

  try {
    items = JSON.parse(agreement.itemsSnapshot);
  } catch (error) {
    console.error("Failed to parse agreement items:", error);
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-medium">Error loading agreement</p>
          <p className="text-sm">Failed to parse agreement data. Please contact support.</p>
        </div>
      </div>
    );
  }

  const totalValue = parseFloat(agreement.totalValue);
  const totalFees = items.reduce(
    (acc, item) => ({
      seller: acc.seller + item.fees.sellerAmount,
      marchand: acc.marchand + item.fees.marchantAmount,
      platform: acc.platform + item.fees.platformAmount,
    }),
    { seller: 0, marchand: 0, platform: 0 }
  );

  const sellerSig = agreement.signatures.find((s) => s.userId === agreement.sellerId);
  const marchandSig = agreement.signatures.find((s) => s.userId === agreement.marchantId);
  const mySignature = agreement.signatures.find((s) => s.userId === user?.id);
  const canSign = (user?.id === agreement.sellerId || user?.id === agreement.marchantId) && !mySignature;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/requests/${agreement.requestId}`)} data-testid="button-back-agreement">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            {t("agreementNumber")}{agreement.id}
          </h1>
          <p className="text-sm text-muted-foreground">{t("forRequest")}{agreement.requestId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[agreement.status] || ""}>{statusLabels[agreement.status] || agreement.status}</Badge>
          {agreement.status === "fully_signed" && (
            <>
              <Button variant="outline" size="sm" onClick={() => downloadAgreementPdf(agreement)} data-testid="button-download-pdf">
                <Download className="h-4 w-4 mr-1" /> {t("downloadPdf")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendEmailMutation.mutate()}
                disabled={sendEmailMutation.isPending}
                data-testid="button-send-email-pdf"
              >
                <Mail className="h-4 w-4 mr-1" />
                {sendEmailMutation.isPending ? t("sending") : t("sendMessage")}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-agreement">
            <Printer className="h-4 w-4 mr-1" /> {t("print")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("parties")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("seller")}</p>
              <p className="font-medium text-sm" data-testid="text-seller-name">{userName(agreement.seller)}</p>
              {agreement.seller?.email && <p className="text-xs text-muted-foreground">{agreement.seller.email}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-[hsl(var(--success)/0.1)] flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("marchand")}</p>
              <p className="font-medium text-sm" data-testid="text-marchand-name">{userName(agreement.marchand)}</p>
              {agreement.marchand?.email && <p className="text-xs text-muted-foreground">{agreement.marchand.email}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {(() => {
        const insuredCount = items.filter(i => i.hasInsurance).length;
        const returnCount = items.filter(i => i.unsoldAction === "return").length;
        const keepCount = items.filter(i => i.unsoldAction === "keep").length;

        return (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="text-base">{t("agreementTermsSummary") || "Agreement Terms Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {agreement.deadlineDays && agreement.deadlineDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("salDeadline") || "Sale Deadline"}</p>
                      <p className="text-sm font-medium">{agreement.deadlineDays} {t("days") || "days"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(agreement.deadlineDate).toLocaleDateString("fr-FR", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                )}
                {insuredCount > 0 && (
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("insuranceItems") || "Insurance Coverage"}</p>
                      <p className="text-sm font-medium">{insuredCount} {t("itemsInsured") || insuredCount === 1 ? "item insured" : "items insured"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("insurancePercentage") || "+5% per item"}</p>
                    </div>
                  </div>
                )}
                {returnCount > 0 && (
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("returnIfUnsold") || "Return if Unsold"}</p>
                      <p className="text-sm font-medium">{returnCount} {returnCount === 1 ? "item" : "items"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("returnInstruction") || "Back to seller"}</p>
                    </div>
                  </div>
                )}
                {keepCount > 0 && (
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("keepIfUnsold") || "Keep if Unsold"}</p>
                      <p className="text-sm font-medium">{keepCount} {keepCount === 1 ? "item" : "items"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("keepInstruction") || "Marchand retains"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {agreement.deadlineDate && (
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{t("salDeadline") || "Sale Deadline"}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground text-xs">{t("deadline")}: </span>
                  <span className="font-medium">{new Date(agreement.deadlineDate).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                </span>
                {agreement.deadlineDays && (
                  <span>
                    <span className="text-muted-foreground text-xs">{t("duration")}: </span>
                    <span className="font-medium">{agreement.deadlineDays} {t("days")}</span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> {t("itemListAndFeeBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t("item")}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t("price")}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t("feeRoleSeller")}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t("feeRoleMarchand")}</th>
                  <th className="text-right py-2 pl-2 font-medium text-muted-foreground">{t("feeRolePlatform")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0" data-testid={`row-agreement-item-${item.id}`}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>{item.title}</span>
                        {item.hasInsurance && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400" data-testid={`badge-insurance-${item.id}`}>
                            <Shield className="h-3 w-3" /> {t("insured")}
                          </span>
                        )}
                        {item.unsoldAction && (
                          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded ${item.unsoldAction === "return" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`} data-testid={`badge-unsold-${item.id}`}>
                            {item.unsoldAction === "return" ? t("returnIfUnsold") : t("keepIfUnsold")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-2 px-2">
                      <span>€{item.approvedPrice.toFixed(2)}</span>
                      {item.hasInsurance && item.insuranceCost != null && item.insuranceCost > 0 && (
                        <span className="block text-xs text-blue-600 dark:text-blue-400" data-testid={`text-insurance-cost-${item.id}`}>+€{(item.insuranceCost as number).toFixed(2)} ins.</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-2 text-emerald-700 dark:text-emerald-400">
                      €{item.fees.sellerAmount.toFixed(2)}
                      <span className="text-xs text-muted-foreground ml-1">({item.fees.sellerPct}%)</span>
                    </td>
                    <td className="text-right py-2 px-2 text-blue-700 dark:text-blue-400">
                      €{item.fees.marchantAmount.toFixed(2)}
                      <span className="text-xs text-muted-foreground ml-1">({item.fees.marchantPct}%)</span>
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
                  <td className="pt-3 pr-4">{t("totals", { count: agreement.itemCount })}</td>
                  <td className="text-right pt-3 px-2">€{totalValue.toFixed(2)}</td>
                  <td className="text-right pt-3 px-2 text-emerald-700 dark:text-emerald-400">€{totalFees.seller.toFixed(2)}</td>
                  <td className="text-right pt-3 px-2 text-blue-700 dark:text-blue-400">€{totalFees.marchand.toFixed(2)}</td>
                  <td className="text-right pt-3 pl-2 text-muted-foreground">€{totalFees.platform.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {(() => {
            const splits = Array.from(
              new Map(
                items
                  .filter((it) => it.fees.sellerPct != null && it.fees.marchantPct != null && it.fees.platformPct != null)
                  .map((it) => [`${it.fees.sellerPct}-${it.fees.marchantPct}-${it.fees.platformPct}`, it.fees] as [string, SnapshotFees])
              ).values()
            );
            if (splits.length === 0) return null;
            return (
              <div className="mt-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground" data-testid="div-fee-tiers-note">
                <p className="font-medium mb-1">{t("feeSplitsApplied")}</p>
                {splits.map((f, i) => (
                  <p key={i}>{t("feeSplitFormat", { seller: f.sellerPct, marchand: f.marchantPct, platform: f.platformPct })}</p>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("signatureStatus")}</CardTitle>
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
                <p className="text-sm font-medium">{t("feeRoleSeller")} — {userName(agreement.seller)}</p>
                {sellerSig ? (
                  <p className="text-xs text-muted-foreground">
                    {t("signedOn", { date: new Date(sellerSig.signedAt).toLocaleString("fr-FR") })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("awaitingSignature")}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border" data-testid="status-marchand-signature">
              {marchandSig ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">{t("feeRoleMarchand")} — {userName(agreement.marchand)}</p>
                {marchandSig ? (
                  <p className="text-xs text-muted-foreground">
                    {t("signedOn", { date: new Date(marchandSig.signedAt).toLocaleString("fr-FR") })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("awaitingSignature")}</p>
                )}
              </div>
            </div>
          </div>

          {agreement.status === "fully_signed" && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("agreementFullySigned")}
              </p>
            </div>
          )}

          {canSign && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("signThisAgreement")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("signConfirmation")}
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree-checkbox"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(!!v)}
                    data-testid="checkbox-agree"
                  />
                  <label htmlFor="agree-checkbox" className="text-sm cursor-pointer leading-snug">
                    {t("agreeToTerms")}
                  </label>
                </div>
                <Button
                  onClick={() => signMutation.mutate()}
                  disabled={!agreed || signMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-sign-agreement"
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  {signMutation.isPending ? t("signing") : t("signAgreement")}
                </Button>
              </div>
            </>
          )}

          {mySignature && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-2" data-testid="status-already-signed">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {t("youSignedOn", { date: new Date(mySignature.signedAt).toLocaleString("fr-FR") })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center py-2">
        {t("generatedOn", { date: new Date(agreement.generatedAt).toLocaleString("fr-FR"), id: agreement.id, requestId: agreement.requestId })}
      </div>
    </div>
  );
}
