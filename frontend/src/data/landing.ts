export const landingConfig = {
  slogan: "Technology Connecting People and Possibilities",
  
  contact: {
    phone: "0790 280 727",
    email: "",
    location: "Kigali, Rwanda",
    district: "Remera",
  },
  
  nav: {
    links: [
      { label: "Services", href: "#services" },
      { label: "Patient Vault", href: "#patient-vault" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    cta: {
      label: "Get Started",
      href: "#patient-vault",
    },
  },
  
  hero: {
    headline: "Smart Technology. Better Connections.",
    description: "MedCard provides innovative technology solutions that connect people, information and services across healthcare, education and other industries.",
    primaryCta: {
      label: "Explore Services",
      href: "#services",
    },
    secondaryCta: {
      label: "Patient Vault",
      href: "#patient-vault",
    },
  },
  
  about: {
    headline: "Who We Are",
    description: "MedCard is a technology company based in Kigali, Rwanda, developing NFC-powered solutions and manufacturing technology for healthcare, education and business sectors.",
  },
  
  services: {
    nfc: {
      headline: "NFC Technology",
      description: "Near Field Communication technology connecting people, information and services across multiple sectors.",
      sectors: [
        { name: "Healthcare", description: "Secure patient identity and connected medical records" },
        { name: "Education", description: "Digital campus cards and access control" },
        { name: "Business", description: "Secure identification and access management" },
      ],
      cta: {
        label: "Explore NFC Technology",
        href: "/nfc",
      },
    },
    manufacturing: {
      headline: "Manufacturing Technology",
      description: "Advanced manufacturing solutions specialized in dental technology and precision equipment.",
      sectors: [
        { name: "Dentistry", description: "Dental equipment and manufacturing technology" },
      ],
      cta: null,
    },
  },
  
  useCases: [
    {
      icon: "healthcare",
      title: "Healthcare",
      description: "Secure patient identity and connected medical records across facilities",
    },
    {
      icon: "education",
      title: "Education",
      description: "Digital campus cards and access control for schools and universities",
    },
    {
      icon: "business",
      title: "Business",
      description: "Secure identification and access management for organizations",
    },
    {
      icon: "dental",
      title: "Dental",
      description: "Precision manufacturing technology for dental equipment",
    },
  ],
  
  patientVault: {
    headline: "Patient Vault",
    description: "Secure subscription-based storage for your personal information and data",
    steps: [
      {
        number: "01",
        title: "Create Account",
        description: "Sign up and create your secure Patient Vault account",
      },
      {
        number: "02",
        title: "Store Information",
        description: "Upload and store your personal information securely",
      },
      {
        number: "03",
        title: "Access Anytime",
        description: "Access your stored data whenever you need it",
      },
    ],
    pricing: [
      {
        name: "Basic",
        price: "1,000",
        period: "month",
        currency: "RWF",
        features: [
          "Basic Patient Vault access",
          "Secure data storage",
          "Web access",
        ],
        featured: false,
      },
      {
        name: "Premium",
        price: "5,000",
        period: "month",
        currency: "RWF",
        features: [
          "Premium Patient Vault access",
          "Enhanced security features",
          "Priority support",
          "Mobile app access",
        ],
        featured: true,
      },
    ],
  },
  
  whyMedicard: [
    {
      title: "Technology",
      description: "Cutting-edge NFC and manufacturing technology solutions",
    },
    {
      title: "Innovation",
      description: "Continuous innovation to solve real-world problems",
    },
    {
      title: "Security",
      description: "Enterprise-grade security for your data and identity",
    },
    {
      title: "Accessibility",
      description: "Solutions designed for accessibility across Rwanda",
    },
  ],
  
  faq: [
    {
      question: "What is Patient Vault?",
      answer: "Patient Vault is a secure subscription service that allows you to store and access your personal information and data safely.",
    },
    {
      question: "How do I pay for Patient Vault?",
      answer: "Payment can be made through mobile money or bank transfer. Contact us for payment details.",
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time. Contact our support team for assistance.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use enterprise-grade security measures to protect your data and ensure privacy.",
    },
  ],
} as const;
