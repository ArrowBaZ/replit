import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  const { t, lang } = useI18n();

  const sections = lang === "fr" ? [
    { title: "1. Collecte des donnees", content: "Nous collectons les donnees personnelles que vous fournissez lors de votre inscription (nom, email, telephone, adresse) ainsi que les informations relatives aux articles que vous soumettez pour la revente." },
    { title: "2. Utilisation des donnees", content: "Vos donnees sont utilisees pour : gerer votre compte, faciliter la mise en relation avec les revendeurs, traiter les transactions, et ameliorer notre service." },
    { title: "3. Partage des donnees", content: "Nous ne vendons jamais vos donnees personnelles. Les informations de contact sont partagees uniquement entre vendeurs et revendeurs assortis dans le cadre d'une transaction." },
    { title: "4. Securite", content: "Nous mettons en oeuvre des mesures de securite techniques et organisationnelles appropriees pour proteger vos donnees personnelles contre tout acces non autorise, perte ou destruction." },
    { title: "5. Vos droits", content: "Conformement au RGPD, vous disposez d'un droit d'acces, de rectification, de suppression et de portabilite de vos donnees. Contactez-nous a privacy@sellzy.fr pour exercer vos droits." },
    { title: "6. Cookies", content: "Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour ameliorer votre experience. Vous pouvez gerer vos preferences de cookies dans les parametres de votre navigateur." },
    { title: "7. Conservation des donnees", content: "Vos donnees sont conservees tant que votre compte est actif. Apres suppression de votre compte, nous conservons certaines donnees pendant une duree limitee conformement a nos obligations legales." },
  ] : [
    { title: "1. Data Collection", content: "We collect personal data you provide during registration (name, email, phone, address) as well as information about items you submit for resale." },
    { title: "2. Data Usage", content: "Your data is used to: manage your account, facilitate matching with resellers, process transactions, and improve our service." },
    { title: "3. Data Sharing", content: "We never sell your personal data. Contact information is shared only between matched sellers and resellers as part of a transaction." },
    { title: "4. Security", content: "We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, loss, or destruction." },
    { title: "5. Your Rights", content: "Under GDPR, you have the right to access, rectify, delete, and port your data. Contact us at privacy@sellzy.fr to exercise your rights." },
    { title: "6. Cookies", content: "We use essential cookies for site operation and analytical cookies to improve your experience. You can manage your cookie preferences in your browser settings." },
    { title: "7. Data Retention", content: "Your data is retained as long as your account is active. After account deletion, we retain certain data for a limited period in accordance with our legal obligations." },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-privacy-title">{t("privacyTitle")}</h1>
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
