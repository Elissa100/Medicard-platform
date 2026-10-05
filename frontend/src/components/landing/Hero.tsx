import { ArrowRight } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-sm font-semibold text-teal tracking-wide uppercase">
              {landingConfig.slogan}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight font-serif">
              {landingConfig.hero.headline}
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              {landingConfig.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={landingConfig.hero.primaryCta.href}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-navy rounded-lg hover:bg-navy-dark transition-colors"
              >
                {landingConfig.hero.primaryCta.label}
                <ArrowRight size={18} className="ml-2" />
              </a>
              <a
                href={landingConfig.hero.secondaryCta.href}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-navy border-2 border-navy rounded-lg hover:bg-navy hover:text-white transition-colors"
              >
                {landingConfig.hero.secondaryCta.label}
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-teal-pale rounded-2xl transform rotate-3" />
            <div className="relative bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center min-h-[400px]">
              <img
                src="/medcard-logo.svg"
                alt="MedCard Technology"
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
