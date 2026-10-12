import crypto from "crypto";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BREVO_SENDER || process.env.EMAIL_FROM || "MedCard Health <no-reply@medcard.rw>";

function getSender() {
  const match = BREVO_SENDER.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  const email = match ? match[2].trim() : BREVO_SENDER.trim();
  const name = match?.[1]?.trim() || "MedCard";
  return { name, email };
}

export function generateSecureTemporaryPassword() {
  const unambiguousChars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  const length = 16;
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += unambiguousChars[bytes[i] % unambiguousChars.length];
  }
  return password;
}

export async function sendStaffInvitationEmail({ to, staffName, clinicName, role, temporaryPassword, loginUrl }) {
  const safeStaffName = String(staffName || "Staff Member").replace(/[&<>"']/g, "");
  const safeClinicName = String(clinicName || "Clinic").replace(/[&<>"']/g, "");
  const safeRole = String(role || "Staff").replace(/[&<>"']/g, "");
  const safeUrl = loginUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/vault-clinic/login`;

  const subject = `Welcome to MedCard Patient Vault Portal - ${safeClinicName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">MedCard Clinic Portal</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Patient Vault Healthcare Workspace</p>
          </div>
          <div style="padding: 24px;">
            <p style="margin-top: 0;">Hello <strong>${safeStaffName}</strong>,</p>
            <p>You have been registered as <strong>${safeRole}</strong> for <strong>${safeClinicName}</strong> on the MedCard Patient Vault portal.</p>
            <p>Your temporary credentials are provided below. You will be required to choose a new password upon your first sign in:</p>
            
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #cbd5e1;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Sign in email:</p>
              <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; font-family: monospace;">${to}</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Temporary password (valid for 72 hours):</p>
              <p style="margin: 0; font-size: 16px; font-weight: 700; font-family: monospace; letter-spacing: 1px; color: #0f172a;">${temporaryPassword}</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${safeUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Sign in to Clinic Portal</a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">For security reasons, never share this temporary password with anyone. MedCard staff will never ask for your password.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!BREVO_API_KEY) {
    console.log(`[Vault Clinic Email Fallback] Invitation for ${to} (${safeRole} at ${safeClinicName}): Temp Password = ${temporaryPassword}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: getSender(),
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Vault Clinic Email] Brevo error:", err);
      return { success: false, error: err };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[Vault Clinic Email] Dispatch failed:", error.message);
    return { success: false, error: error.message };
  }
}
