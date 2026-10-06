import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section className="scroll-mt-[72px] md:scroll-mt-[88px] py-16 md:py-24 bg-white">
      <div className="max-w-[768px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="text-center mb-12">
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-navy mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-body-text max-w-2xl mx-auto">
            Common questions about Patient Vault, security, and payments
          </p>
        </div>

        <div className="space-y-4">
          {landingConfig.faq.map((faq, index) => (
            <div
              key={index}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-section-tint transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-inset"
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
                <div className="px-6 pb-4 text-body-text leading-relaxed">
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
