import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shirt, HandshakeIcon, TrendingUp, ArrowRight, Star, Shield, Zap } from "lucide-react";

const heroImage = "/images/hero-fashion.png";

const features = [
  {
    icon: Shirt,
    title: "Curated Resale",
    description: "Expert resellers evaluate, price, and list your clothing on the best platforms for maximum return.",
  },
  {
    icon: HandshakeIcon,
    title: "Personal Matching",
    description: "Get matched with a local Reusse expert based on your location and the type of items you have.",
  },
  {
    icon: TrendingUp,
    title: "Transparent Earnings",
    description: "Track every item from pickup to sale. See exactly what you earn with our clear commission structure.",
  },
];

const steps = [
  {
    number: "01",
    title: "Submit a Request",
    description: "Tell us about your clothing items, preferred service type, and your location.",
  },
  {
    number: "02",
    title: "Meet Your Reusse",
    description: "A verified resale expert near you picks up and evaluates your items in person.",
  },
  {
    number: "03",
    title: "Earn from Sales",
    description: "Your Reusse lists items on premium platforms. You get paid when they sell.",
  },
];

const stats = [
  { value: "2,500+", label: "Items Sold" },
  { value: "450+", label: "Happy Sellers" },
  { value: "120+", label: "Expert Reusses" },
  { value: "85%", label: "Avg. Sell Rate" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--success))] text-white font-bold text-sm">
                R
              </div>
              <span className="text-xl font-bold tracking-tight" data-testid="text-brand-name">Reusses</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover-elevate rounded-md px-3 py-2">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover-elevate rounded-md px-3 py-2">How It Works</a>
              <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover-elevate rounded-md px-3 py-2">Testimonials</a>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/login">
                <Button variant="outline" data-testid="button-login">Log In</Button>
              </a>
              <a href="/api/login">
                <Button className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-get-started">
                  Get Started
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Fashion items"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wider uppercase text-[hsl(var(--success))] mb-4">
              The Fashion Resale Marketplace
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Turn Your Wardrobe Into Earnings
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
              Connect with expert resellers who handle everything — from pricing to listing to selling. 
              You sit back and earn.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <a href="/api/login">
                <Button size="lg" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white text-base" data-testid="button-hero-cta">
                  Start Selling
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
                  Learn More
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Free to join</span>
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> No upfront costs</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Verified experts</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium tracking-wider uppercase text-[hsl(var(--success))] mb-3">
              Why Reusses
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              A Better Way to Resell
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We connect sellers with trusted, local resale experts who do the hard work for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-md bg-[hsl(var(--success)/0.1)] flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-[hsl(var(--success))]" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium tracking-wider uppercase text-[hsl(var(--success))] mb-3">
              How It Works
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Three Simple Steps
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              From closet to cash in just a few steps. Our Reusses handle the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-serif font-bold text-[hsl(var(--success)/0.15)] mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium tracking-wider uppercase text-[hsl(var(--success))] mb-3">
              Testimonials
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Loved by Sellers and Reusses
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Marie D.", role: "Seller", text: "I cleared out my closet and made over 800 euros without lifting a finger. My Reusse was professional, friendly, and got great prices." },
              { name: "Thomas L.", role: "Reusse", text: "As a reseller, this platform gives me a steady stream of quality items and handles the logistics. I've grown my business 3x." },
              { name: "Sophie B.", role: "Seller", text: "The transparency is amazing. I can see exactly where each item is in the process and what I'll earn. Highly recommend!" },
            ].map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-[hsl(var(--success))] text-[hsl(var(--success))]" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-muted">{t.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto leading-relaxed">
            Join thousands of sellers and resale experts on the platform that makes fashion resale simple, transparent, and profitable.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/api/login">
              <Button size="lg" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-cta-sell">
                I Want to Sell
              </Button>
            </a>
            <a href="/api/login">
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground/30 bg-primary-foreground/10">
                I'm a Reseller
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--success))] text-white font-bold text-xs">
                R
              </div>
              <span className="text-sm font-semibold">Reusses</span>
            </div>
            <p className="text-xs text-muted-foreground">
              2026 Reusses. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
