import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { SolutionsStrip } from "../components/landing/SolutionsStrip";
import { About } from "../components/landing/About";
import { Services } from "../components/landing/Services";
import { PatientVault } from "../components/landing/PatientVault";
import { WhyMedicard } from "../components/landing/WhyMedicard";
import { FAQ } from "../components/landing/FAQ";
import { Contact } from "../components/landing/Contact";

export default function CompanyLandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <SolutionsStrip />
        <About />
        <Services />
        <PatientVault />
        <WhyMedicard />
        <FAQ />
        <Contact />
      </main>
    </div>
  );
}
