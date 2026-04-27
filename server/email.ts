interface AgreementEmailParams {
  toEmail: string;
  toName: string;
  requestId: number;
  agreementId: number;
}

interface AgreementPdfEmailParams {
  toEmail: string;
  toName: string;
  agreementId: number;
  requestId: number;
  status: string;
  generatedAt: string;
  seller: { name: string; email: string | null } | null;
  reusse: { name: string; email: string | null } | null;
  items: Array<{
    title: string;
    approvedPrice: number;
    sellerAmount: number;
    resellerAmount: number;
    platformAmount: number;
    sellerPct?: number;
    resellerPct?: number;
    platformPct?: number;
  }>;
  signatures: Array<{ role: string; name: string; signedAt: string }>;
  totalValue: number;
  pdfBuffer: Buffer;
}

function getBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    (process.env.REPL_SLUG && process.env.REPL_OWNER
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : "http://localhost:5000")
  );
}

export async function sendAgreementReadyEmail(params: AgreementEmailParams): Promise<void> {
  const { toEmail, toName, requestId, agreementId } = params;
  const signingUrl = `${getBaseUrl()}/agreements/${agreementId}`;
  const subject = `Agreement Ready to Sign – Request #${requestId}`;
  const html = buildEmailHtml(toName, requestId, agreementId, signingUrl);

  // TODO: Replace this mock with a real email provider (e.g. Resend or SendGrid).
  // Resend example — run: npm install resend, set RESEND_API_KEY secret, then:
  //
  //   import { Resend } from "resend";
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: "Sellzy <noreply@yourdomain.com>",
  //     to: toEmail,
  //     subject,
  //     html,
  //   });
  //
  // SendGrid example — run: npm install @sendgrid/mail, set SENDGRID_API_KEY secret, then:
  //
  //   import sgMail from "@sendgrid/mail";
  //   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  //   await sgMail.send({ to: toEmail, from: "noreply@yourdomain.com", subject, html });

  console.log(`[EMAIL MOCK] To: ${toEmail} | Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Signing link: ${signingUrl}`);
  console.log(`[EMAIL MOCK] HTML body length: ${html.length} chars`);
}

export async function sendAgreementPdfEmail(params: AgreementPdfEmailParams): Promise<void> {
  const { toEmail, agreementId, requestId, pdfBuffer } = params;
  const subject = `Your Agreement #${agreementId} – Request #${requestId}`;
  const html = buildAgreementSummaryHtml(params);
  const pdfBase64 = pdfBuffer.toString("base64");
  const attachmentFilename = `agreement-${agreementId}.pdf`;

  // TODO: Replace this mock with a real email provider (e.g. Resend or SendGrid).
  //
  // Resend example — run: npm install resend, set RESEND_API_KEY secret, then:
  //
  //   import { Resend } from "resend";
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: "Sellzy <noreply@yourdomain.com>",
  //     to: toEmail,
  //     subject,
  //     html,
  //     attachments: [{ filename: attachmentFilename, content: pdfBase64 }],
  //   });
  //
  // SendGrid example — run: npm install @sendgrid/mail, set SENDGRID_API_KEY secret, then:
  //
  //   import sgMail from "@sendgrid/mail";
  //   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  //   await sgMail.send({
  //     to: toEmail, from: "noreply@yourdomain.com", subject, html,
  //     attachments: [{ filename: attachmentFilename, content: pdfBase64, type: "application/pdf", disposition: "attachment" }],
  //   });

  console.log(`[EMAIL MOCK] To: ${toEmail} | Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Attachment: ${attachmentFilename} (${pdfBuffer.byteLength} bytes, base64 length: ${pdfBase64.length})`);
  console.log(`[EMAIL MOCK] HTML body length: ${html.length} chars`);
}

