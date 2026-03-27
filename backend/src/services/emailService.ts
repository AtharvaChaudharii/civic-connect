import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Lazily-created nodemailer transporter.
 * Uses Gmail's SMTP via the GMAIL_USER / GMAIL_APP_PASSWORD env vars.
 * To enable: generate a Gmail App Password at https://myaccount.google.com/apppasswords
 * (requires 2-Step Verification on the account).
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
    if (transporter) return transporter;

    const user = (env as any).GMAIL_USER;
    const pass = (env as any).GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set — guest email notifications disabled.");
        return null;
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });

    return transporter;
}

/**
 * Send a status-update email to a guest reporter.
 */
export async function sendGuestStatusEmail({
    to,
    issueTitle,
    newStatus,
    location,
    resolutionComment,
}: {
    to: string;
    issueTitle: string;
    newStatus: string;
    location: string;
    resolutionComment?: string | null;
}): Promise<void> {
    const t = getTransporter();
    if (!t) return; // email not configured — skip silently

    const statusLabels: Record<string, { emoji: string; line: string; color: string }> = {
        Ongoing:  { emoji: "🔧", line: "Your reported issue is now being worked on by the department.", color: "#3b82f6" },
        Resolved: { emoji: "✅", line: "Great news! Your reported issue has been resolved.", color: "#16a34a" },
        Escalated:{ emoji: "⚠️", line: "Your issue has been escalated for priority review.", color: "#ef4444" },
        Pending:  { emoji: "📋", line: "Your issue has been set back to pending review.", color: "#f59e0b" },
    };

    const meta = statusLabels[newStatus] ?? {
        emoji: "ℹ️",
        line: `Your issue status has been updated to ${newStatus}.`,
        color: "#6b7280",
    };

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:#1E7F5C;padding:28px 32px">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:700">CivicTrack</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px">Civic Issue Tracking Platform</p>
        </td></tr>

        <!-- Status badge -->
        <tr><td style="padding:28px 32px 0">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:${meta.color};color:#fff;border-radius:999px;padding:4px 14px;font-size:13px;font-weight:600">
              ${meta.emoji} ${newStatus}
            </td></tr>
          </table>
          <p style="margin:16px 0 8px;font-size:18px;font-weight:700;color:#111">${meta.line}</p>
          <p style="margin:0;font-size:14px;color:#6b7280">Here's an update on the issue you reported.</p>
        </td></tr>

        <!-- Issue details -->
        <tr><td style="padding:20px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px">
            <tr><td>
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Issue Title</p>
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111">${issueTitle}</p>
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Location</p>
              <p style="margin:0;font-size:13px;color:#374151">${location}</p>
              ${resolutionComment ? `
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Resolution Note</p>
              <p style="margin:0;font-size:13px;color:#374151">${resolutionComment}</p>` : ""}
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #f0f0f0">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
            You received this email because you submitted a report on CivicTrack.<br>
            No account needed — we track your report by email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await t.sendMail({
            from: `"CivicTrack" <${(env as any).GMAIL_USER}>`,
            to,
            subject: `${meta.emoji} Issue Update: "${issueTitle}" is now ${newStatus}`,
            html,
        });
        console.log(`[Email] Status update sent to ${to}`);
    } catch (err) {
        console.error("[Email] Failed to send status update:", err);
        // Don't rethrow — email failure should never break ticket update
    }
}
