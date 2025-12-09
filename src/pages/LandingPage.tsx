import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  TrendingUp,
  MessageSquare,
  Star,
  Check,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Globe,
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Autoplay from "embla-carousel-autoplay";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import domlyLogo from "@/assets/domly-final-logo.png";
import vanguardLogo from "@/assets/vanguard-logo.jpg";
import sierraLogo from "@/assets/sierra-logo.webp";
import jllLogo from "@/assets/jll-logo.png";
import startupPortugalLogo from "@/assets/startup-portugal-logo.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DemoBookingModal } from "@/components/DemoBookingModal";
import { useLanguage } from "@/context/LanguageContext";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Refs for scroll animations
  const trustRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const howItWorksRef = useScrollReveal();
  const pricingRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const faqRef = useScrollReveal();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "pt" : "en");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hero-gradient-start to-hero-gradient-end">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-hero-gradient-start/95 to-hero-gradient-start/90 backdrop-blur supports-[backdrop-filter]:from-hero-gradient-start/80 border-b border-border/20 container mx-auto px-4 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={domlyLogo} alt="Domly AI" className="h-8" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm ">
            <a href="#how-it-works" className="text-black hover:text-primary transition-colors">
              {t("nav.howItWorks")}
            </a>
            <a href="#features" className="text-black hover:text-primary transition-colors">
              {t("nav.features")}
            </a>
            <a href="#pricing" className="text-black hover:text-primary transition-colors">
              {t("nav.pricing")}
            </a>
            <a href="#testimonials" className="text-black hover:text-primary transition-colors">
              {t("nav.testimonials")}
            </a>
            <a href="#faq" className="text-black hover:text-primary transition-colors">
              {t("nav.faq")}
            </a>
          </nav>

          <div className="flex gap-3 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? "PT" : "EN"}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">
              {t("nav.login")}
            </Button>
            <Button onClick={() => setIsDemoModalOpen(true)} className="text-sm">
              {t("nav.cta")}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-primary">{t("hero.title1")}</span> {t("hero.title2")}
              <br />
              {t("hero.title3")}
              <br />
              {t("hero.title4")}
              <br />
              {t("hero.title5")}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              {t("hero.description")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => setIsDemoModalOpen(true)} className="btn-hover-lift btn-hover-glow">
                {t("nav.cta")}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/signup")} className="btn-hover-lift">
                {t("hero.bookDemo")}
              </Button>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
              <img src={dashboardMockup} alt="Domly Dashboard Interface" className="w-full h-auto" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl -z-10 transform translate-y-8"></div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section ref={trustRef} className="container mx-auto px-4 py-12 scroll-reveal">
        <p className="text-center text-sm text-muted-foreground mb-8">
          {t("trust.text")}
        </p>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 2000,
              stopOnInteraction: false,
            }),
          ]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {[
              { name: "Vanguard Properties", logo: vanguardLogo },
              { name: "Sierra Sonae", logo: sierraLogo },
              { name: "JLL", logo: jllLogo },
              { name: "Startup Portugal", logo: startupPortugalLogo },
              { name: "Vanguard Properties", logo: vanguardLogo },
              { name: "Sierra Sonae", logo: sierraLogo },
              { name: "JLL", logo: jllLogo },
              { name: "Startup Portugal", logo: startupPortugalLogo },
            ].map((partner, index) => (
              <CarouselItem key={index} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                <div className="flex items-center justify-center p-6">
                  <div className="flex items-center justify-center h-20 opacity-50 hover:opacity-80 transition-opacity">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="max-h-16 max-w-full object-contain grayscale"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="container mx-auto px-4 py-20 md:py-32 scroll-reveal">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("features.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{t("features.doc.title")}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t("features.doc.desc")}
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{t("features.control.title")}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t("features.control.desc")}
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{t("features.comm.title")}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t("features.comm.desc")}
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section ref={howItWorksRef} id="how-it-works" className="bg-background py-20 md:py-32 scroll-reveal-left">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("howItWorks.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">{t("howItWorks.step1.title")}</h3>
              <p className="text-muted-foreground">
                {t("howItWorks.step1.desc")}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">{t("howItWorks.step2.title")}</h3>
              <p className="text-muted-foreground">
                {t("howItWorks.step2.desc")}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">{t("howItWorks.step3.title")}</h3>
              <p className="text-muted-foreground">
                {t("howItWorks.step3.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} id="pricing" className="container mx-auto px-4 py-20 md:py-32 scroll-reveal-right">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("pricing.title")}</h2>
          <p className="text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-foreground mb-2">{t("pricing.starter")}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t("pricing.starter.desc")}</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">$49</span>
              <span className="text-muted-foreground">{t("pricing.month")}</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.units50")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.docManagement")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.aiOcr")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.basicDashboard")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.emailSupport")}</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full btn-hover-lift" onClick={() => navigate("/signup")}>
              {t("pricing.getStarted")}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="bg-primary text-primary-foreground border-2 border-primary rounded-2xl p-8 relative shadow-xl scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-1 rounded-full text-sm font-semibold">
              {t("pricing.mostPopular")}
            </div>
            <h3 className="text-2xl font-bold mb-2">{t("pricing.pro")}</h3>
            <p className="text-sm text-primary-foreground/80 mb-6">{t("pricing.pro.desc")}</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$149</span>
              <span className="text-primary-foreground/80">{t("pricing.month")}</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{t("pricing.units200")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{t("pricing.advDocManagement")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{t("pricing.aiOcr")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{t("pricing.financialDashboard")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{t("pricing.residentApp")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{t("pricing.prioritySupport")}</span>
              </li>
            </ul>
            <Button
              variant="secondary"
              className="w-full bg-background text-foreground hover:bg-background/90 btn-hover-lift btn-hover-glow"
              onClick={() => navigate("/signup")}
            >
              {t("pricing.getStarted")}
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-foreground mb-2">{t("pricing.enterprise")}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t("pricing.enterprise.desc")}</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">{t("pricing.custom")}</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.unitsUnlimited")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.allProFeatures")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.customIntegrations")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.dedicatedManager")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.premiumSupport")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{t("pricing.onPremise")}</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full btn-hover-lift">
              {t("pricing.contactSales")}
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} id="testimonials" className="bg-background py-20 md:py-32 scroll-reveal">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("testimonials.title")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("testimonials.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-card border rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 italic">
                "Domly cut our administrative time by 50%. The automatic alerts for insurance renewals are a lifesaver."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-semibold text-foreground">MC</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">Property Manager</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-card border rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 italic">
                "We finally have true visibility into our costs. The financial dashboard is transparent and a
                game-changer for budgeting."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-semibold text-foreground">SJ</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Condo Board Member</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-card border rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 italic">
                "Reporting a broken light took 30 seconds on the app, and I saw exactly when it was fixed. Amazing."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-semibold text-foreground">DM</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">David Martinez</p>
                  <p className="text-sm text-muted-foreground">Resident</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} id="faq" className="container mx-auto px-4 py-20 md:py-32 scroll-reveal">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("faq.title")}</h2>
          <p className="text-lg text-muted-foreground">{t("faq.subtitle")}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faq.q1")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq.a1")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faq.q2")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq.a2")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faq.q3")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq.a3")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faq.q4")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq.a4")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {t("faq.q5")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("faq.a5")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90 mb-4 btn-hover-lift btn-hover-glow"
            onClick={() => setIsDemoModalOpen(true)}
          >
            {t("nav.cta")}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1d29] text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={domlyLogo} alt="Domly AI" className="h-8" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t("footer.description")}
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t("footer.product")}</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    {t("nav.features")}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                    {t("nav.pricing")}
                  </a>
                </li>
                <li>
                  <a href="#security" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.security")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t("footer.company")}</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.about")}
                  </a>
                </li>
                <li>
                  <a href="#careers" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.careers")}
                  </a>
                </li>
                <li>
                  <a href="#blog" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.blog")}
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.contact")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t("footer.legal")}</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.privacy")}
                  </a>
                </li>
                <li>
                  <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.terms")}
                  </a>
                </li>
                <li>
                  <a href="#cookies" className="text-gray-400 hover:text-white transition-colors">
                    {t("footer.cookies")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2024 Domly. {t("footer.rights")}</p>

            <div className="flex gap-6">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <DemoBookingModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </div>
  );
};
