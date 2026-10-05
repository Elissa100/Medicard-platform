import { useState } from "react";
import { Menu, X } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/medcard-logo.svg"
              alt="MedCard"
              className="h-8 w-auto"
            />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {landingConfig.nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-navy transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={landingConfig.nav.cta.href}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-navy rounded-md hover:bg-navy-dark transition-colors"
            >
              {landingConfig.nav.cta.label}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-navy"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-3">
            {landingConfig.nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-600 hover:text-navy"
              >
                {link.label}
              </a>
            ))}
            <a
              href={landingConfig.nav.cta.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-navy"
            >
              {landingConfig.nav.cta.label}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
