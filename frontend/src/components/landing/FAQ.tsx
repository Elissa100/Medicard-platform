import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy mb-4 font-serif">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Common questions about Patient Vault
          </p>
        </div>

        <div className="space-y-4">
          {landingConfig.faq.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-navy">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={20} className="text-teal flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-teal flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
