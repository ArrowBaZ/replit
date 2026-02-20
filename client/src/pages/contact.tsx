import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: t("messageSent") });
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-contact-title">{t("contactTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("contactFormDesc")}</p>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">contact@sellzy.fr</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("phone")}</p>
              <p className="text-sm font-medium">+33 1 23 45 67 89</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("address")}</p>
              <p className="text-sm font-medium">Paris, France</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("yourName")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-contact-name" />
              </div>
              <div className="space-y-2">
                <Label>{t("yourEmail")}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="input-contact-email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("subject")}</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required data-testid="input-contact-subject" />
            </div>
            <div className="space-y-2">
              <Label>{t("message")}</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4} className="resize-none" data-testid="input-contact-message" />
            </div>
            <Button type="submit" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={sending} data-testid="button-send-message">
              {sending ? "..." : t("sendMessage")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
