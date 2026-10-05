import { Phone, MapPin } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Contact() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy mb-4 font-serif">
            Contact Us
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get in touch with our team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-teal-pale rounded-full flex items-center justify-center">
              <Phone size={24} className="text-teal" />
            </div>
            <h3 className="font-semibold text-navy mb-2">Phone</h3>
            <p className="text-gray-600">{landingConfig.contact.phone}</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-teal-pale rounded-full flex items-center justify-center">
              <MapPin size={24} className="text-teal" />
            </div>
            <h3 className="font-semibold text-navy mb-2">Location</h3>
            <p className="text-gray-600">{landingConfig.contact.location}</p>
            <p className="text-sm text-gray-500">{landingConfig.contact.district}</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-teal-pale rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-teal rounded-full" />
            </div>
            <h3 className="font-semibold text-navy mb-2">Email</h3>
            <p className="text-gray-600">
              {landingConfig.contact.email || "Coming soon"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
