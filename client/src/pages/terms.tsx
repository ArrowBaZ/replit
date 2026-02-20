import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  const { t, lang } = useI18n();

  const sections = lang === "fr" ? [
    { title: "1. Acceptation des conditions", content: "En utilisant Sellzy, vous acceptez ces conditions d'utilisation. Si vous n'etes pas d'accord avec l'une de ces conditions, veuillez ne pas utiliser notre service." },
    { title: "2. Description du service", content: "Sellzy est une plateforme de mise en relation entre vendeurs de vetements et revendeurs experts. Nous facilitons le processus de revente en proposant des outils de gestion, de suivi et de communication." },
    { title: "3. Inscription et comptes", content: "Pour utiliser Sellzy, vous devez creer un compte. Vous etes responsable de la confidentialite de vos informations de connexion et de toutes les activites effectuees sous votre compte." },
    { title: "4. Commission et paiements", content: "La commission standard est de 80% pour le vendeur et 20% pour le revendeur sur chaque vente. Les paiements sont traites apres confirmation de la vente par les deux parties." },
    { title: "5. Responsabilites des utilisateurs", content: "Les vendeurs doivent fournir des descriptions exactes de leurs articles. Les revendeurs doivent traiter les articles avec soin et les lister a des prix justes. Tout comportement frauduleux entrainera la suspension du compte." },
    { title: "6. Limitation de responsabilite", content: "Sellzy agit comme intermediaire et n'est pas responsable des transactions directes entre vendeurs et revendeurs. Nous ne garantissons pas la vente des articles." },
    { title: "7. Modification des conditions", content: "Nous nous reservons le droit de modifier ces conditions a tout moment. Les utilisateurs seront informes des changements importants par email ou notification dans l'application." },
  ] : [
    { title: "1. Acceptance of Terms", content: "By using Sellzy, you agree to these terms of service. If you do not agree with any of these terms, please do not use our service." },
    { title: "2. Service Description", content: "Sellzy is a platform connecting clothing sellers with expert resellers. We facilitate the resale process by providing management, tracking, and communication tools." },
    { title: "3. Registration and Accounts", content: "To use Sellzy, you must create an account. You are responsible for the confidentiality of your login information and all activities performed under your account." },
    { title: "4. Commission and Payments", content: "The standard commission is 80% for the seller and 20% for the reseller on each sale. Payments are processed after both parties confirm the sale." },
    { title: "5. User Responsibilities", content: "Sellers must provide accurate descriptions of their items. Resellers must handle items with care and list them at fair prices. Any fraudulent behavior will result in account suspension." },
    { title: "6. Limitation of Liability", content: "Sellzy acts as an intermediary and is not responsible for direct transactions between sellers and resellers. We do not guarantee the sale of items." },
    { title: "7. Modification of Terms", content: "We reserve the right to modify these terms at any time. Users will be informed of important changes by email or notification in the application." },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-terms-title">{t("termsTitle")}</h1>
      <Card>
        <CardContent className="p-6 space-y-6">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-sm font-semibold mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
