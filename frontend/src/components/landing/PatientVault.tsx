import { landingConfig } from "../../data/landing";

export function PatientVault() {
  return (
    <section id="patient-vault" className="py-16 md:py-24 bg-white">
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
              className={`p-8 rounded-[32px] h-full flex flex-col ${
                plan.featured
                  ? "bg-navy text-white"
                  : "bg-white border-2 border-border"
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-[64px] font-bold leading-none">
                  {plan.price}
                </span>
                <span className={plan.featured ? "text-soft-text-on-navy" : "text-muted-text"}>
                  {" "}{plan.period}
                </span>
              </div>
              <p className={`mb-2 ${plan.featured ? "text-white" : "text-body-text"}`}>
                {plan.description}
              </p>
              {plan.features.length === 0 && (
                <p className={`mb-8 italic text-sm ${plan.featured ? "text-soft-text-on-navy" : "text-muted-text"}`}>
                  Feature list to be confirmed
                </p>
              )}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />
                    <span className={plan.featured ? "text-white" : "text-body-text"}>
                      {feature}
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
