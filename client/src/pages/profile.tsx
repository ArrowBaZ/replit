import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@shared/schema";
import { User, MapPin, Phone, Mail, Pencil, Save, Bell, Link as LinkIcon } from "lucide-react";

const PREF_KEYS = ["toast_agreement_ready", "toast_document_request", "toast_counter_offer", "toast_price_revised", "toast_meeting_update", "toast_item_pricing"] as const;
type PrefKey = typeof PREF_KEYS[number];

function getPref(prefs: Record<string, boolean> | null | undefined, key: PrefKey): boolean {
  if (!prefs || prefs[key] === undefined) return true;
  return prefs[key];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState<Partial<Profile>>({});

  const startEditing = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        department: profile.department || "",
        bio: profile.bio || "",
        experience: profile.experience || "",
        siretNumber: profile.siretNumber || "",
        vatNumber: profile.vatNumber || "",
        dviNumber: profile.dviNumber || "",
        leboncoinUrl: profile.leboncoinUrl || "",
        vintedUrl: profile.vintedUrl || "",
        ricardoUrl: profile.ricardoUrl || "",
      });
    }
    setEditing(true);
  };

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setEditing(false);
      toast({ title: t("profileCreated") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedUpdateProfile"), variant: "destructive" });
    },
  });

  const updatePrefs = useMutation({
    mutationFn: async (prefs: Record<string, boolean>) => {
      const res = await apiRequest("PATCH", "/api/profile", { notificationPrefs: prefs });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: t("notifPrefsSaved") });
    },
    onError: () => {
      toast({ title: t("error"), variant: "destructive" });
    },
  });

  const togglePref = (key: PrefKey, value: boolean) => {
    const current = profile?.notificationPrefs || {};
    updatePrefs.mutate({ ...current, [key]: value });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  const prefRows: { key: PrefKey; label: string; desc: string }[] = [
    {
      key: "toast_agreement_ready",
      label: t("notifPrefAgreementReady"),
      desc: t("notifPrefAgreementReadyDesc"),
    },
    {
      key: "toast_document_request",
      label: t("notifPrefDocRequest"),
      desc: t("notifPrefDocRequestDesc"),
    },
    {
      key: "toast_counter_offer",
      label: t("notifPrefCounterOffer"),
      desc: t("notifPrefCounterOfferDesc"),
    },
    {
      key: "toast_price_revised",
      label: t("notifPrefPriceRevised"),
      desc: t("notifPrefPriceRevisedDesc"),
    },
    {
      key: "toast_meeting_update",
      label: t("notifPrefMeetingUpdate"),
      desc: t("notifPrefMeetingUpdateDesc"),
    },
    {
      key: "toast_item_pricing",
      label: t("notifPrefItemPricing"),
      desc: t("notifPrefItemPricingDesc"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold" data-testid="text-profile-title">{t("profileTitle")}</h1>
        {!editing && (
          <Button variant="outline" onClick={startEditing} data-testid="button-edit-profile">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg bg-muted">
                {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-profile-name">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">{profile?.role || "unknown"}</Badge>
                {profile?.role === "marchand" && profile.status && (
                  <Badge variant="secondary" className={
                    profile.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    profile.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }>
                    {profile.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(formData); }} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input value={formData.phone || ""} onChange={(e) => updateField("phone", e.target.value)} data-testid="input-edit-phone" />
              </div>
              <div className="space-y-2">
                <Label>{t("address")}</Label>
                <Input value={formData.address || ""} onChange={(e) => updateField("address", e.target.value)} data-testid="input-edit-address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("city")}</Label>
                  <Input value={formData.city || ""} onChange={(e) => updateField("city", e.target.value)} data-testid="input-edit-city" />
                </div>
                <div className="space-y-2">
                  <Label>{t("postalCode")}</Label>
                  <Input value={formData.postalCode || ""} onChange={(e) => updateField("postalCode", e.target.value)} data-testid="input-edit-postal" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("department")}</Label>
                <Input value={formData.department || ""} onChange={(e) => updateField("department", e.target.value)} data-testid="input-edit-department" />
              </div>
              {profile?.role === "marchand" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("bio")}</Label>
                    <Textarea value={formData.bio || ""} onChange={(e) => updateField("bio", e.target.value)} className="resize-none" rows={3} data-testid="input-edit-bio" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("resaleExperience")}</Label>
                    <Textarea value={formData.experience || ""} onChange={(e) => updateField("experience", e.target.value)} className="resize-none" rows={3} data-testid="input-edit-experience" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("siretNumber")}</Label>
                    <Input value={formData.siretNumber || ""} onChange={(e) => updateField("siretNumber", e.target.value)} data-testid="input-edit-siret" />
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro TVA</Label>
                    <Input value={formData.vatNumber || ""} onChange={(e) => updateField("vatNumber", e.target.value)} data-testid="input-edit-vat" placeholder="FR00000000000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro DVI</Label>
                    <Input value={formData.dviNumber || ""} onChange={(e) => updateField("dviNumber", e.target.value)} data-testid="input-edit-dvi" placeholder="DVI-XXXXX" />
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Profils Plateforme</p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>URL Leboncoin</Label>
                        <Input value={formData.leboncoinUrl || ""} onChange={(e) => updateField("leboncoinUrl", e.target.value)} data-testid="input-edit-leboncoin" placeholder="https://www.leboncoin.fr/boutique/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Vinted</Label>
                        <Input value={formData.vintedUrl || ""} onChange={(e) => updateField("vintedUrl", e.target.value)} data-testid="input-edit-vinted" placeholder="https://www.vinted.fr/member/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Ricardo</Label>
                        <Input value={formData.ricardoUrl || ""} onChange={(e) => updateField("ricardoUrl", e.target.value)} data-testid="input-edit-ricardo" placeholder="https://www.ricardo.ch/..." />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={updateProfile.isPending} data-testid="button-save-profile">
                  <Save className="h-4 w-4 mr-2" /> {updateProfile.isPending ? t("saving") : t("saveChanges")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t("back")}</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {profile?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-profile-phone">{profile.phone}</span>
                </div>
              )}
              {(profile?.address || profile?.city) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span data-testid="text-profile-address">
                    {[profile?.address, profile?.city, profile?.postalCode, profile?.department].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {profile?.bio && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("bio")}</p>
                  <p className="text-sm" data-testid="text-profile-bio">{profile.bio}</p>
                </div>
              )}
              {profile?.experience && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("resaleExperience")}</p>
                  <p className="text-sm" data-testid="text-profile-experience">{profile.experience}</p>
                </div>
              )}
              {(profile?.siretNumber || profile?.vatNumber || profile?.dviNumber) && (
                <div className="border rounded-md p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Codes de vérification</p>
                  {profile?.siretNumber && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">SIRET</p>
                      <p className="text-sm font-mono" data-testid="text-profile-siret">{profile.siretNumber}</p>
                    </div>
                  )}
                  {profile?.vatNumber && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">TVA</p>
                      <p className="text-sm font-mono" data-testid="text-profile-vat">{profile.vatNumber}</p>
                    </div>
                  )}
                  {profile?.dviNumber && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">DVI</p>
                      <p className="text-sm font-mono" data-testid="text-profile-dvi">{profile.dviNumber}</p>
                    </div>
                  )}
                </div>
              )}
              {(profile?.leboncoinUrl || profile?.vintedUrl || profile?.ricardoUrl) && (
                <div className="border rounded-md p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profils Plateforme</p>
                  {profile?.leboncoinUrl && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a href={profile.leboncoinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate" data-testid="link-leboncoin">Leboncoin</a>
                    </div>
                  )}
                  {profile?.vintedUrl && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a href={profile.vintedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate" data-testid="link-vinted">Vinted</a>
                    </div>
                  )}
                  {profile?.ricardoUrl && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a href={profile.ricardoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate" data-testid="link-ricardo">Ricardo</a>
                    </div>
                  )}
                </div>
              )}
              {!profile?.phone && !profile?.address && !profile?.bio && (
                <p className="text-sm text-muted-foreground">No additional information added yet. Click Edit to add your details.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-notification-prefs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            {t("notifPrefsTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("notifPrefsDesc")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefRows.map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={getPref(profile?.notificationPrefs, key)}
                onCheckedChange={(val) => togglePref(key, val)}
                disabled={updatePrefs.isPending}
                data-testid={`switch-notif-pref-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
