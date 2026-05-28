import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  const { t } = useI18n();

  const sections = [
    { title: t("termsSection1Title"), content: t("termsSection1Content") },
    { title: t("termsSection2Title"), content: t("termsSection2Content") },
    { title: t("termsSection3Title"), content: t("termsSection3Content") },
    { title: t("termsSection4Title"), content: t("termsSection4Content") },
    { title: t("termsSection5Title"), content: t("termsSection5Content") },
    { title: t("termsSection6Title"), content: t("termsSection6Content") },
    { title: t("termsSection7Title"), content: t("termsSection7Content") },
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
