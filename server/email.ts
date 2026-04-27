interface AgreementEmailParams {
  toEmail: string;
  toName: string;
  requestId: number;
  agreementId: number;
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
