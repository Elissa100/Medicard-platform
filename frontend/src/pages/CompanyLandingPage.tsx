import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { SolutionsStrip } from "../components/landing/SolutionsStrip";
import { About } from "../components/landing/About";
import { Services } from "../components/landing/Services";
import { WhyMedicard } from "../components/landing/WhyMedicard";
import { FAQ } from "../components/landing/FAQ";
import { Contact } from "../components/landing/Contact";

export default function CompanyLandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-[72px] md:pt-[88px]">
        <Hero />
        <SolutionsStrip />
        <About />
        <Services />
        <WhyMedicard />
        <FAQ />
        <Contact />
      </main>
    </div>
  );
}
