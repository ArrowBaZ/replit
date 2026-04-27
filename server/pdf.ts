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

interface AgreementSignatureRecord {
  id: number;
  agreementId: number;
  userId: string;
  role: string;
  signedAt: string;
  ipAddress: string | null;
  userName: string;
}

export interface AgreementForPdf {
  id: number;
  requestId: number;
  sellerId: string;
  reusseId: string;
  status: string;
  itemCount: number;
  totalValue: string;
  itemsSnapshot: string;
  generatedAt: string;
  seller: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  reusse: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  signatures: AgreementSignatureRecord[];
}

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

export function generateAgreementPdfBytes(agreement: AgreementForPdf): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 18;

  const fmt = (n: number) => `\u20AC${n.toFixed(2)}`;

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
  doc.text(`For Request #${agreement.requestId}  \u00B7  Status: ${statusLabels[agreement.status] || agreement.status}`, margin, y);
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
    doc.text(`Seller \u2014 ${userName(agreement.seller)}: Signed on ${new Date(sellerSig.signedAt).toLocaleString("fr-FR")}`, margin, y);
  } else {
    doc.text(`Seller \u2014 ${userName(agreement.seller)}: Awaiting signature`, margin, y);
  }
  y += 5;
  if (reusseSig) {
    doc.text(`Reseller \u2014 ${userName(agreement.reusse)}: Signed on ${new Date(reusseSig.signedAt).toLocaleString("fr-FR")}`, margin, y);
  } else {
    doc.text(`Reseller \u2014 ${userName(agreement.reusse)}: Awaiting signature`, margin, y);
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
    `Agreement #${agreement.id} \u00B7 Request #${agreement.requestId} \u00B7 Generated ${new Date(agreement.generatedAt).toLocaleString("fr-FR")}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
