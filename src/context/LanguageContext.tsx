import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "pt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "nav.howItWorks": "How it Works",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.testimonials": "Testimonials",
    "nav.faq": "FAQ",
    "nav.login": "Login",
    "nav.cta": "See the AI in Action",
    
    // Hero
    "hero.title1": "Automate",
    "hero.title2": "Your",
    "hero.title3": "Property",
    "hero.title4": "Management with",
    "hero.title5": "AI.",
    "hero.description": "Domly centralizes all your documents, maintenance, and resident communication into one simple, intelligent platform. End administrative chaos and gain full visibility of your properties.",
    "hero.dashboardDesc": "Manage your portfolio with a card-based interface. Instantly view asset status (e.g., 'Good', 'Excellent') for elevators and gates, and track maintenance history per fraction.",
    "hero.bookDemo": "Book a Demo",
    
    // Trust
    "trust.text": "Trusted by leading property managers and condominiums",
    
    // Security
    "security.strip": "Enterprise-grade security: Built with OAuth 2.0, SSL/TLS encryption, and Cloud redundancy to protect your community's data.",
    
    // Features
    "features.title": "Why Property Managers Choose Domly",
    "features.subtitle": "Transform chaos into clarity with intelligent automation",
    "features.ocr.title": "Semantic OCR Intelligence",
    "features.ocr.desc": "Go beyond simple scanning. Domly automatically classifies contracts and invoices, setting automated compliance alerts.",
    "features.predictive.title": "Predictive Financial Planning",
    "features.predictive.desc": "Utilize predictive algorithms to estimate future maintenance costs and reserve funds before they are needed.",
    "features.analytics.title": "Granular Asset Analytics",
    "features.analytics.desc": "Monitor the 'Health Score' of every elevator, gate, and pump individually, moving beyond general accounting to true asset management.",
    "features.eco.title": "Eco-Monitoring & Sustainability",
    "features.eco.desc": "Track environmental consumption and promote ecological practices within the condominium.",
    
    // How it Works
    "howItWorks.title": "How it Works?",
    "howItWorks.subtitle": "Get started in three simple steps",
    "howItWorks.step1.title": "Upload Your Data",
    "howItWorks.step1.desc": "Automatically build your entire condominium and asset portfolio by uploading a simple Excel/CSV file.",
    "howItWorks.step2.title": "Let the AI Organize",
    "howItWorks.step2.desc": "Drag and drop your existing documents. Domly's AI scans, tags, and organizes them, creating automatic maintenance and renewal alerts.",
    "howItWorks.step3.title": "Manage with Clarity",
    "howItWorks.step3.desc": "Use your central dashboard to track maintenance, monitor costs, and communicate with residents. All from a single platform.",
    
    // Pricing
    "pricing.title": "Simple, Transparent Pricing",
    "pricing.subtitle": "Choose the plan that fits your property portfolio",
    "pricing.starter": "Starter",
    "pricing.starter.desc": "For small, self-managed condominiums",
    "pricing.growth": "Growth",
    "pricing.growth.desc": "For growing portfolios",
    "pricing.pro": "Pro",
    "pricing.pro.desc": "For professional property managers",
    "pricing.mostPopular": "Most Popular",
    "pricing.month": "/month",
    "pricing.getStarted": "Get Started",
    "pricing.starterUnits": "1 condominium (up to 10 fractions)",
    "pricing.growthUnits": "Up to 3 condominiums (up to 50 fractions)",
    "pricing.proUnits": "Up to 10 condominiums (up to 250 fractions)",
    "pricing.docManagement": "Document Management",
    "pricing.advDocManagement": "Advanced Document Management",
    "pricing.aiOcr": "AI-Powered OCR",
    "pricing.basicDashboard": "Basic Dashboard",
    "pricing.financialDashboard": "Financial Dashboard",
    "pricing.emailSupport": "Email Support",
    "pricing.prioritySupport": "Priority Support",
    "pricing.premiumSupport": "24/7 Premium Support",
    "pricing.residentApp": "Resident Mobile App",
    "pricing.allGrowthFeatures": "All Growth features",
    "pricing.customIntegrations": "Custom integrations",
    "pricing.dedicatedManager": "Dedicated account manager",
    "pricing.predictiveFinancial": "Predictive Financial Planning",
    
    // Testimonials
    "testimonials.title": "What Our Customers Say",
    "testimonials.subtitle": "Join thousands of property managers who trust Domly",
    
    // FAQ
    "faq.title": "Frequently Asked Questions",
    "faq.subtitle": "Everything you need to know about Domly",
    "faq.q1": "How long does it take to implement Domly?",
    "faq.a1": "Most customers are up and running within 24-48 hours. Our AI automatically processes your uploaded documents, and our team provides hands-on onboarding support.",
    "faq.q2": "Is my data secure?",
    "faq.a2": "Absolutely. We use bank-level encryption, SOC 2 compliance, and GDPR-compliant data handling. Your data is stored in secure European data centers.",
    "faq.q3": "Can I use Domly for commercial properties?",
    "faq.a3": "Yes! While we specialize in residential condominiums, Domly works great for commercial properties, mixed-use buildings, and any type of property portfolio.",
    "faq.q4": "Is there a mobile app for residents?",
    "faq.a4": "Yes, our Pro and Enterprise plans include a mobile app where residents can report incidents, view announcements, and communicate with management.",
    "faq.q5": "What kind of support do you offer?",
    "faq.a5": "We offer email support for all plans, priority support for Pro users, and 24/7 dedicated support with a personal account manager for Enterprise customers.",
    
    // CTA
    "cta.title": "Ready to Transform Your Property Management?",
    "cta.subtitle": "Join thousands of property managers who save 10+ hours every week with Domly.",
    
    // Footer
    "footer.description": "The AI-powered platform that simplifies property management for condominiums and property managers.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.about": "About Us",
    "footer.careers": "Careers",
    "footer.blog": "Blog",
    "footer.contact": "Contact",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.cookies": "Cookie Policy",
    "footer.security": "Security",
    "footer.rights": "All rights reserved.",
    "footer.disclaimer": "Domly is a registered trademark. All product names, logos, and brands are property of their respective owners.",
  },
  pt: {
    // Header
    "nav.howItWorks": "Como Funciona",
    "nav.features": "Funcionalidades",
    "nav.pricing": "Preços",
    "nav.testimonials": "Testemunhos",
    "nav.faq": "FAQ",
    "nav.login": "Entrar",
    "nav.cta": "Ver a IA em Ação",
    
    // Hero
    "hero.title1": "Automatize",
    "hero.title2": "a Sua",
    "hero.title3": "Gestão de",
    "hero.title4": "Condomínios com",
    "hero.title5": "IA.",
    "hero.description": "O Domly centraliza todos os seus documentos, manutenção e comunicação com condóminos numa plataforma simples e inteligente. Acabe com o caos administrativo e ganhe visibilidade total das suas propriedades.",
    "hero.dashboardDesc": "Gerencie o seu portfólio com uma interface baseada em cartões. Veja instantaneamente o estado dos ativos (ex.: 'Bom', 'Excelente') para elevadores e portões, e acompanhe o histórico de manutenção por fração.",
    "hero.bookDemo": "Agendar Demo",
    
    // Trust
    "trust.text": "Confiado por gestores de condomínios e propriedades líderes",
    
    // Security
    "security.strip": "Segurança de nível empresarial: Construído com OAuth 2.0, encriptação SSL/TLS e redundância Cloud para proteger os dados da sua comunidade.",
    
    // Features
    "features.title": "Porque os Gestores Escolhem o Domly",
    "features.subtitle": "Transforme o caos em clareza com automação inteligente",
    "features.ocr.title": "Inteligência OCR Semântica",
    "features.ocr.desc": "Vá além da simples digitalização. O Domly classifica automaticamente contratos e faturas, definindo alertas de conformidade automatizados.",
    "features.predictive.title": "Planeamento Financeiro Preditivo",
    "features.predictive.desc": "Utilize algoritmos preditivos para estimar custos de manutenção futuros e fundos de reserva antes de serem necessários.",
    "features.analytics.title": "Análise Granular de Ativos",
    "features.analytics.desc": "Monitorize o 'Health Score' de cada elevador, portão e bomba individualmente, indo além da contabilidade geral para uma verdadeira gestão de ativos.",
    "features.eco.title": "Eco-Monitorização e Sustentabilidade",
    "features.eco.desc": "Acompanhe o consumo ambiental e promova práticas ecológicas dentro do condomínio.",
    
    // How it Works
    "howItWorks.title": "Como Funciona?",
    "howItWorks.subtitle": "Comece em três passos simples",
    "howItWorks.step1.title": "Carregue os Seus Dados",
    "howItWorks.step1.desc": "Construa automaticamente todo o seu portfólio de condomínios e ativos carregando um simples ficheiro Excel/CSV.",
    "howItWorks.step2.title": "Deixe a IA Organizar",
    "howItWorks.step2.desc": "Arraste e largue os seus documentos existentes. A IA do Domly digitaliza, etiqueta e organiza-os, criando alertas automáticos de manutenção e renovação.",
    "howItWorks.step3.title": "Gerencie com Clareza",
    "howItWorks.step3.desc": "Use o seu painel central para acompanhar manutenções, monitorizar custos e comunicar com condóminos. Tudo numa única plataforma.",
    
    // Pricing
    "pricing.title": "Preços Simples e Transparentes",
    "pricing.subtitle": "Escolha o plano que se adapta ao seu portfólio",
    "pricing.starter": "Starter",
    "pricing.starter.desc": "Para pequenos condomínios autogeridos",
    "pricing.growth": "Growth",
    "pricing.growth.desc": "Para portfólios em crescimento",
    "pricing.pro": "Pro",
    "pricing.pro.desc": "Para gestores profissionais",
    "pricing.mostPopular": "Mais Popular",
    "pricing.month": "/mês",
    "pricing.getStarted": "Começar",
    "pricing.starterUnits": "1 condomínio (até 10 frações)",
    "pricing.growthUnits": "Até 3 condomínios (até 50 frações)",
    "pricing.proUnits": "Até 10 condomínios (até 250 frações)",
    "pricing.docManagement": "Gestão de Documentos",
    "pricing.advDocManagement": "Gestão Avançada de Documentos",
    "pricing.aiOcr": "OCR com IA",
    "pricing.basicDashboard": "Painel Básico",
    "pricing.financialDashboard": "Painel Financeiro",
    "pricing.emailSupport": "Suporte por Email",
    "pricing.prioritySupport": "Suporte Prioritário",
    "pricing.premiumSupport": "Suporte Premium 24/7",
    "pricing.residentApp": "App Móvel para Condóminos",
    "pricing.allGrowthFeatures": "Todas as funcionalidades Growth",
    "pricing.customIntegrations": "Integrações personalizadas",
    "pricing.dedicatedManager": "Gestor de conta dedicado",
    "pricing.predictiveFinancial": "Planeamento Financeiro Preditivo",
    
    // Testimonials
    "testimonials.title": "O Que Dizem os Nossos Clientes",
    "testimonials.subtitle": "Junte-se a milhares de gestores que confiam no Domly",
    
    // FAQ
    "faq.title": "Perguntas Frequentes",
    "faq.subtitle": "Tudo o que precisa saber sobre o Domly",
    "faq.q1": "Quanto tempo leva a implementar o Domly?",
    "faq.a1": "A maioria dos clientes está operacional em 24-48 horas. A nossa IA processa automaticamente os documentos carregados, e a nossa equipa oferece suporte de onboarding personalizado.",
    "faq.q2": "Os meus dados estão seguros?",
    "faq.a2": "Absolutamente. Usamos encriptação de nível bancário, conformidade SOC 2 e tratamento de dados em conformidade com o RGPD. Os seus dados são armazenados em centros de dados europeus seguros.",
    "faq.q3": "Posso usar o Domly para propriedades comerciais?",
    "faq.a3": "Sim! Embora nos especializemos em condomínios residenciais, o Domly funciona muito bem para propriedades comerciais, edifícios mistos e qualquer tipo de portfólio imobiliário.",
    "faq.q4": "Existe uma app móvel para condóminos?",
    "faq.a4": "Sim, os nossos planos Pro e Enterprise incluem uma app móvel onde os condóminos podem reportar incidentes, ver anúncios e comunicar com a gestão.",
    "faq.q5": "Que tipo de suporte oferecem?",
    "faq.a5": "Oferecemos suporte por email para todos os planos, suporte prioritário para utilizadores Pro, e suporte dedicado 24/7 com um gestor de conta pessoal para clientes Enterprise.",
    
    // CTA
    "cta.title": "Pronto para Transformar a Sua Gestão de Condomínios?",
    "cta.subtitle": "Junte-se a milhares de gestores que poupam mais de 10 horas por semana com o Domly.",
    
    // Footer
    "footer.description": "A plataforma com IA que simplifica a gestão de condomínios e propriedades.",
    "footer.product": "Produto",
    "footer.company": "Empresa",
    "footer.legal": "Legal",
    "footer.about": "Sobre Nós",
    "footer.careers": "Carreiras",
    "footer.blog": "Blog",
    "footer.contact": "Contacto",
    "footer.privacy": "Política de Privacidade",
    "footer.terms": "Termos de Serviço",
    "footer.cookies": "Política de Cookies",
    "footer.security": "Segurança",
    "footer.rights": "Todos os direitos reservados.",
    "footer.disclaimer": "Domly é uma marca registada. Todos os nomes de produtos, logótipos e marcas são propriedade dos respetivos proprietários.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
