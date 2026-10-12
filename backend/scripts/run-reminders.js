import prisma from "../src/config/database.js";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BREVO_SENDER || process.env.EMAIL_FROM || "MedCard Health <no-reply@medcard.rw>";

function getSender() {
  const match = BREVO_SENDER.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  const email = match ? match[2].trim() : BREVO_SENDER.trim();
  const name = match?.[1]?.trim() || "MedCard";
  return { name, email };
}

async function sendReminderEmail(to, patientName, clinicName, scheduledAt) {
  if (!to || !to.includes("@")) return;

  const formattedDate = new Date(scheduledAt).toLocaleString();
  const subject = `Appointment Reminder: Visit scheduled at ${clinicName}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; color: #1e293b; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="margin-top: 0; color: #0f172a;">Appointment Reminder</h2>
          <p>Hello ${patientName},</p>
          <p>This is a reminder of your upcoming consultation at <strong>${clinicName}</strong>.</p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Scheduled Time:</strong> ${formattedDate}</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">Please arrive 10 minutes before your scheduled appointment time. If you need to reschedule, please notify the clinic through your MedCard vault portal.</p>
        </div>
      </body>
    </html>
  `;

  if (!BREVO_API_KEY) {
    console.log(`[Reminder Fallback] Sent reminder to ${to} for visit at ${clinicName} on ${formattedDate}`);
    return;
  }

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: getSender(),
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
  } catch (err) {
    console.error(`[Reminder] Failed to send email to ${to}:`, err.message);
  }
}

export async function processUpcomingAppointmentReminders() {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  console.log(`[Reminders] Checking for confirmed appointments between ${now.toISOString()} and ${next24Hours.toISOString()}...`);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      scheduledAt: {
        gte: now,
        lte: next24Hours,
      },
    },
    include: {
      patient: true,
      facility: true,
      vaultClinician: true,
    },
  });

  console.log(`[Reminders] Found ${upcomingAppointments.length} confirmed appointments in upcoming 24h window.`);

  let dispatchedCount = 0;

  for (const appt of upcomingAppointments) {
    // Check if reminder was already sent
    const existingReminder = await prisma.patientNotification.findFirst({
      where: {
        patientId: appt.patientId,
        type: "APPOINTMENT_REMINDER",
        createdAt: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      },
    });

    if (existingReminder) {
      continue;
    }

    const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
    const clinicName = appt.facility.name;

    await prisma.patientNotification.create({
      data: {
        patientId: appt.patientId,
        title: "Upcoming Appointment Reminder",
        message: `Reminder: You have a scheduled appointment at ${clinicName} on ${new Date(appt.scheduledAt).toLocaleString()}.`,
        type: "APPOINTMENT_REMINDER",
        metadata: {
          appointmentId: appt.id,
          facilityId: appt.facilityId,
          scheduledAt: appt.scheduledAt,
        },
      },
    });

    if (appt.patient.email) {
      await sendReminderEmail(appt.patient.email, patientName, clinicName, appt.scheduledAt);
    }

    dispatchedCount++;
  }

  console.log(`[Reminders] Dispatched ${dispatchedCount} new appointment reminders.`);
  return dispatchedCount;
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith("run-reminders.js")) {
  processUpcomingAppointmentReminders()
    .then((count) => {
      console.log(`[Reminders] Finished with ${count} reminders sent.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Reminders] Error:", err);
      process.exit(1);
    });
}

