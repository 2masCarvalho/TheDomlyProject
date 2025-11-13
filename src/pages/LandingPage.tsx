import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileText,
  TrendingUp,
  MessageSquare,
  Upload,
  Sparkles,
  LayoutDashboard,
  Star,
  Check,
  ChevronDown,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import domlyLogo from "@/assets/domly-logo.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Refs for scroll animations
  const trustRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const howItWorksRef = useScrollReveal();
  const pricingRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const faqRef = useScrollReveal();

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
              How it Works
            </a>
            <a href="#features" className="text-black hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-black hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-black hover:text-primary transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-black hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex gap-3 items-center">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">
              Login
            </Button>
            <Button onClick={() => navigate("/signup")} className="text-sm">
              See the AI in Action
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-primary">Automate</span> Your
              <br />
              Property
              <br />
              Management with
              <br />
              AI.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Domly centralizes all your documents, maintenance, and resident communication into one simple, intelligent
              platform. End administrative chaos and gain full visibility of your properties.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/signup")} className="btn-hover-lift btn-hover-glow">
                See the AI in Action
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/signup")} className="btn-hover-lift">
                Book a Demo
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
          Trusted by leading property managers and condominiums
        </p>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {[
              "Skyline Properties",
              "Urban Living Co.",
              "Harbor View Estates",
              "Metropolitan Condos",
              "Riverside Management",
              "City Heights Group",
              "Coastal Property Partners",
              "Downtown Residences",
            ].map((partner, index) => (
              <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                <div className="flex items-center justify-center p-6">
                  <div className="text-center opacity-40 hover:opacity-60 transition-opacity">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">{partner}</p>
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
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Why Property Managers Choose Domly</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform chaos into clarity with intelligent automation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Automate Document Chaos</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our AI uses OCR to read, categorize, and organize all your documents—from insurance to invoices. It
              automatically sets renewal alerts so you never miss a critical deadline.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Gain Total Financial & Operational Control</h3>
            <p className="text-muted-foreground leading-relaxed">
              See all costs, maintenance schedules, and asset statuses in one intuitive dashboard. Stop guessing and
              start making data-driven decisions.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Unify Resident & Manager Communication</h3>
            <p className="text-muted-foreground leading-relaxed">
              Empower residents to report incidents (with photos) via the mobile app. Track resolutions in real-time and
              manage all communications in one place.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section ref={howItWorksRef} id="how-it-works" className="bg-background py-20 md:py-32 scroll-reveal-left">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How it Works?</h2>
            <p className="text-lg text-muted-foreground">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Upload Your Data</h3>
              <p className="text-muted-foreground">
                Automatically build your entire condominium and asset portfolio by uploading a simple Excel/CSV file.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Let the AI Organize</h3>
              <p className="text-muted-foreground">
                Drag and drop your existing documents. Domly's AI scans, tags, and organizes them, creating automatic
                maintenance and renewal alerts.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Manage with Clarity</h3>
              <p className="text-muted-foreground">
                Use your central dashboard to track maintenance, monitor costs, and communicate with residents. All from
                a single platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} id="pricing" className="container mx-auto px-4 py-20 md:py-32 scroll-reveal-right">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">Choose the plan that fits your property portfolio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
            <p className="text-sm text-muted-foreground mb-6">For small, self-managed condominiums</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">$49</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Up to 50 units</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Document Management</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">AI-Powered OCR</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Basic Dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Email Support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full btn-hover-lift" onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="bg-primary text-primary-foreground border-2 border-primary rounded-2xl p-8 relative shadow-xl scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-sm text-primary-foreground/80 mb-6">For professional property managers</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$149</span>
              <span className="text-primary-foreground/80">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Up to 200 units</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Advanced Document Management</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>AI-Powered OCR</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Financial Dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Resident Mobile App</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Priority Support</span>
              </li>
            </ul>
            <Button
              variant="secondary"
              className="w-full bg-background text-foreground hover:bg-background/90 btn-hover-lift btn-hover-glow"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
            <p className="text-sm text-muted-foreground mb-6">For large management portfolios</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">Custom</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Unlimited units</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">All Pro features</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Custom integrations</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">24/7 Premium Support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">On-premise deployment option</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full btn-hover-lift">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} id="testimonials" className="bg-background py-20 md:py-32 scroll-reveal">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Loved by Property Managers and Residents
            </h2>
            <p className="text-lg text-muted-foreground">See what our customers have to say</p>
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
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Everything you need to know about Domly</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                How long does implementation take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Most customers are up and running within 48 hours. Our rapid implementation process includes data import
                assistance and a personalized onboarding session.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. We use bank-level encryption, regular security audits, and comply with GDPR and SOC 2
                standards. Your data is stored in secure, redundant cloud infrastructure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                How does the AI and OCR work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI uses advanced optical character recognition to scan and extract information from documents. It
                learns from your data to automatically categorize files, set reminders, and flag important dates.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Is there a mobile app for residents?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Residents can download our mobile app for iOS and Android to report maintenance issues, view
                announcements, and communicate with property management directly.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                What kind of support is included?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All plans include email support and access to our knowledge base. Pro and Enterprise plans get priority
                support with faster response times and dedicated account management.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Simplify Your Condominium Management?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Get started with Domly's AI-powered platform today and turn administrative chaos into automated efficiency.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90 mb-4 btn-hover-lift btn-hover-glow"
            onClick={() => navigate("/signup")}
          >
            Start Your Free Trial Now
          </Button>
          <p className="text-sm text-primary-foreground/80">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
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
                AI-powered property management for modern condominiums.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#security" className="text-gray-400 hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#integrations" className="text-gray-400 hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#careers" className="text-gray-400 hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#blog" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#cookies" className="text-gray-400 hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2024 Domly. All rights reserved.</p>

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
    </div>
  );
};
