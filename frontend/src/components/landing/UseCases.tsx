import { landingConfig } from "../../data/landing";

export function UseCases() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy mb-4 font-serif">
            Use Cases
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            How our technology works across industries
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {landingConfig.useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="p-6 bg-gray-50 rounded-lg hover:bg-teal-pale transition-colors"
            >
              <h3 className="text-lg font-semibold text-navy mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-gray-600">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
