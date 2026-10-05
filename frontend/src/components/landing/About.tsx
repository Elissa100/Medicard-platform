import { landingConfig } from "../../data/landing";

export function About() {
  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-teal">
              {landingConfig.about.eyebrow}
            </p>
            <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy leading-tight">
              {landingConfig.about.headlinePart1}
            </h2>
            <p className="text-[clamp(2rem,4vw,2.75rem)] text-teal italic font-serif leading-tight">
              {landingConfig.about.headlinePart2}
            </p>
          </div>
          <div className="text-body-text text-[clamp(1.125rem,2vw,1.25rem)] leading-relaxed">
            {landingConfig.about.description}
          </div>
        </div>
      </div>
    </section>
  );
}
