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
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Patient Vault", href: "#patient-vault" },
      { label: "Contact", href: "#contact" },
    ],
    cta: {
      label: "Explore Services",
      href: "#services",
    },
  },
  
  hero: {
    eyebrow: "Technology company in Kigali, Rwanda",
    headline: "Technology connecting people and possibilities.",
    description: "Medicard builds NFC, manufacturing and data solutions that connect people, information and services across healthcare, education and business.",
    primaryCta: {
      label: "Explore Services",
      href: "#services",
    },
    secondaryCta: {
      label: "Patient Vault",
      href: "#patient-vault",
    },
  },
  
  solutions: {
    prefix: "Solutions for",
    items: [
      { label: "Healthcare" },
      { label: "Education" },
      { label: "Business" },
      { label: "Dentistry" },
    ],
  },
  
  about: {
    eyebrow: "About Medicard",
    headlinePart1: "One company.",
    headlinePart2: "Many ways to connect.",
    description: "Medicard is a technology company. We design and deliver solutions that connect people, information and services, from healthcare identity to education, business and precision manufacturing.",
  },
  
  services: {
    eyebrow: "Our services",
    headline: "Two ways we put technology to work.",
    nfc: {
      label: "Service 01",
      title: "NFC Technology",
      description: "Near field communication for healthcare, education, business and other industries.",
      pills: [
        { label: "Healthcare" },
        { label: "Education" },
        { label: "Business" },
        { label: "And more" },
      ],
      cta: {
        label: "Explore NFC Technology",
        href: "/nfc",
      },
    },
    manufacturing: {
      label: "Service 02",
      title: "Manufacturing Technology",
      description: "Precision technology for production, starting with dental solutions.",
      pills: [
        { label: "Dentistry" },
      ],
      cta: {
        label: "Coming soon",
        href: "",
        disabled: true,
      },
    },
  },
  
  patientVault: {
    eyebrow: "Patient Vault",
    headlinePart1: "Your health information,",
    headlinePart2: "safe and always within reach.",
    steps: [
      {
        number: "1",
        title: "Create your account",
        description: "Sign up in a few minutes.",
      },
      {
        number: "2",
        title: "Store your information",
        description: "Keep your records in one private place.",
      },
      {
        number: "3",
        title: "Access it anytime",
        description: "View your data and manage your plan.",
      },
    ],
    pricing: [
      {
        name: "Basic",
        price: "1,000",
        period: "RWF per month",
        description: "Basic Patient Vault access",
        features: [],
        featured: false,
      },
      {
        name: "Premium",
        price: "5,000",
        period: "RWF per month",
        description: "Premium Patient Vault access",
        features: [],
        featured: true,
      },
    ],
  },
  
  whyMedicard: [
    {
      icon: "Cpu",
      title: "Technology",
      description: "NFC and manufacturing technology under one roof.",
    },
    {
      icon: "Lightbulb",
      title: "Innovation",
      description: "Practical solutions designed around real needs.",
    },
    {
      icon: "ShieldCheck",
      title: "Security",
      description: "Your information is handled with care and kept private.",
    },
    {
      icon: "Users",
      title: "Accessibility",
      description: "Simple to use, affordable and available across Rwanda.",
    },
  ],
  
  faq: [
    {
      question: "What is Patient Vault?",
      answer: "Patient Vault is a secure subscription service that allows you to store and access your personal information and data safely.",
    },
    {
      question: "How do I pay for Patient Vault?",
      answer: "Contact us for payment details.",
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time. Contact our support team for assistance.",
    },
    {
      question: "Is my data secure?",
      answer: "We handle your information with care and keep it private.",
    },
  ],
};
