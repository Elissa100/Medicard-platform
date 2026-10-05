import { Cpu, Database, Wrench } from "lucide-react";
import { landingConfig } from "../../data/landing";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-section-tint py-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pale-cyan rounded-full">
              <div className="w-2 h-2 rounded-full bg-teal" />
              <span className="text-sm font-semibold text-teal">
                {landingConfig.hero.eyebrow}
              </span>
            </div>
            <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-bold text-navy leading-[1.1] font-sans">
              Technology connecting<br />
              people and{" "}
              <span className="text-teal italic font-serif">
                possibilities.
              </span>
            </h1>
            <p className="text-[clamp(1.125rem,2vw,1.25rem)] text-body-text max-w-[34rem]">
              {landingConfig.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={landingConfig.hero.primaryCta.href}
                className="inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
              >
                {landingConfig.hero.primaryCta.label}
              </a>
              <a
                href={landingConfig.hero.secondaryCta.href}
                className="inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-navy border-2 border-navy rounded-full hover:bg-navy hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
              >
                {landingConfig.hero.secondaryCta.label}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[500px] lg:min-h-[700px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[340px] h-[340px] md:w-[410px] md:h-[410px]">
                <div
                  className="absolute inset-0 border-2 border-teal rounded-full opacity-[0.07]"
                  style={{ animation: "pulse-ring 6s ease-in-out infinite" }}
                />
                <div
                  className="absolute inset-0 border-2 border-teal rounded-full opacity-[0.14]"
                  style={{ 
                    animation: "pulse-ring 6s ease-in-out infinite",
                    animationDelay: "1.5s",
                  }}
                />
                <div
                  className="absolute inset-0 border-2 border-teal rounded-full opacity-[0.26]"
                  style={{ 
                    animation: "pulse-ring 6s ease-in-out infinite",
                    animationDelay: "3s",
                  }}
                />
                <div
                  className="absolute inset-0 border-2 border-teal rounded-full opacity-[0.4]"
                  style={{ 
                    animation: "pulse-ring 6s ease-in-out infinite",
                    animationDelay: "4.5s",
                  }}
                />
              </div>
            </div>

            <div
              className="relative w-[300px] md:w-[460px] h-[190px] md:h-[290px] rounded-[28px] shadow-soft"
              style={{ 
                animation: "float 6s ease-in-out infinite",
                transform: "rotate(-8deg)",
              }}
            >
              <div className="absolute inset-0 rounded-[28px] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[35%] bg-[#EAF7FB]" />
                <svg
                  className="absolute bottom-0 left-0 right-0 h-[65%]"
                  viewBox="0 0 460 188"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 188 L0 120 Q115 80 230 120 Q345 160 460 120 L460 188 Z"
                    fill="#A7D5E6"
                  />
                  <path
                    d="M0 188 L0 100 Q115 60 230 100 Q345 140 460 100 L460 188 Z"
                    fill="#2A7AA5"
                  />
                  <path
                    d="M0 188 L0 80 Q115 40 230 80 Q345 120 460 80 L460 188 Z"
                    fill="#003F66"
                  />
                </svg>
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-8 h-8">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15 8H9L12 2Z" fill="#003F66" />
                    <path d="M12 22L9 16H15L12 22Z" fill="#00A3B8" />
                    <path d="M2 12L8 9V15L2 12Z" fill="#003F66" />
                    <path d="M22 12L16 15V9L22 12Z" fill="#00A3B8" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-navy font-bold text-sm leading-none">MedCard</span>
                  <span className="text-teal text-xs">Technology Solutions</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 w-10 h-8 bg-[#F7C443] rounded-[18px]" />

              <div className="absolute bottom-8 left-4">
                <div className="text-navy font-bold text-sm">John Doe</div>
                <div className="text-body-text text-xs">ID: 123456789</div>
              </div>

              <div className="absolute bottom-8 right-4 flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 border-2 border-white rounded-full opacity-60"
                  />
                ))}
              </div>
            </div>

            <div
              className="absolute top-[20%] right-[5%] w-[200px] md:w-[236px] h-[50px] md:h-[60px] bg-white rounded-[18px] shadow-soft p-3 flex items-center gap-3"
              style={{ animation: "float-card 6s ease-in-out infinite", animationDelay: "1s" }}
            >
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <Cpu size={20} className="text-teal" />
              </div>
              <div className="flex flex-col">
                <span className="text-navy font-bold text-sm">NFC tap</span>
                <span className="text-body-text text-xs">Identity verified in a moment</span>
              </div>
            </div>

            <div
              className="absolute bottom-[30%] left-[0%] w-[200px] md:w-[236px] h-[50px] md:h-[60px] bg-white rounded-[18px] shadow-soft p-3 flex items-center gap-3"
              style={{ animation: "float-card 6s ease-in-out infinite", animationDelay: "2s" }}
            >
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <Database size={20} className="text-teal" />
              </div>
              <div className="flex flex-col">
                <span className="text-navy font-bold text-sm">Patient Vault</span>
                <span className="text-body-text text-xs">Your data, stored securely</span>
              </div>
            </div>

            <div
              className="absolute bottom-[10%] right-[10%] w-[200px] md:w-[236px] h-[50px] md:h-[60px] bg-white rounded-[18px] shadow-soft p-3 flex items-center gap-3"
              style={{ animation: "float-card 6s ease-in-out infinite", animationDelay: "3s" }}
            >
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <Wrench size={20} className="text-teal" />
              </div>
              <div className="flex flex-col">
                <span className="text-navy font-bold text-sm">Precision manufacturing</span>
                <span className="text-body-text text-xs">Dental technology</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
