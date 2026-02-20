import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="cursor-pointer" onClick={() => setOpen(!open)} data-testid={`faq-item-${question.slice(0, 20).replace(/\s/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{question}</p>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        {open && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{answer}</p>}
      </CardContent>
    </Card>
  );
}

export default function FaqPage() {
  const { t, lang } = useI18n();

  const faqs = lang === "fr" ? [
    { q: "Comment fonctionne Sellzy ?", a: "Sellzy met en relation des vendeurs de vetements avec des revendeurs experts. Vous soumettez une demande, un revendeur local est assigne, recupere vos articles, les evalue, les met en vente et vous recevez vos gains une fois vendus." },
    { q: "Quelle est la commission ?", a: "Le vendeur recoit 80% du prix de vente et le revendeur recoit 20%. Par exemple, si un article est vendu 100 EUR, le vendeur recoit 80 EUR et le revendeur 20 EUR." },
    { q: "Quels types de service proposez-vous ?", a: "Nous proposons trois services : Classic (ramassage et revente standard), Express (traitement prioritaire avec delai plus court), et SOS Dressing (nettoyage complet de garde-robe)." },
    { q: "Comment devenir revendeur ?", a: "Inscrivez-vous et selectionnez le role de revendeur. Votre candidature sera examinee par notre equipe sous 1 a 2 jours ouvrables." },
    { q: "Que se passe-t-il si un article ne se vend pas ?", a: "Si un article ne se vend pas apres un certain delai, il peut etre retourne au vendeur ou donne, selon votre accord avec le revendeur." },
    { q: "Comment sont proteges mes articles ?", a: "Chaque article est suivi dans notre systeme du ramassage a la vente. Vous pouvez voir le statut de chaque article a tout moment dans votre tableau de bord." },
  ] : [
    { q: "How does Sellzy work?", a: "Sellzy connects clothing sellers with expert resellers. You submit a request, a local reseller is assigned, picks up your items, evaluates them, lists them for sale, and you receive your earnings once sold." },
    { q: "What is the commission split?", a: "The seller receives 80% of the sale price and the reseller receives 20%. For example, if an item sells for 100 EUR, the seller gets 80 EUR and the reseller gets 20 EUR." },
    { q: "What service types do you offer?", a: "We offer three services: Classic (standard pickup and resale), Express (priority handling with faster turnaround), and SOS Dressing (full wardrobe cleanout)." },
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
