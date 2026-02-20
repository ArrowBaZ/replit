import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shirt, HandshakeIcon, TrendingUp, ArrowRight, Star, Shield, Zap } from "lucide-react";
import sellzyLogo from "@assets/sellzy_logo_bold_green_1771510604189.png";
import { useI18n } from "@/lib/i18n";

const heroImage = "/images/hero-fashion.png";

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();

  const features = [
    { icon: Shirt, title: t("featureExpertTitle"), description: t("featureExpertDesc") },
    { icon: HandshakeIcon, title: t("featureMatchingTitle"), description: t("featureMatchingDesc") },
    { icon: TrendingUp, title: t("featureEarningsTitle"), description: t("featureEarningsDesc") },
  ];

  const steps = [
    { number: "01", title: t("step1Title"), description: t("step1Desc") },
    { number: "02", title: t("step2Title"), description: t("step2Desc") },
    { number: "03", title: t("step3Title"), description: t("step3Desc") },
  ];

  const stats = [
    { value: "2,500+", label: t("itemsSold") },
    { value: "450+", label: t("happySellers") },
    { value: "120+", label: t("expertResellers") },
    { value: "85%", label: t("avgSellRate") },
  ];

  const testimonials = [
    { name: "Marie D.", role: t("seller"), text: t("testimonial1") },
    { name: "Thomas L.", role: t("reseller"), text: t("testimonial2") },
    { name: "Sophie B.", role: t("seller"), text: t("testimonial3") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <img src={sellzyLogo} alt="Sellzy" className="h-10" data-testid="text-brand-name" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover-elevate rounded-md px-3 py-2">{t("features")}</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover-elevate rounded-md px-3 py-2">{t("howItWorks")}</a>
              <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover-elevate rounded-md px-3 py-2">{t("testimonials")}</a>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => setLang("en")}
                  className={`rounded-md overflow-hidden transition-all ${lang === "en" ? "ring-2 ring-[hsl(var(--success))] scale-110" : "opacity-60 hover:opacity-100"}`}
                  data-testid="button-lang-en"
                  title="English"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="28" height="14">
                    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
                    <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
                    <g clipPath="url(#s)">
                      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
                      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
                      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                    </g>
                  </svg>
                </button>
                <button
                  onClick={() => setLang("fr")}
                  className={`rounded-md overflow-hidden transition-all ${lang === "fr" ? "ring-2 ring-[hsl(var(--success))] scale-110" : "opacity-60 hover:opacity-100"}`}
                  data-testid="button-lang-fr"
                  title="Francais"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="28" height="14">
                    <rect width="30" height="20" fill="#fff"/>
                    <rect width="10" height="20" fill="#002395"/>
                    <rect x="20" width="10" height="20" fill="#ED2939"/>
                  </svg>
                </button>
              </div>
              <ThemeToggle />
              <a href="/api/login">
                <Button variant="outline" data-testid="button-login">{t("logIn")}</Button>
              </a>
              <a href="/api/login">
                <Button className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-get-started">
                  {t("getStarted")}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Fashion items" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wider uppercase text-[hsl(var(--success))] mb-4">
              {lang === "fr" ? "La marketplace de revente mode" : "The Fashion Resale Marketplace"}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <a href="/api/login">
                <Button size="lg" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white text-base" data-testid="button-hero-cta">
                  {t("startSelling")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
                  {t("learnMore")}
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {lang === "fr" ? "Inscription gratuite" : "Free to join"}</span>
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> {lang === "fr" ? "Aucun frais initial" : "No upfront costs"}</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {lang === "fr" ? "Experts verifies" : "Verified experts"}</span>
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
              {t("whySellzy")}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              {t("betterWayToResell")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("featuresSubtitle")}
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
              {t("howItWorks")}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              {t("threeSimpleSteps")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("stepsSubtitle")}
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
              {t("testimonials")}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              {t("lovedBy")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((tm) => (
              <Card key={tm.name}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-[hsl(var(--success))] text-[hsl(var(--success))]" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{tm.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-muted">{tm.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{tm.name}</p>
                      <p className="text-xs text-muted-foreground">{tm.role}</p>
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
            {t("readyToStart")}
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto leading-relaxed">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/api/login">
              <Button size="lg" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" data-testid="button-cta-sell">
                {lang === "fr" ? "Je veux vendre" : "I Want to Sell"}
              </Button>
            </a>
            <a href="/api/login">
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground/30 bg-primary-foreground/10">
                {lang === "fr" ? "Je suis revendeur" : "I'm a Reseller"}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={sellzyLogo} alt="Sellzy" className="h-7" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-faq">{t("faq")}</Link>
              <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-contact">{t("contactUs")}</Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms">{t("termsOfService")}</Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy">{t("privacyPolicy")}</Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {t("allRightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}
