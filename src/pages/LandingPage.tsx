import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, FileText, TrendingUp, MessageSquare } from 'lucide-react';
import dashboardMockup from '@/assets/dashboard-mockup.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-hero-gradient-start to-hero-gradient-end">
      {/* Header */}
      <header className="container mx-auto px-4 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Domly</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex gap-3 items-center">
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-sm">
              Login
            </Button>
            <Button onClick={() => navigate('/signup')} className="text-sm">
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-primary">Automate</span> Your<br />
              Property<br />
              Management with<br />
              AI.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Domly centralizes all your documents, maintenance, and resident communication into one simple, intelligent platform. End administrative chaos and gain full visibility of your properties.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate('/signup')}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/signup')}>
                Book a Demo
              </Button>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={dashboardMockup} 
                alt="Domly Dashboard Interface" 
                className="w-full h-auto"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl -z-10 transform translate-y-8"></div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-12">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by leading property managers and condominiums
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-muted h-12 w-24 rounded"></div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Property Managers Choose Domly
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform chaos into clarity with intelligent automation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Automate Document Chaos
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Our AI uses OCR to read, categorize, and organize all your documents—from insurance to invoices. It automatically sets renewal alerts so you never miss a critical deadline.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Gain Total Financial & Operational Control
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              See all costs, maintenance schedules, and asset statuses in one intuitive dashboard. Stop guessing and start making data-driven decisions.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Unify Resident & Manager Communication
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Empower residents to report incidents (with photos) via the mobile app. Track resolutions in real-time and manage all communications in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Domly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Domly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
