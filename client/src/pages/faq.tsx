import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeeTier } from "@shared/schema";

function FaqItem({ question, answer }: { question: string; answer: string | React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="cursor-pointer" onClick={() => setOpen(!open)} data-testid={`faq-item-${typeof question === "string" ? question.slice(0, 20).replace(/\s/g, "-") : "item"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{question}</p>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        {open && (
          <div className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {typeof answer === "string" ? <p>{answer}</p> : answer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommissionAnswer({ lang }: { lang: string }) {
  const { data: tiers = [], isLoading } = useQuery<FeeTier[]>({
    queryKey: ["/api/fee-tiers"],
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-md" />;
  }

  if (tiers.length === 0) {
    return lang === "fr" ? (
      <p>La commission varie selon le palier tarifaire applique au prix de vente. Consultez la page <strong>Structure des frais</strong> pour voir les paliers en vigueur.</p>
    ) : (
      <p>The commission varies based on the fee tier applied to the sale price. Visit the <strong>Fee Structure</strong> page to see the current tiers.</p>
    );
  }

  const sellerMin = Math.min(...tiers.map(t => parseFloat(t.sellerPercent as string)));
  const sellerMax = Math.max(...tiers.map(t => parseFloat(t.sellerPercent as string)));
  const resellerMin = Math.min(...tiers.map(t => parseFloat(t.marchantPercent as string)));
  const resellerMax = Math.max(...tiers.map(t => parseFloat(t.marchantPercent as string)));

  if (lang === "fr") {
    return (
      <div className="space-y-2" data-testid="text-commission-answer-fr">
        <p>
          La commission depend du palier tarifaire lie au prix de vente. Le vendeur recoit entre{" "}
          <strong>{sellerMin}%</strong> et <strong>{sellerMax}%</strong> du prix de vente, et le revendeur entre{" "}
          <strong>{resellerMin}%</strong> et <strong>{resellerMax}%</strong>.
        </p>
        <div className="mt-2 space-y-1">
          {tiers.map((tier) => {
            const seller = parseFloat(tier.sellerPercent as string);
            const reseller = parseFloat(tier.marchantPercent as string);
            const platform = parseFloat(tier.platformPercent as string);
            const from = tier.minPrice ? `€${parseFloat(tier.minPrice as string).toLocaleString("fr-CH")}` : "€0";
            const to = tier.maxPrice ? `€${parseFloat(tier.maxPrice as string).toLocaleString("fr-CH")}` : "et plus";
            return (
              <div key={tier.id} className="flex items-center justify-between rounded bg-muted/50 px-3 py-1.5" data-testid={`faq-tier-row-${tier.id}`}>
                <span className="text-xs font-medium">{tier.label} ({from} – {to})</span>
                <span className="text-xs">Vendeur <strong>{seller}%</strong> · Revendeur <strong>{reseller}%</strong> · Plateforme <strong>{platform}%</strong></span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="text-commission-answer-en">
      <p>
        The commission depends on the fee tier applied to the sale price. The seller receives between{" "}
        <strong>{sellerMin}%</strong> and <strong>{sellerMax}%</strong>, and the reseller receives between{" "}
        <strong>{resellerMin}%</strong> and <strong>{resellerMax}%</strong>.
      </p>
      <div className="mt-2 space-y-1">
        {tiers.map((tier) => {
          const seller = parseFloat(tier.sellerPercent as string);
          const reseller = parseFloat(tier.marchantPercent as string);
          const platform = parseFloat(tier.platformPercent as string);
          const from = tier.minPrice ? `€${parseFloat(tier.minPrice as string).toLocaleString("fr-CH")}` : "€0";
          const to = tier.maxPrice ? `€${parseFloat(tier.maxPrice as string).toLocaleString("fr-CH")}` : "and above";
          return (
            <div key={tier.id} className="flex items-center justify-between rounded bg-muted/50 px-3 py-1.5" data-testid={`faq-tier-row-${tier.id}`}>
              <span className="text-xs font-medium">{tier.label} ({from} – {to})</span>
              <span className="text-xs">Seller <strong>{seller}%</strong> · Reseller <strong>{reseller}%</strong> · Platform <strong>{platform}%</strong></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FaqPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const faqs = lang === "fr" ? [
    { q: "Comment fonctionne Sellzy ?", a: "Sellzy met en relation des vendeurs de vetements avec des revendeurs experts. Vous soumettez une demande, un revendeur local est assigne, recupere vos articles, les evalue, les met en vente et vous recevez vos gains une fois vendus." },
    { q: "Quelle est la commission ?", a: <CommissionAnswer lang="fr" /> },
    { q: "Quels types de service proposez-vous ?", a: "Nous proposons deux services : Classic (peu d'articles - ramassage et revente standard), et SOS (aide du marchand a evaluer tous les articles sur site)." },
    { q: "Comment devenir revendeur ?", a: "Inscrivez-vous et selectionnez le role de revendeur. Votre candidature sera examinee par notre equipe sous 1 a 2 jours ouvrables." },
    { q: "Que se passe-t-il si un article ne se vend pas ?", a: "Si un article ne se vend pas apres un certain delai, il peut etre retourne au vendeur ou donne, selon votre accord avec le revendeur." },
    { q: "Comment sont proteges mes articles ?", a: "Chaque article est suivi dans notre systeme du ramassage a la vente. Vous pouvez voir le statut de chaque article a tout moment dans votre tableau de bord." },
  ] : [
    { q: "How does Sellzy work?", a: "Sellzy connects clothing sellers with expert resellers. You submit a request, a local reseller is assigned, picks up your items, evaluates them, lists them for sale, and you receive your earnings once sold." },
    { q: "What is the commission split?", a: <CommissionAnswer lang="en" /> },
    { q: "What service types do you offer?", a: "We offer two services: Classic (few items - standard pickup and resale), and SOS (marchand helps assess all items on-site)." },
    { q: "How do I become a reseller?", a: "Sign up and select the reseller role. Your application will be reviewed by our team within 1-2 business days." },
    { q: "What happens if an item doesn't sell?", a: "If an item doesn't sell after a certain period, it can be returned to the seller or donated, depending on your agreement with the reseller." },
    { q: "How are my items protected?", a: "Every item is tracked in our system from pickup to sale. You can see the status of each item at any time in your dashboard." },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-faq-title">{t("faqTitle")}</h1>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} />
        ))}
      </div>
    </div>
  );
}
