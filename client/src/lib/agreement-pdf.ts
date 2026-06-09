import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface SnapshotFees {
  sellerAmount: number;
  marchantAmount: number;
  platformAmount: number;
  sellerPct?: number;
  marchantPct?: number;
  platformPct?: number;
}

export interface AgreementDetail {
  id: number;
  requestId: number;
  sellerId: string;
  marchantId: string;
  status: string;
  itemCount: number;
  totalValue: string;
  itemsSnapshot: string;
  feeBreakdown: string | null;
  generatedAt: string;
  seller: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  marchand: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  request: unknown | null;
  signatures: Array<{
    id: number;
    agreementId: number;
    userId: string;
    role: string;
    signedAt: string;
    userName: string;
  }>;
}

export const statusLabels: Record<string, string> = {
  pending: "Unsigned",
  seller_signed: "Seller Signed",
  marchand_signed: "Marchand Signed",
  fully_signed: "Fully Signed",
};

export function userName(u: { firstName: string | null; lastName: string | null; email: string | null } | null): string {
  if (!u) return "Unknown";
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return name || u.email || "Unknown";
}

export function downloadAgreementPdf(agreement: AgreementDetail): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 18;

  const fmt = (n: number) => `€${n.toFixed(2)}`;

  const items = JSON.parse(agreement.itemsSnapshot) as Array<{
    id: number;
    title: string;
    approvedPrice: number;
    hasInsurance?: boolean;
    insuranceCost?: number;
    fees: SnapshotFees;
  }>;

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
  doc.text(`Marchand: ${userName(agreement.marchand)}${agreement.marchand?.email ? `  <${agreement.marchand.email}>` : ""}`, margin, y);
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
    item.hasInsurance ? `${item.title} 🛡 (+5% ins.)` : item.title,
    fmt(item.approvedPrice),
    `${fmt(item.fees.sellerAmount)}${pctStr(item.fees.sellerPct)}`,
    `${fmt(item.fees.marchantAmount)}${pctStr(item.fees.marchantPct)}`,
    `${fmt(item.fees.platformAmount)}${pctStr(item.fees.platformPct)}`,
  ]);

  tableBody.push([
    `Totals (${agreement.itemCount} items)`,
    fmt(totalValue),
    fmt(totalFees.seller),
    fmt(totalFees.marchand),
    fmt(totalFees.platform),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Item", "Price", "Seller", "Marchand", "Platform"]],
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
        .filter((it) => it.fees.sellerPct != null && it.fees.marchantPct != null && it.fees.platformPct != null)
        .map((it) => [`${it.fees.sellerPct}-${it.fees.marchantPct}-${it.fees.platformPct}`, it.fees] as [string, SnapshotFees])
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
      doc.text(`Seller ${f.sellerPct ?? "?"}% / Marchand ${f.marchantPct ?? "?"}% / Platform ${f.platformPct ?? "?"}%`, margin + 4, y);
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
  if (marchandSig) {
    doc.text(`Marchand — ${userName(agreement.marchand)}: Signed on ${new Date(marchandSig.signedAt).toLocaleString("fr-FR")}`, margin, y);
  } else {
    doc.text(`Marchand — ${userName(agreement.marchand)}: Awaiting signature`, margin, y);
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
