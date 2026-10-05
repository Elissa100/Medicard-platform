import { landingConfig } from "../../data/landing";

export function SolutionsStrip() {
  return (
    <section className="bg-white py-5">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-body-text font-semibold">
            {landingConfig.solutions.prefix}
          </span>
          {landingConfig.solutions.items.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center px-4 py-2 border-2 border-navy rounded-full text-sm font-semibold text-navy"
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
