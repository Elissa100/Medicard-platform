import { useState } from "react";
import { Check, X, ArrowRight, Lock, Smartphone } from "lucide-react";
import { landingConfig } from "../data/landing";

type Step = "plans" | "account" | "payment" | "confirm";

export default function PatientVaultPage() {
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"airtel" | "mtn" | null>(null);

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setStep("account");
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email || phone) {
      setStep("payment");
    }
  };

  const handlePaymentSelect = (method: "airtel" | "mtn") => {
    setPaymentMethod(method);
    setStep("confirm");
  };

  const handleConfirm = () => {
    // Simulate payment and account creation
    alert("Account created! Redirecting to storage portal...");
  };

  const goBack = () => {
    if (step === "payment") setStep("account");
    else if (step === "confirm") setStep("payment");
    else if (step === "account") setStep("plans");
  };

  return (
    <div className="min-h-screen bg-section-tint py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => window.location.href = "/"}
          className="text-sm text-body-text hover:text-navy mb-6 inline-flex items-center gap-1"
        >
          <ArrowRight size={14} className="rotate-180" />
          Back to Home
        </button>

        <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "plans" ? "bg-teal text-white" : "bg-teal text-white"
            }`}>1</div>
            <div className={`h-0.5 w-8 ${step === "plans" ? "bg-border" : "bg-teal"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "account" || step === "payment" || step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>2</div>
            <div className={`h-0.5 w-8 ${step === "payment" || step === "confirm" ? "bg-teal" : "bg-border"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "payment" || step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>3</div>
            <div className={`h-0.5 w-8 ${step === "confirm" ? "bg-teal" : "bg-border"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "confirm" ? "bg-teal text-white" : "bg-border text-body-text"
            }`}>4</div>
          </div>

          {step === "plans" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">
                  {landingConfig.patientVault.headlinePart1}
                </h1>
                <p className="text-teal italic font-serif text-xl md:text-2xl">
                  {landingConfig.patientVault.headlinePart2}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {landingConfig.patientVault.pricing.map((plan: any) => (
                  <div
                    key={plan.name}
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`relative p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      plan.featured
                        ? "bg-navy text-white border-2 border-teal"
                        : "bg-white border border-border hover:border-teal"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute top-0 right-0 bg-teal text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        POPULAR
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    {plan.subtitle && (
                      <p className={`mb-3 text-sm ${plan.featured ? "text-soft-text-on-navy" : "text-body-text"}`}>
                        {plan.subtitle}
                      </p>
                    )}
                    <div className="mb-4">
                      <span className="text-4xl font-bold leading-none">
                        {plan.price}
                      </span>
                      <span className={plan.featured ? "text-soft-text-on-navy" : "text-muted-text"}>
                        {" "}{plan.period}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.slice(0, 4).map((feature: any, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {feature.active ? (
                            <Check size={16} className={plan.featured ? "text-teal flex-shrink-0" : "text-teal flex-shrink-0"} />
                          ) : (
                            <X size={16} className="text-muted-text flex-shrink-0" />
                          )}
                          <span className={plan.featured ? "text-white" : feature.active ? "text-navy" : "text-muted-text"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                      <span>Choose Plan</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "account" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Create Your Account</h2>
                <p className="text-body-text text-sm">Choose {selectedPlan} Plan</p>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-teal"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-navy rounded-lg hover:bg-mid-blue transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "payment" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Choose Payment Method</h2>
                <p className="text-body-text text-sm">Select your mobile money provider</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => handlePaymentSelect("airtel")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === "airtel"
                      ? "border-red-500 bg-red-50"
                      : "border-border hover:border-red-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Smartphone size={24} className="text-red-500" />
                    <span className="font-bold text-navy">Airtel Money</span>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelect("mtn")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === "mtn"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-border hover:border-yellow-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Smartphone size={24} className="text-yellow-500" />
                    <span className="font-bold text-navy">MTN Mobile Money</span>
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy mb-1">Confirm Payment</h2>
                <p className="text-body-text text-sm">Review your subscription</p>
              </div>

              <div className="bg-section-tint rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-body-text">Plan</span>
                  <span className="font-semibold text-navy">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-body-text">Payment Method</span>
                  <span className="font-semibold text-navy capitalize">{paymentMethod} Money</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-body-text">Email/Phone</span>
                  <span className="font-semibold text-navy">{email || phone}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-navy">Total</span>
                  <span className="font-bold text-navy">
                    {selectedPlan === "Premium Vault" ? "5,000 RWF" : "1,000 RWF"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-pale-cyan rounded-lg text-xs text-teal mb-6">
                <Lock size={12} />
                <span>Secure payment powered by Rwanda National Payment Gateway</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-navy border border-border rounded-lg hover:bg-section-tint transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal rounded-lg hover:bg-teal/90 transition-colors"
                >
                  Confirm & Pay
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
