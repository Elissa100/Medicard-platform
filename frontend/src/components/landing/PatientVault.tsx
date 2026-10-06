import { Check, X } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function PatientVault() {
  return (
    <section id="patient-vault" className="scroll-mt-[72px] md:scroll-mt-[88px] py-16 md:py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="mb-12">
          <p className="text-sm font-semibold text-teal mb-4">
            {landingConfig.patientVault.eyebrow}
          </p>
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy leading-tight">
            {landingConfig.patientVault.headlinePart1}
          </h2>
          <p className="text-[clamp(2rem,4vw,2.75rem)] text-teal italic font-serif leading-tight">
            {landingConfig.patientVault.headlinePart2}
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8 mb-12">
          {landingConfig.patientVault.steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center relative">
              <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mb-4">
                <span className="text-navy font-bold text-xl">{step.number}</span>
              </div>
              <h3 className="text-[22px] font-bold text-navy mb-2">
                {step.title}
              </h3>
              <p className="text-body-text">{step.description}</p>
            </div>
          ))}
          <div className="hidden md:block absolute top-6 left-[33.33%] right-[33.33%] border-t-2 border-dashed border-border" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-[900px] mx-auto">
          {landingConfig.patientVault.pricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-[32px] h-full flex flex-col ${
                plan.featured
                  ? "bg-navy text-white border-2 border-teal"
                  : "bg-white border border-border"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-teal text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  MOST POPULAR
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              {plan.subtitle && (
                <p className={`mb-4 text-sm ${plan.featured ? "text-soft-text-on-navy" : "text-body-text"}`}>
                  {plan.subtitle}
                </p>
              )}
              <div className="mb-6">
                <span className="text-[64px] font-bold leading-none">
                  {plan.price}
                </span>
                <span className={plan.featured ? "text-soft-text-on-navy" : "text-muted-text"}>
                  {" "}{plan.period}
                </span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.active ? (
                      <Check size={20} className={plan.featured ? "text-teal flex-shrink-0 mt-0.5" : "text-teal flex-shrink-0 mt-0.5"} />
                    ) : (
                      <X size={20} className="text-muted-text flex-shrink-0 mt-0.5" />
                    )}
                    <span className={plan.featured ? "text-white" : feature.active ? "text-navy" : "text-muted-text"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              
              <a
                href="#contact"
                className={`inline-flex items-center justify-center w-full py-3 rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 ${
                  plan.featured
                    ? "bg-white text-navy hover:bg-pale-cyan"
                    : "bg-navy text-white hover:bg-mid-blue"
                }`}
              >
                Choose {plan.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
