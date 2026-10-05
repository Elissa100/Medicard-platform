import { ArrowRight } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Services() {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy mb-4 font-serif">
            Our Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Technology solutions across multiple sectors
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold text-navy mb-4">
              {landingConfig.services.nfc.headline}
            </h3>
            <p className="text-gray-600 mb-6">
              {landingConfig.services.nfc.description}
            </p>
            <div className="space-y-4 mb-8">
              {landingConfig.services.nfc.sectors.map((sector) => (
                <div key={sector.name} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-teal flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-navy">{sector.name}</h4>
                    <p className="text-sm text-gray-500">{sector.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {landingConfig.services.nfc.cta && (
              <a
                href={landingConfig.services.nfc.cta.href}
                className="inline-flex items-center text-teal font-semibold hover:text-teal-dark transition-colors"
              >
                {landingConfig.services.nfc.cta.label}
                <ArrowRight size={18} className="ml-2" />
              </a>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold text-navy mb-4">
              {landingConfig.services.manufacturing.headline}
            </h3>
            <p className="text-gray-600 mb-6">
              {landingConfig.services.manufacturing.description}
            </p>
            <div className="space-y-4 mb-8">
              {landingConfig.services.manufacturing.sectors.map((sector) => (
                <div key={sector.name} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-teal flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-navy">{sector.name}</h4>
                    <p className="text-sm text-gray-500">{sector.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {landingConfig.services.manufacturing.cta && (
              <a
                href={landingConfig.services.manufacturing.cta.href}
                className="inline-flex items-center text-teal font-semibold hover:text-teal-dark transition-colors"
              >
                {landingConfig.services.manufacturing.cta.label}
                <ArrowRight size={18} className="ml-2" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
