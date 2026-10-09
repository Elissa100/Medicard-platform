import { sendContactMessage } from "../services/email.service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(req, res) {
  const { name, email, subject, message } = req.body || {};
  if (
    typeof name !== "string" || !name.trim() || name.trim().length > 100
    || typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254
    || typeof subject !== "string" || !subject.trim() || subject.trim().length > 160 || /[\r\n]/.test(subject)
    || typeof message !== "string" || message.trim().length < 10 || message.trim().length > 5000
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid name, email, subject, and message (10–5000 characters).",
    });
  }

  try {
    await sendContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });
    res.status(202).json({ success: true, message: "Your message has been sent." });
  } catch (error) {
    console.error("Contact form email failed:", error);
    res.status(502).json({
      success: false,
      message: "We could not send your message right now. Please try again or email us directly.",
    });
  }
}