function buildAgreementSummaryHtml(params: AgreementPdfEmailParams): string {
  const fmt = (n: number) => `€${n.toFixed(2)}`;
  const statusLabels: Record<string, string> = {
    pending: "Unsigned",
    seller_signed: "Seller Signed",
    reseller_signed: "Reseller Signed",
    fully_signed: "Fully Signed",
  };

  const itemRows = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.title}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(item.approvedPrice)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(item.sellerAmount)}${item.sellerPct != null ? ` (${item.sellerPct}%)` : ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(item.resellerAmount)}${item.resellerPct != null ? ` (${item.resellerPct}%)` : ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(item.platformAmount)}${item.platformPct != null ? ` (${item.platformPct}%)` : ""}</td>
    </tr>`
    )
    .join("");

  const sigRows = params.signatures
    .map(
      (sig) => `<p style="margin:4px 0;font-size:13px;">
      <strong>${sig.role === "seller" ? "Seller" : "Reseller"} — ${sig.name}</strong>: 
      Signed on ${new Date(sig.signedAt).toLocaleString("fr-FR")}
    </p>`
    )
    .join("");

  const agreementUrl = `${getBaseUrl()}/agreements/${params.agreementId}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:650px;margin:0 auto;padding:24px;">
  <h2 style="font-size:20px;margin-bottom:4px;">Agreement #${params.agreementId}</h2>
  <p style="font-size:13px;color:#6b7280;margin-top:0;">For Request #${params.requestId} &middot; Status: ${statusLabels[params.status] || params.status}</p>
  <p style="margin-bottom:16px;">Hi ${params.toName},</p>
  <p style="margin-bottom:16px;">Here is a summary of your signed agreement.</p>

  <h3 style="font-size:15px;margin-bottom:8px;">Parties</h3>
  <p style="margin:4px 0;font-size:13px;"><strong>Seller:</strong> ${params.seller?.name || "Unknown"}${params.seller?.email ? ` &lt;${params.seller.email}&gt;` : ""}</p>
  <p style="margin:4px 0;font-size:13px;"><strong>Reseller:</strong> ${params.reusse?.name || "Unknown"}${params.reusse?.email ? ` &lt;${params.reusse.email}&gt;` : ""}</p>

  <h3 style="font-size:15px;margin:16px 0 8px;">Item List &amp; Fee Breakdown</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #d1d5db;">Item</th>
        <th style="padding:6px 8px;text-align:right;border-bottom:2px solid #d1d5db;">Price</th>
        <th style="padding:6px 8px;text-align:right;border-bottom:2px solid #d1d5db;">Seller</th>
        <th style="padding:6px 8px;text-align:right;border-bottom:2px solid #d1d5db;">Reseller</th>
        <th style="padding:6px 8px;text-align:right;border-bottom:2px solid #d1d5db;">Platform</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr style="font-weight:bold;background:#f9fafb;">
        <td style="padding:6px 8px;">Totals (${params.items.length} items)</td>
        <td style="padding:6px 8px;text-align:right;">${fmt(params.totalValue)}</td>
        <td style="padding:6px 8px;text-align:right;">${fmt(params.items.reduce((s, i) => s + i.sellerAmount, 0))}</td>
        <td style="padding:6px 8px;text-align:right;">${fmt(params.items.reduce((s, i) => s + i.resellerAmount, 0))}</td>
        <td style="padding:6px 8px;text-align:right;">${fmt(params.items.reduce((s, i) => s + i.platformAmount, 0))}</td>
      </tr>
    </tfoot>
  </table>

  <h3 style="font-size:15px;margin:16px 0 8px;">Signature Records</h3>
  ${sigRows || '<p style="font-size:13px;color:#6b7280;">No signatures recorded.</p>'}

  ${params.status === "fully_signed" ? '<p style="font-weight:bold;color:#059669;margin-top:12px;">This agreement is fully signed and binding.</p>' : ""}

  <div style="margin-top:24px;">
    <a href="${agreementUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
      View Agreement Online
    </a>
  </div>

  <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
    Generated on: ${new Date(params.generatedAt).toLocaleString("fr-FR")} &middot; Agreement #${params.agreementId} &middot; Request #${params.requestId}
  </p>
</body>
</html>`.trim();
}

function buildEmailHtml(
  toName: string,
  requestId: number,
  agreementId: number,
  signingUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="font-size:20px;margin-bottom:8px;">Your Agreement Is Ready to Sign</h2>
  <p style="margin-bottom:16px;">Hi ${toName},</p>
  <p style="margin-bottom:16px;">
    An agreement for <strong>Request #${requestId}</strong> has been generated and is waiting for your signature.
  </p>
  <a href="${signingUrl}"
     style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
    Review &amp; Sign Agreement
  </a>
  <p style="margin-top:24px;font-size:13px;color:#6b7280;">
    Agreement ID: ${agreementId} &middot; Request #${requestId}
  </p>
</body>
</html>`.trim();
}
