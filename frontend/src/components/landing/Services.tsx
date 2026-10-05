import { ArrowRight } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Services() {
  return (
    <section id="services" className="scroll-mt-[72px] md:scroll-mt-[88px] py-16 md:py-24 bg-section-tint">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="mb-12">
          <p className="text-sm font-semibold text-teal mb-4">
            {landingConfig.services.eyebrow}
          </p>
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy">
            {landingConfig.services.headline}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="relative bg-navy rounded-[32px] p-8 min-h-[380px] hover:translate-y-[-4px] hover:shadow-lift transition-all duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden opacity-20">
              <div className="absolute inset-0 border-2 border-teal rounded-full" />
              <div className="absolute inset-4 border-2 border-teal rounded-full" />
              <div className="absolute inset-8 border-2 border-teal rounded-full" />
            </div>

            <p className="text-accent-on-navy text-sm font-semibold mb-4">
              {landingConfig.services.nfc.label}
            </p>
            <h3 className="text-[38px] font-bold text-white mb-4">
              {landingConfig.services.nfc.title}
            </h3>
            <p className="text-soft-text-on-navy mb-8">
              {landingConfig.services.nfc.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {landingConfig.services.nfc.pills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center px-4 py-2 border-2 border-mid-blue rounded-full text-sm font-semibold text-white"
                >
                  {pill.label}
                </span>
              ))}
            </div>

            <a
              href={landingConfig.services.nfc.cta.href}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-navy font-semibold rounded-full hover:bg-pale-cyan transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-navy"
            >
              {landingConfig.services.nfc.cta.label}
              <ArrowRight size={18} className="ml-2" />
            </a>
          </div>

          <div className="relative bg-white border-2 border-border rounded-[32px] p-8 min-h-[380px] hover:translate-y-[-4px] hover:shadow-lift transition-all duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pale-cyan rounded-full flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.5 2 6 4.5 6 7C6 8.5 7 9.5 7 11C7 12.5 5.5 13.5 5.5 15.5C5.5 17.5 7 19 8.5 19C9.5 19 10 18 12 18C14 18 14.5 19 15.5 19C17 19 18.5 17.5 18.5 15.5C18.5 13.5 17 12.5 17 11C17 9.5 18 8.5 18 7C18 4.5 15.5 2 12 2Z" stroke="#00A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <p className="text-teal text-sm font-semibold mb-4">
              {landingConfig.services.manufacturing.label}
            </p>
            <h3 className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold text-navy mb-4 leading-tight">
              {landingConfig.services.manufacturing.title}
            </h3>
            <p className="text-body-text mb-8">
              {landingConfig.services.manufacturing.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {landingConfig.services.manufacturing.pills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center px-4 py-2 border-2 border-teal rounded-full text-sm font-semibold text-teal"
                >
                  {pill.label}
                </span>
              ))}
            </div>

            <button
              disabled={landingConfig.services.manufacturing.cta.disabled}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-navy text-navy font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
            >
              {landingConfig.services.manufacturing.cta.label}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
