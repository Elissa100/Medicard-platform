import { landingConfig } from "../../data/landing";

export function PatientVault() {
  return (
    <section id="patient-vault" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy mb-4 font-serif">
            {landingConfig.patientVault.headline}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {landingConfig.patientVault.description}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {landingConfig.patientVault.steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-4xl font-bold text-teal mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-navy mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {landingConfig.patientVault.pricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-xl ${
                plan.featured
                  ? "bg-navy text-white shadow-xl scale-105"
                  : "bg-white shadow-md"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-teal text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.currency} {plan.price}
                </span>
                <span className="text-gray-500">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />
                    <span className={plan.featured ? "text-gray-100" : "text-gray-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.featured
                    ? "bg-teal text-white hover:bg-teal-dark"
                    : "bg-navy text-white hover:bg-navy-dark"
                }`}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
