import { landingConfig } from "../../data/landing";

export function Footer() {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <img
              src="/medcard-logo.svg"
              alt="MedCard"
              className="h-8 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-gray-300 text-sm">
              {landingConfig.slogan}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#patient-vault" className="hover:text-white transition-colors">
                  Patient Vault
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{landingConfig.contact.phone}</li>
              <li>{landingConfig.contact.location}</li>
              <li>{landingConfig.contact.district}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 MedCard · {landingConfig.contact.location}</p>
        </div>
      </div>
    </footer>
  );
}
