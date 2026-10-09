import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, LoaderCircle, Mail, MapPin, Phone, Send } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const submitContactForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSending(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
      const response = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Your message could not be sent. Please try again.");
      }
      setForm({ name: "", email: "", subject: "", message: "" });
      setStatus("Thanks for reaching out. Your message has been sent.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Your message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-[72px] bg-navy py-16 text-white md:scroll-mt-[88px] md:py-24">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10 lg:px-20">
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <img src="/medcard-logo.svg" alt="MedCard" className="h-9 w-auto brightness-0 invert" />
            <div>
              <p className="font-bold">MedCard</p>
              <p className="text-xs text-teal">Technology Solutions</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold md:text-4xl">Contact us</h2>
          <p className="mt-3 text-soft-text-on-navy">Questions or interested in working with us? Send a message and our team will get back to you.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={submitContactForm} className="rounded-2xl bg-white p-5 text-navy shadow-card sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold" htmlFor="contact-name">Name
                <input
                  id="contact-name"
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="Your name"
                />
              </label>
              <label className="text-sm font-semibold" htmlFor="contact-email">Email
                <input
                  id="contact-email"
                  required
                  maxLength={254}
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-semibold" htmlFor="contact-subject">Subject
              <input
                id="contact-subject"
                required
                maxLength={160}
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="What would you like to discuss?"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold" htmlFor="contact-message">Message
              <textarea
                id="contact-message"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="mt-1.5 block w-full resize-y rounded-lg border border-border px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="Tell us how we can help..."
              />
            </label>

            {(error || status) && (
              <div role={error ? "alert" : "status"} className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${error ? "bg-red-50 text-red-800" : "bg-pale-cyan text-navy"}`}>
                {error ? <Mail size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
                <span>{error || status}</span>
              </div>
            )}

            <button disabled={isSending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-5 py-3 font-semibold text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {isSending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={17} />}
              {isSending ? "Sending..." : "Send message"}
            </button>
          </form>

          <aside className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 sm:p-8">
            <h3 className="text-xl font-bold">Get in touch</h3>
            <p className="mt-2 text-sm text-soft-text-on-navy">You can also reach us directly using the details below.</p>
            <div className="mt-7 space-y-5">
              <ContactLink icon={<Mail size={19} />} label="Email" value={landingConfig.contact.email} href={`mailto:${landingConfig.contact.email}`} />
              <ContactLink icon={<Phone size={19} />} label="Phone" value={landingConfig.contact.phone} href={`tel:${landingConfig.contact.phone.replace(/\s/g, "")}`} />
              <ContactLink icon={<MapPin size={19} />} label="Location" value={landingConfig.contact.location} href={landingConfig.contact.mapUrl} external />
              <a
                href={landingConfig.contact.linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white/10"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A66C2] text-white" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
                  </svg>
                </span>
                <span><span className="block text-xs text-soft-text-on-navy">LinkedIn</span><span className="font-semibold">Connect with Wilson</span></span>
              </a>
            </div>
            <div className="mt-8 border-t border-white/15 pt-5 text-sm text-soft-text-on-navy">
              {landingConfig.slogan}
            </div>
          </aside>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-sm text-soft-text-on-navy sm:flex-row">
          <p>© 2026 MedCard, Rwanda</p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {landingConfig.nav.links.map((link) => <a key={link.label} href={link.href} className="hover:text-white">{link.label}</a>)}
          </nav>
        </div>
      </div>
    </section>
  );
}

function ContactLink({
  icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white/10"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/15 text-teal">{icon}</span>
      <span><span className="block text-xs text-soft-text-on-navy">{label}</span><span className="font-semibold">{value}</span></span>
    </a>
  );
}
