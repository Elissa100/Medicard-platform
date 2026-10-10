import { HeroVisual } from "../hero/HeroVisual";
import { landingConfig } from "../../data/landing";

export function Hero() {
  return (
    <section className="relative overflow-x-clip bg-section-tint py-12 md:py-16 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pale-cyan rounded-full">
              <div className="w-2 h-2 rounded-full bg-teal" />
              <span className="text-sm font-semibold text-teal">
                {landingConfig.hero.eyebrow}
              </span>
            </div>
            <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-navy leading-[1.1] font-sans">
              <span>Technology connecting</span>
              <br />
              <span>people and</span>
              <br />
              <span className="text-teal italic font-serif">
                possibilities.
              </span>
            </h1>
            <p className="text-[clamp(1.125rem,2vw,1.25rem)] text-body-text max-w-[34rem]">
              {landingConfig.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={landingConfig.hero.primaryCta.href}
                className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-white bg-teal rounded-full hover:bg-teal-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
              >
                {landingConfig.hero.primaryCta.label}
              </a>
              <a
                href={landingConfig.hero.secondaryCta.href}
                className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-teal border border-teal/40 rounded-full hover:bg-teal/5 transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
              >
                {landingConfig.hero.secondaryCta.label}
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
