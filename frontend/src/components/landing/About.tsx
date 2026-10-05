import { landingConfig } from "../../data/landing";

export function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-navy mb-6 font-serif">
            {landingConfig.about.headline}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {landingConfig.about.description}
          </p>
        </div>
      </div>
    </section>
  );
}
