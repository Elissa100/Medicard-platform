import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function PatientVault() {
  const [showPlans, setShowPlans] = useState(false);

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

        <div className="max-w-[760px] mx-auto text-center mb-10">
          <p className="text-body-text text-base sm:text-lg mb-3">
            Patient Vault is MedCard's secure personal health record service. Store your medical history, allergies, prescriptions, lab results and insurance, all in one private place, and share it with healthcare providers when you authorize access.
          </p>
          <p className="text-muted-text text-sm mb-6">
            Choose a plan to get started in minutes, or sign in to your existing account.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPlans(!showPlans)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal text-white font-semibold px-7 py-3.5 rounded-full hover:bg-teal-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 cursor-pointer"
            >
              <span>{showPlans ? "Hide Plans" : "Get Started with Patient Vault"}</span>
              {showPlans ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            <a
              href="/patient-vault/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-navy bg-pale-cyan/60 hover:bg-pale-cyan border border-border rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
            >
              Sign In to Vault
            </a>

            <a
              href="/vault-clinic/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-[#0F2942] bg-white hover:bg-slate-50 border border-slate-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
            >
              Sign in as Clinic
            </a>
          </div>

          {!showPlans && (
            <p className="text-xs text-muted-text mt-4">
              Click &ldquo;Get Started with Patient Vault&rdquo; to view subscription tiers (starting from 1,000 RWF /mo).
            </p>
          )}
        </div>

        {/* Plan Details: Hidden until 'Get Started' is clicked */}
        {showPlans && (
          <div id="pricing-plans" className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-navy">Choose Your Vault Plan</h3>
              <p className="text-sm text-body-text mt-1">
                Transparent pricing with no long-term commitment. Cancel or upgrade anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-[900px] mx-auto">
              {landingConfig.patientVault.pricing.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 sm:p-8 rounded-[32px] h-full flex flex-col ${
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

                  <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                  {plan.subtitle && (
                    <p className={`mb-4 text-sm ${plan.featured ? "text-soft-text-on-navy" : "text-body-text"}`}>
                      {plan.subtitle}
                    </p>
                  )}
                  <div className="mb-6">
                    <span className="text-[48px] sm:text-[64px] font-bold leading-none">
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
                          <Check size={20} className="text-teal flex-shrink-0 mt-0.5" />
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
                    href={`/patient-vault?plan=${plan.name.toLowerCase()}`}
                    className={`inline-flex items-center justify-center w-full py-3.5 rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 ${
                      plan.featured
                        ? "bg-white text-navy hover:bg-pale-cyan"
                        : "bg-navy text-white hover:bg-mid-blue"
                    }`}
                  >
                    Get Started with {plan.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
