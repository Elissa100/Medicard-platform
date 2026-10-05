import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { About } from "../components/landing/About";
import { Services } from "../components/landing/Services";
import { UseCases } from "../components/landing/UseCases";
import { PatientVault } from "../components/landing/PatientVault";
import { WhyMedicard } from "../components/landing/WhyMedicard";
import { FAQ } from "../components/landing/FAQ";
import { Contact } from "../components/landing/Contact";
import { Footer } from "../components/landing/Footer";

export default function CompanyLandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <UseCases />
        <PatientVault />
        <WhyMedicard />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
