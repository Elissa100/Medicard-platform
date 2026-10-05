import { landingConfig } from "../../data/landing";

export function WhyMedicard() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy mb-4 font-serif">
            Why MedCard
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            What sets us apart
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {landingConfig.whyMedicard.map((item) => (
            <div key={item.title} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-teal-pale rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-teal rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
